import time
import uuid
from app.util.jwt import createJWT
import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from .util.APIclient import APIClient
from .util.Models import create_schema
from .util import Schemas, types
# from .util.jwt import createJWT
from .Crud.Crud import Crud
from .api.v1 import users, table, questions, units, courses, user_code, services
JOB_SERVER_URI = os.environ.get('JOB_SERVER_URI') if os.environ.get(
    'JOB_SERVER_URI') else '0.0.0.0'
JOB_SERVER_PORT = int(os.environ.get('JOB_SERVER_PORT')
                      ) if os.environ.get('JOB_SERVER_PORT') else 1234

app = FastAPI()

origins = [
    "*",
]

database = Crud()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router=users.router, prefix='/api/v1')
app.include_router(router=questions.router, prefix='/api/v1')
app.include_router(router=units.router)
app.include_router(router=courses.router)
app.include_router(router=user_code.router)
app.include_router(router=services.router)
app.include_router(router=table.router)

# --------------------------- custom middleware --------------------------------


@app.post("/api/v1/execute_code")
def execute(executionOrder: Schemas.ExecutionOrder, user: types.User = Depends()):
    start = time.time()
    question_data, err = database.get_question_data(executionOrder.question_id)
    print(f'Query 1: {time.time()-start}')

    q_data = {}
    q_data['calls'] = question_data['calls']
    q_data['operators'] = question_data['operators']
    q_data['problem'] = question_data['name']
    q_data['timeout'] = question_data['timeout']
    q_data['hint type'] = 'c'
    q_data['epsilon'] = 0
    q_data['imports'] = question_data['allowed_imports']
    q_data['required'] = question_data['required_structures']
    print(
        f"question_data['illegal_structures'] {question_data['illegal_structures']}")
    q_data['illegal'] = question_data['illegal_structures']
    q_data['test cases'] = []
    for case in question_data['input_outputs']:
        i = str(case['input'])
        o = str(case['output'])
        try:
            i = json.loads(case['input'])
        except Exception as e:
            pass
        try:
            o = json.loads(case['output'])
        except Exception as e:
            pass
        q_data['test cases'].append(
            {'in': i, 'out': o})
    q_data['solutions'] = []
    for sample in question_data['sample_solutions']:
        q_data['solutions'].append(str(sample['source']))

    user_code, err = database.user_code_for_execution(
        question_id=executionOrder.question_id, user_id=user.id)
    if err:
        raise HTTPException(status_code=500, detail=err)

    with open('object.json', 'w') as f:
        f.write(json.dumps(q_data))

    apiClient = APIClient()
    apiClient.connect(JOB_SERVER_URI, JOB_SERVER_PORT)
    apiClient.send({'type': 'create_job',
                    'obj': q_data,
                    'program': user_code['source'],
                    'question_id': executionOrder.question_id,
                    'unit_id': executionOrder.unit_id,
                    'pool_id': executionOrder.pool_id,
                    'course_id': executionOrder.course_id,
                    'start_version': user_code['start_version'],
                    'end_version': user_code['versionId']
                    })
    job_id = apiClient.recv()

    return {'job_id': job_id}


@app.get('/api/v1/job_status')
def job_status(job_id: str, user: types.User = Depends()):
    apiClient = APIClient()
    apiClient.connect(JOB_SERVER_URI, JOB_SERVER_PORT)
    apiClient.send({'type': 'get_job', 'uuid': job_id})
    job = apiClient.recv()
    with open('job_results.json', 'w') as f:
        f.write(json.dumps(job))
    if job['status'] == 'exit' and job['exit_status'] == 0:
        passed = 0
        for val in job['results']['tests'].values():
            if val['Pass']:
                passed += 1
        total = len(job['results']['tests'].keys())
        job['results']['cases_passed'] = passed
        job['results']['total_cases'] = total
        job['results']['cases_failed'] = total - passed
        code_run, e1 = database.create_code_run(
            question_id=job['question_id'],
            user=user,
            flagged=job['results']['flag'],
            runtime=job['results']['runtime'],
            cases_passed=passed,
            total_cases=total,
            start_version=job['start_version'],
            end_version=job['end_version']
        )
        if e1:
            raise HTTPException(status_code=500, detail=e1)
        userQuestionCompleted, err = database.upsert_question_status(
            user, job['question_id'])
        if err:
            raise HTTPException(status_code=500, detail=err)

        return {
            'results': job['results'],
            'code_run': code_run,
            'userQuestionCompleted': userQuestionCompleted,
            'question_id': job['question_id'],
            'unit_id': job['unit_id'],
            'course_id': job['course_id']
        }
    else:
        total = len(job['results']['tests'].keys())
        job['results']['cases_passed'] = 0
        job['results']['total_cases'] = total
        job['results']['cases_failed'] = total
        return job


@app.post('/api/v1/authenticate')
def authenticate(credentials: Schemas.Credentials):
    try:
        if credentials.username == 'demo' and credentials.id:
            identity = database.authenticate_user(
                credentials.username, credentials.password, credentials.id)
        elif credentials.username == 'demo':
            identity = database.create_demo_user()
        else:
            identity = database.authenticate_user(
                credentials.username, credentials.password, credentials.id)
        if identity is None:
            return { 'id': None, 'username': None, 'type': None, 'rawJWT': None, 'message': 'Login failed. No user with those credentials exists.' }
        jwt = createJWT(identity)
        identity['rawJWT'] = jwt
        return identity
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == '__main__':
    create_schema()
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
