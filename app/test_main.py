import uuid
from fastapi.testclient import TestClient

from app.util import Schemas, linting
from app.util.Models import Category, Code_Run, Course, CoursePrerequisite, Enrolled, IllegalStructure, Import, Pool, PoolPrerequisites, PoolQuestion, Question, QuestionCategory, QuestionImport, QuestionInputOutput, RequiredStructure, Sample, Structure, Unit, UnitCategory, UnitPrerequisite, User, User_Code, UserPoolQuestion, UserQuestionCompleted
from .main import app, database

client = TestClient(app)

base_url = '/api/v1'

qid = uuid.uuid4().hex


def test_fetch_table():
    response = client.get('/api/v1/tables?table=users')
    assert response.status_code == 200


def test_read_main():
    response = client.get("/test")
    assert response.status_code == 200


def test_create_table():
    response = client.post('/api/v1/objects?tablename=users',
                           json=[{'username': '21659584', 'type': 'lecturer'}])
    assert response.status_code == 200

    ids = list(map(lambda x: {'id': x['id']}, response.json()))
    response = client.delete('/api/v1/objects?tablename=users', json=ids)
    assert response.status_code == 200


def test_create_table_fail():
    response = client.post('/api/v1/objects?tablename=use',
                           json=[{'username': '21659584', 'type': 'student'}])
    assert response.status_code == 500


def test_delete_from_unknown_table():
    response = client.delete(
        '/api/v1/objects?tablename=does_not_exist', json=[{'id': '222'}])
    assert response.status_code == 500


def test_linting1():
    results = {'errors': None}
    linting.lint('def x:', results)
    assert results['errors'] is not None


def test_liting2():
    results = {'errors': None}
    linting.lint('a = 1', results)
    assert results['errors'] is None


def test_liting3():
    results = {'errors': None}
    linting.lint(source='a = 1', results=results, function=True)
    assert results['errors'] is not None


def test_liting4():
    results = {'errors': None}
    linting.lint(source='def f(x):\n\treturn 1',
                 results=results, function=True)
    assert results['errors'] is None


def test_create_user():
    # Creating user
    username = uuid.uuid4().hex
    response = client.post(
        '/api/v1/objects?tablename=users', json=[{'username': username, 'type': 'none'}])
    assert response.status_code == 200


def test_delete_user():
    response = client.get('/api/v1/tables?table=users')
    assert response.status_code == 200
    response = response.json()
    print(response)
    ids = []
    for item in response:
        if item['type'] == 'none':
            ids.append({'id': item['id']})

    # Deleting user
    response = client.delete(
        '/api/v1/objects?tablename=users', json=ids)
    assert response.status_code == 200


# def test_create_course():
#     random_name = uuid.uuid4().hex
#     course = {"id": uuid.uuid4().hex,
#               "units": [], "name": random_name, "prerequisites": [], "categories": []}

#     response = client.get('/api/v1/tables?table=courses')
#     assert response.status_code == 200
#     count = len(response.json())

#     response = client.post('/api/v1/courses', json=[course])
#     assert response.status_code == 200
#     assert len(response.json()) == 1
#     course_id = response.json()[0]['id']
#     response = client.post('/api/v1/courses', json=[course])
#     assert response.status_code == 200

#     response = client.get('/api/v1/tables?table=courses')
#     assert response.status_code == 200
#     assert len(response.json()) == count + 1

#     response = client.delete('/api/v1/objects?tablename=courses', json=[{id: course_id}])
#     assert response.status_code == 200

#     response = client.get('/api/v1/tables?table=courses')
#     assert response.status_code == 200
#     assert len(response.json()) == count

#     response = client.delete('/api/v1/courses', json=[course_id])
#     assert response.status_code == 500


def test_enroll_user():
    random_name = uuid.uuid4().hex
    course = {"id": uuid.uuid4().hex,
              "units": [], "name": random_name, "prerequisites": [], "categories": []}
    username = '21659583'
    response = client.post(
        '/api/v1/objects?tablename=users', json=[{'username': username, 'type': 'none'}])
    assert response.status_code == 200
    print(response.json())
    user_id = response.json()[0]['id']

    response = client.post('/api/v1/courses', json=[course])
    assert response.status_code == 200
    assert len(response.json()) == 1
    course_id = response.json()[0]['id']

    response = client.post(f'/api/v1/courses/{course_id}/enroll')
    print(response.json())
    assert response.status_code == 200

    response = client.delete(
        '/api/v1/objects?tablename=users', json=[{'id': user_id}])
    assert response.status_code == 200

    response = client.delete(
        '/api/v1/objects?tablename=courses', json=[{'id': course_id}])
    assert response.status_code == 200


def test_course_prerequisites_as_dict():
    course_prereqs = CoursePrerequisite()
    course_prereqs.fromCourseId = '1234'
    course_prereqs.toCourseId = '1234'
    obj = course_prereqs.as_dict()
    assert obj['fromCourseId'] == '1234'
    assert obj['toCourseId'] == '1234'


def test_course_prerequisites_repr():
    course_prereqs = CoursePrerequisite()
    course_prereqs.fromCourseId = '1234'
    course_prereqs.toCourseId = '1234'
    string = repr(course_prereqs)
    assert type(string) == str


def test_course_as_dict():
    course = Course()
    course.name = 'test'
    obj = course.as_dict()
    assert obj['name'] == 'test'


def test_course_repr():
    course = Course()
    course.name = 'test'
    representation = repr(course)
    assert type(representation) == str


def test_UnitPrerequisite_as_dict():
    unit_prereq = UnitPrerequisite()
    unit_prereq.fromUnitId = '1'
    obj = unit_prereq.as_dict()
    assert obj['fromUnitId'] == '1'


def test_UnitPrerequisite_repr():
    unit_prereq = UnitPrerequisite()
    unit_prereq.fromUnitId = '1'
    representation = repr(unit_prereq)
    assert type(representation) == str


def test_PoolQuestion_as_dict():
    pool_q = PoolQuestion()
    pool_q.fromPoolId = '1'
    obj = pool_q.as_dict()
    assert obj['fromPoolId'] == '1'


def test_PoolQuestion_repr():
    pool_q = PoolQuestion()
    pool_q.fromPoolId = '1'
    representation = repr(pool_q)
    assert type(representation) == str


def test_UnitCategory_as_dict():
    unit_c = UnitCategory()
    unit_c.fromUnitId = '1'
    obj = unit_c.as_dict()
    assert obj['fromUnitId'] == '1'


def test_UnitCategory_repr():
    unit_c = UnitCategory()
    unit_c.fromUnitId = '1'
    representation = repr(unit_c)
    assert type(representation) == str


def test_UserQuestionCompleted_as_dict():
    uqc = UserQuestionCompleted()
    uqc.id = '1'
    obj = uqc.as_dict()
    assert obj['id'] == '1'


def test_UserQuestionCompleted_repr():
    uqc = UserQuestionCompleted()
    uqc.id = '1'
    representation = repr(uqc)
    assert type(representation) == str


def test_PoolPrerequisites_as_dict():
    pp = PoolPrerequisites()
    pp.id = '1'
    obj = pp.as_dict()
    assert obj['id'] == '1'


def test_PoolPrerequisites_repr():
    pp = PoolPrerequisites()
    pp.id = '1'
    representation = repr(pp)
    assert type(representation) == str


def test_UserPoolQuestion_as_dict():
    upq = UserPoolQuestion()
    upq.id = '1'
    obj = upq.as_dict()
    assert obj['id'] == '1'


def test_UserPoolQuestion_repr():
    upq = UserPoolQuestion()
    upq.id = '1'
    representation = repr(upq)
    assert type(representation) == str


def test_Pool_as_dict():
    pool = Pool()
    pool.id = '1'
    obj = pool.as_dict()
    assert obj['id'] == '1'


def test_Pool_repr():
    pool = Pool()
    pool.id = '1'
    representation = repr(pool)
    assert type(representation) == str


def test_Unit_as_dict():
    _unit = Unit()
    _unit.id = '1'
    obj = _unit.as_dict()
    assert obj['id'] == '1'


def test_Unit_repr():
    _unit = Unit()
    _unit.id = '1'
    representation = repr(_unit)
    assert type(representation) == str


def test_Enrolled_as_dict():
    e = Enrolled()
    e.id = '1'
    obj = e.as_dict()
    assert obj['id'] == '1'


def test_Enrolled_repr():
    e = Enrolled()
    e.id = '1'
    representation = repr(e)
    assert type(representation) == str


def test_User_as_dict():
    e = User()
    e.id = '1'
    obj = e.as_dict()
    assert obj['id'] == '1'


def test_User_repr():
    e = User()
    e.id = '1'
    representation = repr(e)
    assert type(representation) == str


def test_QuestionCategory_as_dict():
    qc = QuestionCategory()
    qc.id = '1'
    obj = qc.as_dict()
    assert obj['id'] == '1'


def test_QuestionCategory_repr():
    qc = QuestionCategory()
    qc.id = '1'
    representation = repr(qc)
    assert type(representation) == str


def test_QuestionImport_as_dict():
    qi = QuestionImport()
    qi.id = '1'
    obj = qi.as_dict()
    assert obj['id'] == '1'


def test_QuestionImport_repr():
    qi = QuestionImport()
    qi.id = '1'
    representation = repr(qi)
    assert type(representation) == str


def test_Structure_as_dict():
    struct = Structure()
    struct.name = '1'
    obj = struct.as_dict()
    assert obj['name'] == '1'


def test_Structure_repr():
    struct = Structure()
    struct.id = '1'
    representation = repr(struct)
    assert type(representation) == str


def test_RequiredStructure_as_dict():
    struct = RequiredStructure()
    struct.id = '1'
    obj = struct.as_dict()
    assert obj['id'] == '1'


def test_RequiredStructure_repr():
    struct = RequiredStructure()
    struct.id = '1'
    representation = repr(struct)
    assert type(representation) == str


def test_IllegalStructure_as_dict():
    struct = IllegalStructure()
    struct.id = '1'
    obj = struct.as_dict()
    assert obj['id'] == '1'


def test_IllegalStructure_repr():
    struct = IllegalStructure()
    struct.id = '1'
    representation = repr(struct)
    assert type(representation) == str


def test_Question_as_dict():
    que = Question()
    que.id = '1'
    que.allowed_imports = [Import(name='test')]
    que.input_outputs = [QuestionInputOutput(input='1', output='1')]
    que.categories = [Category(name='category')]
    que.creator = User(username='simon')
    que.allowed_imports = [Import(name='urllib')]
    que.required_structures = [Structure(name='for')]
    que.illegal_structures = [Structure(name='while')]
    que.user_code_instances = [User_Code(source='test = 1')]
    que.sample_solutions = [Sample(source='return 1')]
    obj = que.as_dict()
    assert obj['id'] == '1'



# def test_create_general_list():
#     question = {
#         'id': qid,
#         'name': 'test question',
#         'description': 'just a test q',
#         'stdout': False,
#         'stderr': False,
#         'illegal_structures': [],
#         'required_structures': [],
#         'input_outputs': [
#             {'input': '1', 'output': '1'}
#         ],
#         'sample_solutions': [],
#         'allowed_imports': [],
#         'template': '',
#         'categories': [],
#         'operators': [],
#         'calls': [],
#         'linting': False,
#         'timeout': 2,
#     }
#     crud = Crud()
#     question_list = crud.session.query(
#         Question).filter_by(name='test question').all()
#     for q in question_list:
#         crud.session.delete(q)
#     crud.session.commit()
#     q = Schemas.Question.parse_obj(question)
#     crud.create_table('questions', [q])


# def test_code_execution():
#     response = client.post('/api/v1/execute_code', json={
#         'question_id': '36f90f4690d64212b9a453374629dec5',
#         'unit_id': '19fed43d29374140827c07e5241efd86',
#         'pool_id': '4b9bfc33bae04cfa9a94effa83999cb1',
#         'course_id': 'aca9843d3ee84e81b57c102d6dd44cc9',
#     })

def test_Question_repr():
    que = Question()
    que.id = '1'
    representation = repr(que)
    assert type(representation) == str


def test_QuestionInputOutput_as_dict():
    qio = QuestionInputOutput()
    qio.id = '1'
    obj = qio.as_dict()
    assert obj['id'] == '1'


def test_QuestionInputOutput_repr():
    qio = QuestionInputOutput()
    qio.id = '1'
    representation = repr(qio)
    assert type(representation) == str


def test_Sample_as_dict():
    smap = Sample()
    smap.id = '1'
    obj = smap.as_dict()
    assert obj['id'] == '1'


def test_Sample_repr():
    smap = Sample()
    smap.id = '1'
    representation = repr(smap)
    assert type(representation) == str


def test_Import_as_dict():
    imprt = Import()
    imprt.name = '1'
    obj = imprt.as_dict()
    assert obj['name'] == '1'


def test_Import_repr():
    imprt = Import()
    imprt.name = '1'
    representation = repr(imprt)
    assert type(representation) == str


def test_Category_as_dict():
    cta = Category()
    cta.name = '1'
    obj = cta.as_dict()
    assert obj['name'] == '1'


def test_Category_repr():
    cta = Category()
    cta.name = '1'
    representation = repr(cta)
    assert type(representation) == str


def test_User_Code_as_dict():
    usc = User_Code()
    usc.id = '1'
    obj = usc.as_dict()
    assert obj['id'] == '1'


def test_User_Code_repr():
    usc = User_Code()
    usc.id = '1'
    representation = repr(usc)
    assert type(representation) == str


def test_Code_Run_as_dict():
    codrun = Code_Run()
    codrun.id = '1'
    obj = codrun.as_dict()
    assert obj['id'] == '1'


def test_Code_Run_repr():
    codrun = Code_Run()
    codrun.id = '1'
    representation = repr(codrun)
    assert type(representation) == str

# def test_enroll_user2():
#     username = '21659583'
#     response = client.post(
#         '/api/v1/users', json=[{'username': username, 'type': 'none'}])
#     assert response.status_code == 200
#     user_id = response.json()[0]['id']
#     course_id = uuid.uuid4().hex

#     response = client.post(f'/api/v1/courses/{course_id}/enroll')
#     print(response.json())
#     assert response.status_code == 500

#     response = client.delete('/api/v1/users', json=[user_id])
#     assert response.status_code == 200

# def test_update_course():
#     random_name = uuid.uuid4().hex
#     course = {"id": "a19ceedd-cfac-4737-9b19-ae56d0ddb556",
#               "units": [], "name": random_name, "prerequisites": [], "categories": []}
#     response = client.post('/api/v1/courses', json=[course])
#     assert response.status_code == 200
#     course_id = response.json()[0]['id']

#     reponse = client.put('/api/v1/courses', json=course)
#     assert response.status_code == 200

#     response = client.delete('/api/v1/courses', json=[course_id])
#     assert response.status_code == 200

#     response = client.put('/api/v1/courses', json=course)
