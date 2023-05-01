import axios, { AxiosResponse, AxiosStatic } from 'axios'
import { user, question, unit, io, example, sample, course } from '.'
import store from '../store'

declare global {
    interface Window {
        _env_: any;
    }
}
let token: string | undefined = undefined
const instance = axios.create({
    baseURL: window._env_ ? window._env_.API_URL : 'http://localhost:8000',
})

instance.interceptors.request.use((config) => {
    if (config.headers) {
        config.headers['Authorization'] = 'Bearer ' + localStorage.getItem('token');
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

store.subscribe(() => { })

const users = {
    get: async (): Promise<AxiosResponse<user[], any>> => instance.get<user[]>('/api/v1/users'),
    delete: async (users: number[]): Promise<AxiosResponse<any, any>> => instance.delete('/api/v1/users', { data: users }),
    create: async (users: [user]): Promise<AxiosResponse<[user], any>> => instance.post<[user]>('/api/v1/users', users)
}

const auth = {
    login: (username: string): Promise<AxiosResponse<user>> => instance.get<user>(`/login?username=${username}`)
}

const questions = {
    get: (): Promise<AxiosResponse<question[]>> => instance.get('/api/v1/questions'),
    get_question: (questionId: number): Promise<AxiosResponse<question>> => instance.get(`/api/v1/questions/${questionId}`),
    delete: (questions: number[]): Promise<AxiosResponse<number[]>> => instance.delete('/api/v1/questions', { data: questions }),
    create: (questions: question[]): Promise<AxiosResponse<question>> => instance.post('/api/v1/questions', questions),
    update: (question: question): Promise<AxiosResponse<any>> => instance.put('/api/v1/questions', question),
    get_io: (): Promise<AxiosResponse<io[]>> => instance.get<io[]>('/api/v1/questions/io'),
}

const input_output = {
    get: (): Promise<AxiosResponse<io[]>> => instance.get<io[]>('/api/v1/questions/io')
}

const examples = {
    get: (): Promise<AxiosResponse<example[]>> => instance.get<example[]>('/api/v1/examples')
}

const units = {
    get: (): Promise<AxiosResponse<unit[]>> => instance.get<unit[]>(`/api/v1/units`),
    create: (unit: unit): Promise<AxiosResponse<unit>> => instance.post<unit>(`/api/v1/units`, unit),
    delete: (ids: number[]): Promise<AxiosResponse<any>> => instance.delete(`/api/v1/units`, { data: ids }),
    prerequisites: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/units/prerequisites'),
}


const courses = {
    get: (): Promise<AxiosResponse<course[]>> => instance.get<course[]>('/api/v1/courses'),
    delete: (ids: number[]): Promise<AxiosResponse<any>> => instance.delete('/api/v1/courses', { data: ids }),
    create: (courses: course[]): Promise<AxiosResponse<course>> => instance.post('/api/v1/courses', courses),
    fetch: (id: number): Promise<AxiosResponse<course>> => instance.get<course>('/api/v1/courses/${id}'),
    update: (course: course): Promise<AxiosResponse<course>> => instance.put('/api/v1/courses', course),
    prerequisites: (): Promise<AxiosResponse<{ course_id: number, prereq_id: number }>> => instance.get('/api/v1/courses/prerequisites')
}

const samples = {
    get: (): Promise<AxiosResponse<sample[]>> => instance.get<sample[]>('/api/v1/samples')
}

const code_run = {
    instance: (code_run_id: string): Promise<AxiosResponse<any>> => instance.get(`/api/v1/code_runs/${code_run_id}`),
}

const fastapi = {
    users,
    user: {
        enrolled_courses: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/users/enrolled_courses'),
        completed_courses: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/users/courses_completed'),
        enroll: (course_id: string): Promise<AxiosResponse<any>> => instance.put('/api/v1/users/enroll', { id: course_id }),
        completed_units: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/users/units_completed'),
        completed_questions: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/users/questions_completed'),
        code_runs: (question_id: string): Promise<AxiosResponse<any>> => instance.get(`/api/v1/users/code_runs?question_id=${question_id}`),
        pool_questions: (unit_id: string): Promise<AxiosResponse<any>> => instance.get(`/api/v1/users/unit/pool/questions?unit_id=${unit_id}`),
        get_id: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/users/get_id'),
        login: (username: string, password: string): Promise<AxiosResponse<any>> => instance.post('/api/v1/authenticate', { username, password }),
        change_password: (password: string): Promise<AxiosResponse<any>> => instance.patch('/api/v1/users/change_password', { password })
    },
    user_code: {
        get: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/user_code'),
        save: (user_code: any): Promise<AxiosResponse<any>> => instance.put('/api/v1/user_code', user_code),
        code_runs: (user_code_id: string): Promise<AxiosResponse<any>> => instance.get(`/api/v1/user_code/code_runs?user_code_id=${user_code_id}`),
        instance: (user_code_id: string): Promise<AxiosResponse<any>> => instance.get(`/api/v1/user_code/instance?user_code_id=${user_code_id}`),
    },
    auth,
    execute_code: (course_id: string, unit_id: string, pool_id: string, question_id: string): Promise<AxiosResponse<any>> => instance.post('/api/v1/execute_code', { course_id, unit_id, pool_id, question_id }),
    get_job: (job_id: string): Promise<AxiosResponse<any>> => instance.get(`/api/v1/job_status?job_id=${job_id}`),
    questions,
    question: {
        categories: (): Promise<AxiosResponse<unit>> => instance.get('/api/v1/questions/categories'),
        user_code: (question_id: string): Promise<AxiosResponse<any>> => instance.get(`/api/v1/questions/user_code?question_id=${question_id}`)
    },
    units,
    courses,
    input_output,
    examples,
    samples,
    unit: {
        get: (unit_id: number): Promise<AxiosResponse<unit>> => instance.get<unit>(`/api/v1/units/${unit_id}`),
        questions: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/units/questions'),
        categories: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/units/categories'),
        put: (unit: unit): Promise<AxiosResponse<any>> => instance.put('/api/v1/units', unit),
        pools: (unit_id: string): Promise<AxiosResponse<any>> => instance.get(`/api/v1/units/${unit_id}/pools`)
    },
    code_run,
    lint: (code: { source: string, function?: boolean }): Promise<AxiosResponse<any, any>> => instance.post('/api/v1/services/lint', code),
    verify_sample: (question: any): Promise<AxiosResponse<any, any>> => instance.post('/api/v1/services/verify', question),
    // verify_status: (job_id: string): Promise<AxiosResponse<any, any>> => instance.post('/api/v1/services/verify/status', { uuid: job_id }),
    pools: {
        get: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/pools'),
        questions: (): Promise<AxiosResponse<any>> => instance.get('/api/v1/pools/pool_questions'),
    },
    table: {
        get: (tablename: string, extra_args?: Object): Promise<AxiosResponse<any>> => instance.get(`/api/v1/tables?table=${tablename}`, extra_args),
        create: (tablename: string, object: Object): Promise<AxiosResponse<any>> => instance.post(`/api/v1/objects?tablename=${tablename}`, object),
        delete: (tablename: string, pk_list: any): Promise<AxiosResponse<any>> => instance.delete(`/api/v1/objects?tablename=${tablename}`, { data: pk_list }),
    }
}

export default fastapi