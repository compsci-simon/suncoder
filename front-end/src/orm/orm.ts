import { ORM } from 'redux-orm'

import { User, Category, Import, Structure, Question, Unit, Pool, PoolQuestions, Course, QuestionInputOutput, Example, Sample, UserCode, Code_Run, UnitPrerequisites } from '../models/models'
import store, { RootState } from '../store'
import { fetch_examples, fetch_questions, fetch_question_categories, fetch_question_illegal_structures, fetch_question_imports, fetch_question_io, fetch_question_required_structures, fetch_samples } from '../Routes/Questions/actions'
import { fetch_units, fetch_unit_categories, fetch_unit_questions } from '../Routes/Units/actions'
import { fetch_courses, fetch_course_prerequisites, fetch_unit_prerequisites } from '../Routes/Courses/actions'
import { fetch_completed_courses, fetch_enrolled_courses } from '../Routes/Settings/actions'
import { fetch_user_code } from '../Routes/ide/actions'
import { fetch_users } from '../Routes/Users/actions'
import { fetch_user_pool_questions } from '../Routes/UnitQuestions/actions'
import { fetch_code_run_instance, fetch_question_user_attempts, fetch_user_code_code_runs, fetch_user_code_instance } from '../Routes/Stats/actions'
import { fetch_table } from '../action'
import _ from 'lodash'
import { bin_code_runtimes } from '../helper'
import { create_user_code } from '../Routes/ide/actions'

const orm = new ORM({
  stateSelector: state => state.entities
})
orm.register(User, Category, Import, Structure, Question, Unit, Pool, PoolQuestions, Course, QuestionInputOutput, Example, Sample, UserCode, Code_Run, UnitPrerequisites)

const course = (state: RootState, courseId: number) => {
  store.dispatch<any>(fetch_table('courses'))
  store.dispatch<any>(fetch_table('units'))
  store.dispatch<any>(fetch_table('unit_prerequisites'))
  const session = orm.session(state.entities)
  if (!session.Course.idExists(courseId as never)) return null
  let db_course = session.Course.withId(courseId as never)
  let course = JSON.parse(JSON.stringify(db_course.ref))
  course.units = []
  for (let db_unit of db_course.units.toModelArray()) {
    let unit = JSON.parse(JSON.stringify(db_unit.ref))
    unit.prerequisites = JSON.parse(JSON.stringify(db_unit.prerequisites.toRefArray()))
    course.units.push(unit)
  }
  course.prerequisites = JSON.parse(JSON.stringify(db_course.prerequisites.toRefArray()))
  return course
}

const find_recurs_prereqs = (course_prerequisites: any) => {
  if (course_prerequisites === undefined) return []
  let prereqs: any = []
  for (let prereq_model of course_prerequisites) {
    let prereq = JSON.parse(JSON.stringify(prereq_model.ref))
    prereq.prerequisites = find_recurs_prereqs(prereq_model.prerequisites.toModelArray())
    prereqs.push(prereq)
  }
  return prereqs
}

const courses = (state: RootState) => {
  const session = orm.session(state.entities)
  store.dispatch<any>(fetch_table('courses'))
  store.dispatch<any>(fetch_table('units'))
  store.dispatch<any>(fetch_table('course_prerequisites'))
  let db_courses = session.Course.all().toModelArray()
  let courses: any = []

  for (let db_course of db_courses) {
    let course = JSON.parse(JSON.stringify(db_course.ref))
    course.units = JSON.parse(JSON.stringify(db_course.units.toRefArray()))

    course.prerequisites = db_course.prerequisites.toRefArray()
    courses.push(course)
  }
  return courses
}

const courses_reg = (state: RootState) => {
  const session = orm.session(state.entities)
  store.dispatch<any>(fetch_table('course_prerequisites'))
  store.dispatch<any>(fetch_table('enrolled'))
  store.dispatch<any>(fetch_table('questions'))
  store.dispatch<any>(fetch_table('questions_completed'))
  store.dispatch<any>(fetch_table('pools'))
  store.dispatch<any>(fetch_table('pool_questions'))
  store.dispatch<any>(fetch_table('units'))
  store.dispatch<any>(fetch_table('courses'))

  let db_user = session.User.withId(state.identity.id as never)
  if (!db_user) return []

  let completed_question_ids = db_user.questions_completed.toModelArray().map((item: any) => item.id)

  let completed_pools_ids = session.Pool.all().toModelArray().filter((pool: any) => {
    let p_qids = pool.questions.toModelArray().map((question: any) => question.id)
    let flag = false
    for (let qid of p_qids) {
      if (completed_question_ids.includes(qid)) {
        flag = true
        break
      }
    }
    return flag
  }).map((pool: any) => pool.id)

  let completed_unit_ids = session.Unit.all().toModelArray().filter((unit: any) => {
    let u_pids = unit.pools.toModelArray().map((pool: any) => pool.id)
    let flag = true
    for (let pid of u_pids) {
      if (!completed_pools_ids.includes(pid)) {
        flag = false
        break
      }
    }
    return flag
  }).map((unit: any) => unit.id)
  console.log('completed_unit_ids', completed_unit_ids)

  let completed_course_ids = session.Course.all().toModelArray().filter((course: any) => {
    let c_uids = course.units.toModelArray().map((unit: any) => unit.id)
    let flag = true
    for (let uid of c_uids) {
      if (!completed_unit_ids.includes(uid)) {
        flag = false
        break
      }
    }
    return flag
  }).map((course: any) => course.id)
  console.log('completed_course_ids', completed_course_ids)

  let enrolled_courses = db_user.enrolled_courses.toModelArray().map((item: any) => item.id)

  let db_courses = session.Course.all().toModelArray()
  let courses: any[] = []
  for (let db_course of db_courses) {
    let course = JSON.parse(JSON.stringify(db_course.ref))
    course['status'] = 'not enrolled'
    course['can_enroll'] = true
    if (enrolled_courses.includes(course.id)) {
      course['status'] = 'enrolled'
      course['can_enroll'] = false
      course['enroll_msg'] = 'Already enrolled'
    } else {
      for (let prerequisite of db_course.prerequisites.toModelArray()) {
        if (!completed_course_ids.includes(prerequisite.id)) {
          course['can_enroll'] = false
          course['enroll_msg'] = 'Need to complete prerequisites'
        }
      }
    }
    course['prerequisites'] = _.cloneDeep(db_course.prerequisites.toModelArray())
    course['units'] = _.cloneDeep(db_course.units.toModelArray())
    courses.push(course)
  }
  return courses
}

const question = (state: RootState, qid: number) => {
  let session = orm.session(state.entities)
  store.dispatch<any>(fetch_table('questions'))
  store.dispatch<any>(fetch_table('categories'))
  store.dispatch<any>(fetch_table('question_categories'))
  store.dispatch<any>(fetch_table('input_output'))
  store.dispatch<any>(fetch_table('imports'))
  store.dispatch<any>(fetch_table('question_imports'))
  store.dispatch<any>(fetch_table('allowed_imports'))
  store.dispatch<any>(fetch_table('structures'))
  store.dispatch<any>(fetch_table('required_structures'))
  store.dispatch<any>(fetch_table('illegal_structures'))
  store.dispatch<any>(fetch_table('samples'))
  store.dispatch<any>(fetch_table('user_code'))

  if (!session.Question.idExists(qid as never)) return undefined
  let db_question = session.Question.withId(qid as never)
  let question = JSON.parse(JSON.stringify(db_question.ref))
  question.categories = JSON.parse(JSON.stringify(db_question.categories.toRefArray()))
  question.examples = JSON.parse(JSON.stringify(db_question.examples.toRefArray()))
  question.input_outputs = JSON.parse(JSON.stringify(db_question.input_outputs.toRefArray()))
  question.allowed_imports = JSON.parse(JSON.stringify(db_question.imports.toRefArray()))
  question.required_structures = JSON.parse(JSON.stringify(db_question.required_structures.toRefArray()))
  question.illegal_structures = JSON.parse(JSON.stringify(db_question.illegal_structures.toRefArray()))
  question.sample_solutions = JSON.parse(JSON.stringify(db_question.sample_solutions.toRefArray()))

  question.creator = JSON.parse(JSON.stringify(db_question.creator.ref))
  return question
}

const questions = (state: RootState) => {
  store.dispatch<any>(fetch_table('questions'))
  store.dispatch<any>(fetch_table('categories'))
  store.dispatch<any>(fetch_table('question_categories'))
  store.dispatch<any>(fetch_table('user'))
  store.dispatch<any>(fetch_table('user_code'))

  const id = store.getState().identity.id

  let session = orm.session(state.entities)
  let db_questions = session.Question.all().toModelArray()
  let questions: any[] = []
  for (let db_question of db_questions) {
    let question = _.cloneDeep(db_question.ref)
    question.categories = _.cloneDeep(db_question.categories.toRefArray())
    question.creator = _.cloneDeep(db_question.creator.ref)
    let attempts = 0
    for (let uc of db_question.user_code.all().toRefArray()) {
      let user = session.User.withId(uc.user_id as never)
      if (user.username == 'demo' && user.id != id) {
        continue
      }
      attempts += 1
    }
    question['attempts'] = attempts
    questions.push(question)
  }
  return questions
}

const units: (state: RootState) => {
  id: string,
  name: string,
  course_id?: string
}[] = (state: RootState) => {
  store.dispatch<any>(fetch_table('units'))
  store.dispatch<any>(fetch_table('courses'))
  store.dispatch<any>(fetch_table('unit_categories'))
  store.dispatch<any>(fetch_table('categories'))

  let session = orm.session(state.entities)
  let db_units = session.Unit.orderBy((Unit: any) => Unit.name, true).toModelArray()
  let units: any = []
  for (let db_unit of db_units) {
    let unit = JSON.parse(JSON.stringify(db_unit.ref))
    unit.categories = JSON.parse(JSON.stringify(db_unit.categories.toRefArray()))
    unit.pools = db_unit.pools.toRefArray()
    unit.prerequisites = JSON.parse(JSON.stringify(db_unit.prerequisites.toRefArray()))
    if (db_unit.course_id) {
      unit.course = JSON.parse(JSON.stringify(db_unit.course_id.ref))
    } else {
      unit.course = null
    }
    units.push(unit)
  }

  return units
}

const unit = (state: RootState, unit_id: number) => {
  let session = orm.session(state.entities)
  let db_unit: any = null
  let unit: any = null

  store.dispatch<any>(fetch_table('units'))
  store.dispatch<any>(fetch_table('questions'))
  store.dispatch<any>(fetch_table('categories'))
  store.dispatch<any>(fetch_table('unit_categories'))
  store.dispatch<any>(fetch_table('unit_prerequisites'))
  store.dispatch<any>(fetch_table('pools'))
  store.dispatch<any>(fetch_table('pool_questions'))
  store.dispatch<any>(fetch_table('pool_prerequisites'))

  db_unit = session.Unit.withId(unit_id as never)
  if (!db_unit || !db_unit.ref) {
    return null
  }
  unit = JSON.parse(JSON.stringify(db_unit.ref))
  unit.questions = []
  unit.pools = []

  for (let db_pool of db_unit.pools.toModelArray()) {
    for (let question of db_pool.questions.toRefArray()) {
      unit.questions.push(JSON.parse(JSON.stringify(question)))
    }
    unit.pools.push({
      id: db_pool.id,
      questions: db_pool.questions.toRefArray(),
      prerequisites: db_pool.prerequisites.toRefArray(),
      poolnum: db_pool.poolnum
    })
    if (db_pool.questions.toRefArray().length > 1 || db_pool.prerequisites.toRefArray().length > 0) {
      unit.usePools = true
    }
  }
  unit.categories = _.cloneDeep(db_unit.categories.toRefArray())
  return unit
}

const categories = (state: RootState) => {
  let session = orm.session(state.entities)
  store.dispatch<any>(fetch_table('categories'))
  return JSON.parse(JSON.stringify(session.Category.all().toRefArray()))
}

const imports = (state: RootState) => {
  let session = orm.session(state.entities)
  store.dispatch<any>(fetch_table('imports'))
  return JSON.parse(JSON.stringify(session.Import.all().toRefArray()))
}

const structures = (state: RootState) => {
  let session = orm.session(state.entities)
  store.dispatch<any>(fetch_table('structures'))
  return JSON.parse(JSON.stringify(session.Structure.all().toRefArray()))
}

const enrolled = (state: RootState) => {
  store.dispatch<any>(fetch_table('courses'))
  store.dispatch<any>(fetch_table('course_prerequisites'))
  store.dispatch<any>(fetch_enrolled_courses())

  let session = orm.session(state.entities)
  let userId = state.identity.id
  let db_user = session.User.withId(userId as never)
  if (!db_user) return []
  let enrolled_courses = db_user.enrolled_courses.toRefArray().map((course: any) => course.id)

  let courses: any[] = []
  for (let db_course of session.Course.orderBy((Course: any) => Course.name, true).toModelArray()) {
    if (!enrolled_courses.includes(db_course.id)) {
      let course = JSON.parse(JSON.stringify(db_course.ref))
      course.prerequisites = JSON.parse(JSON.stringify(db_course.prerequisites.toRefArray()))
      courses.push(course)
    }
  }
  return courses
}

const completed_courses = (state: RootState) => {
  store.dispatch<any>(fetch_table('courses'))
  store.dispatch<any>(fetch_table('questions_completed'))
  store.dispatch<any>(fetch_table('units'))
  store.dispatch<any>(fetch_table('pools'))
  store.dispatch<any>(fetch_table('unit_pools'))

  let session = orm.session(state.entities)
  let userId = state.identity.id
  let db_user = session.User.withId(userId as never)

  if (!db_user) return []

  let completed_question_ids = db_user.questions_completed.toRefArray().map((q: any) => q.id)

  return []
  let completed_pool_ids: string[] = []
  let db_units = session.Unit.all().toModelArray()
  for (let db_unit of db_units) {
    for (let db_pool of session.Unit.withId(db_unit.id as never).pools.toModelArray()) {
      let user_pool_question_ids = session.UserPool_questions.all().toRefArray().filter((item: any) => {
        return item.fromUserId == db_user.id && item.toPoolId == db_pool.id
      }).map((x: any) => x.question_id)
      for (let question_id of user_pool_question_ids) {
        if (completed_question_ids.includes(question_id)) {
          completed_pool_ids.push(db_pool.id)
          break
        }
      }
    }
  }

  if (!Array.isArray(db_units)) return []
  let completed_unit_ids: string[] = []
  for (let db_unit2 of db_units) {
    let completed = true
    for (let pool of db_unit2.pools) {
      if (!completed_pool_ids.includes(pool.id)) {
        completed = false
        break
      }
    }
    if (completed) {
      completed_unit_ids.push(db_unit2.id)
    }
  }

  let completed_courses: any[] = []
  for (let db_course of session.Course.all().toModelArray()) {
    let completed = true
    for (let db_unit of db_course.units.toModelArray()) {
      if (!completed_unit_ids.includes(db_unit.id)) {
        completed = false
      }
    }
    if (completed) {
      completed_courses.push(db_course.ref)
    }
  }

  return completed_courses
}

const enrolled_courses = (state: RootState) => {
  store.dispatch<any>(fetch_table('courses'))
  store.dispatch<any>(fetch_table('units'))
  store.dispatch<any>(fetch_table('questions'))
  store.dispatch<any>(fetch_table('unit_prerequisites'))
  store.dispatch<any>(fetch_table('enrolled'))
  store.dispatch<any>(fetch_table('questions_completed'))
  store.dispatch<any>(fetch_table('pool_questions'))
  store.dispatch<any>(fetch_table('pools'))
  store.dispatch<any>(fetch_table('pool_prerequisites'))

  let session = orm.session(state.entities)
  if (!session.User.idExists(state.identity.id as never)) {
    return []
  }
  let db_user = session.User.withId(state.identity.id as never)
  let db_pools = session.Pool.all().toModelArray()
  let completed_q_ids = session.UserQuestions_completed.all().toRefArray().filter((q: any) => {
    return q.fromUserId == db_user.id
  }).map((q: any) => q.toQuestionId)

  let completed_pools: any[] = []
  for (let db_pool of session.Pool.all().toModelArray()) {
    let pool_question_ids = db_pool.questions.toRefArray().map((q: any) => q.id)
    for (let question_id of pool_question_ids) {
      if (completed_q_ids.includes(question_id)) {
        completed_pools.push(db_pool.id)
        break
      }
    }
  }

  let completed_unit_ids: any = []
  for (let db_unit of session.Unit.all().toModelArray()) {
    let completed = true
    for (let pool of db_unit.pools.toModelArray()) {
      if (!completed_pools.includes(pool.id)) {
        completed = false
      }
    }
    if (completed) {
      completed_unit_ids.push(db_unit.id)
    }
  }

  let db_courses = db_user.enrolled_courses.toModelArray()
  let courses: any[] = []
  for (let db_course of db_courses) {
    let course = JSON.parse(JSON.stringify(db_course.ref))
    course.units = []
    for (let db_unit of db_course.units.orderBy((Unit: any) => Unit.name).toModelArray()) {
      let unit = JSON.parse(JSON.stringify(db_unit.ref))
      unit.prerequisites = JSON.parse(JSON.stringify(db_unit.prerequisites.toRefArray()))
      unit.can_attempt = true
      unit.prereqs_not_met = []
      unit.numPools = db_unit.pools.toRefArray().length
      unit.pools_completed = 0
      for (let pool of db_unit.pools.toRefArray()) {
        if (completed_pools.includes(pool.id)) {
          unit.pools_completed++
        }
      }
      for (let prereq of unit.prerequisites) {
        if (!completed_unit_ids.includes(prereq.id)) {
          unit.disabled = true
          unit.prereqs_not_met.push(prereq.name)
        }
      }
      course.units.push(unit)
    }
    courses.push(course)
  }
  return courses
}

const unit_pools = (state: RootState, course_id: string, unit_id: string) => {
  store.dispatch<any>(fetch_table('courses'))
  store.dispatch<any>(fetch_table('units'))
  store.dispatch<any>(fetch_table('questions'))
  store.dispatch<any>(fetch_table('categories'))
  store.dispatch<any>(fetch_table('question_categories'))
  store.dispatch<any>(fetch_table('pools'))
  store.dispatch<any>(fetch_table('pool_prerequisites'))
  store.dispatch<any>(fetch_table('questions_completed'))
  store.dispatch<any>(fetch_table('enrolled'))
  store.dispatch<any>(fetch_table('pool_questions'))
  store.dispatch<any>(fetch_table('questions_completed'))
  store.dispatch<any>(fetch_user_pool_questions(unit_id))

  let session = orm.session(state.entities)
  let db_user = session.User.withId(state.identity.id as never)
  if (!db_user) return []
  // User is not enrolled in course
  let enrolled_course_ids = db_user.enrolled_courses.toModelArray().map((x: any) => x.id)
  if (!enrolled_course_ids.includes(course_id)) return []
  let db_course_units = session.Course.withId(course_id as never).units.toModelArray()
  // Course does not contain this unit
  if (!db_course_units.map((x: any) => x.id).includes(unit_id)) return []

  let completed_question_ids = db_user.questions_completed.toRefArray().map((q: any) => q.id)
  let completed_pool_ids: string[] = []
  for (let db_pool of session.Unit.withId(unit_id as never).pools.toModelArray()) {
    let qids = db_pool.questions.toModelArray().map(x => x.id)
    for (let question_id of qids) {
      if (completed_question_ids.includes(question_id)) {
        completed_pool_ids.push(db_pool.id)
        break
      }
    }
  }
  let completed_qids = session.UserQuestions_completed.all().toModelArray().filter((item: any) => {
    return item.ref.fromUserId == state.identity.id
  }).map((item: any) => item.ref.toQuestionId)

  let pools: any[] = []
  for (let db_pool of session.Unit.withId(unit_id as never).pools.orderBy('poolnum').toModelArray()) {
    let pool = _.clone(db_pool.ref)
    pool['completed'] = false
    pool['questions'] = []
    for (let question of db_pool.questions.toModelArray()) {
      let q = _.cloneDeep(question.ref)
      q['categories'] = _.cloneDeep(question.categories.toRefArray())
      if (completed_qids.includes(question.id)) {
        q['completed'] = true
        pool['completed'] = true
      } else {
        q['completed'] = false
      }
      pool['questions'].push(q)
    }
    pool['prerequisites'] = _.cloneDeep(db_pool.prerequisites.toModelArray())

    for (let prerequisite of pool['prerequisites']) {
      if (!completed_pool_ids.includes(prerequisite.id)) {
        for (let i in pool['questions']) {
          pool['questions'][i]['disabled'] = true
        }
        pool['disabled'] = true
      }
    }
    pools.push(pool)
  }
  return pools
}

let once = (() => {
  let executed = {}
  return (question_id: string) => {
    if (!executed[question_id]) {
      executed[question_id] = true
      store.dispatch<any>({ type: 'ONCE' })
      setTimeout(() => {
        let session = orm.session(store.getState().entities)
        if (session.Question.idExists(question_id as never)) {
          let session = orm.session(store.getState().entities)
          let source = JSON.parse(JSON.stringify(session.Question.withId(question_id as never).template))
          let user_code: any = session.UserCode.all().toRefArray().filter((x: any) => {
            return x.question_id == question_id && x.user_id == store.getState().identity.id
          })
          if (user_code.length !== 1) {
            user_code = { id: crypto.randomUUID().replaceAll('-', ''), source: source, versionId: 0, question_id: question_id, user_id: store.getState().identity.id, changes: [] }
            store.dispatch<any>(create_user_code(user_code))
          }
        }
      }, 2000)
    }
  }
})()

const question_user_code = (state: RootState, question_id: string) => {
  let session = orm.session(state.entities)
  store.dispatch<any>(fetch_table('questions'))
  store.dispatch<any>(fetch_table('user_code', () => once(question_id)))

  let user_code = session.UserCode.all().toRefArray().filter((x: any) => {
    return x.question_id == question_id && x.user_id == state.identity.id
  })
  if (user_code.length == 1) {
    return user_code[0]
  } else {
    console.log('user_code.length', user_code.length)
    return null
  }

}

const question_stats = (state: RootState, question_id: string) => {
  store.dispatch<any>(fetch_questions())
  store.dispatch<any>(fetch_question_user_attempts(question_id))
  store.dispatch<any>(fetch_user_code())

  let session = orm.session(state.entities)
  let user_id = state.identity.id
  let db_uc_list = session.UserCode.all().toModelArray().filter((item: any) => {
    let qid = item.question_id
    let uid = item.user_id.ref.id
    return uid == user_id && qid == question_id
  })
  if (db_uc_list.length !== 1) return []
  let db_uc = db_uc_list[0]
  let question_runs = session.Code_Run.all().toModelArray().filter((item: any) => {
    return item.user_code_id.ref.id == db_uc.id
  })
  return question_runs
}

const user_code_instance = (state: RootState, user_code_id: string) => {
  store.dispatch<any>(fetch_user_code_instance(user_code_id))
  let session = orm.session(state.entities)
  if (session.UserCode.idExists(user_code_id as never)) {
    let user_code = JSON.parse(JSON.stringify(session.UserCode.withId(user_code_id as never).ref))
    user_code['changes'] = JSON.parse(user_code['changes'])
    return user_code
  }
}

const code_run_instance = (state: RootState, code_run_id: string) => {

  store.dispatch<any>(fetch_table('code_run'))
  let session = orm.session(state.entities)
  if (session.Code_Run.idExists(code_run_id as never)) {
    return JSON.parse(JSON.stringify(session.Code_Run.withId(code_run_id as never).ref))
  }
}

const user_attempts_for_question = (state: RootState, question_id: string) => {
  let session = orm.session(state.entities)
  store.dispatch<any>(fetch_table('questions'))
  store.dispatch<any>(fetch_table('user_code'))
  const id = store.getState().identity.id
  let db_question = session.Question.withId(question_id as never)
  if (db_question && db_question.user_code) {
    let user_codes: any[] = []
    for (let db_user_code of db_question.user_code.toModelArray()) {
      let user_code = JSON.parse(JSON.stringify(db_user_code.ref))
      user_code['username'] = db_user_code.user_id.ref.username
      user_code['user_id'] = db_user_code.user_id.ref.id
      if (user_code['username'] == 'demo' && user_code['user_id'] != id) {
        continue
      }
      user_codes.push(user_code)
    }
    return user_codes
  }
  return []
}

const code_runs = (state: RootState, user_code_id: string) => {
  store.dispatch<any>(fetch_user_code_code_runs(user_code_id))
  let session = orm.session(state.entities)

  let code_runs = session.Code_Run.all().orderBy((Code_Run: any) => Code_Run.created_date).toRefArray().filter((item: any) => item.user_code_id == user_code_id)
  return code_runs
}

export type info_type = {
  question_name: string
  users_attempted: number
  users_passed: number
  attempts_per_day: {
    date: string
    attempts: number
  }[]
  average_attemps_per_student: number
  suspicious_points: any[]
  code_run_times: number[]
  users_enrolled: number
}

const question_charts = (state: RootState, question_id: string) => {
  store.dispatch<any>(fetch_table('questions'))
  store.dispatch<any>(fetch_table('user_code'))
  store.dispatch<any>(fetch_table('code_run'))
  store.dispatch<any>(fetch_table('questions_completed'))
  store.dispatch<any>(fetch_table('enrolled'))
  store.dispatch<any>(fetch_table('pool_questions'))
  store.dispatch<any>(fetch_table('pools'))
  store.dispatch<any>(fetch_table('units'))
  store.dispatch<any>(fetch_table('courses'))
  let session = orm.session(state.entities)

  let info: info_type = {
    question_name: '',
    users_attempted: 0,
    users_passed: 0,
    attempts_per_day: [],
    average_attemps_per_student: 0,
    suspicious_points: [],
    code_run_times: [],
    users_enrolled: 0
  }

  if (!session.Question.idExists(question_id as never)) return info

  let question = session.Question.withId(question_id as never)
  info.question_name = question.name
  info.users_passed = session.UserQuestions_completed.all().toRefArray().filter((question: any) => {
    return question.toQuestionId == question_id
  }).length

  let user_codes = session.UserCode.all().toModelArray().filter((uc: any) => {
    return uc.ref.question_id == question_id
  })
  let uc_ids = user_codes.map((uc: any) => uc.id)
  info.users_attempted = user_codes.length

  let code_runs = session.Code_Run.all().toModelArray().filter((code_run: any) => {
    return uc_ids.includes(code_run.ref.user_code_id)
  })
  let code_runs_per_day: { [key: string]: number } = {}
  let split_items = [['T', 0], [':', 0], [':', 1]]
  let i = 0
  while (Object.keys(code_runs_per_day).length < 2 && i < 3) {
    code_runs_per_day = {}
    for (let code_run of code_runs) {
      let date = code_run.date.split(split_items[i][0])[split_items[i][1]]
      if (date in code_runs_per_day) {
        code_runs_per_day[date] += 1
      } else {
        code_runs_per_day[date] = 1
      }
    }
    i++
  }
  info.attempts_per_day = Object.entries(code_runs_per_day).map(item => {
    return { 'date': item[0], 'attempts': item[1] }
  })

  for (let user_code of user_codes) {
    let changes = JSON.parse(user_code.ref.changes)
    for (let idx = 1; idx < changes.length; idx++) {
      let change = changes[idx]
      if (change.text.length > 30) {
        info.suspicious_points.push({ id: crypto.randomUUID(), user_code_id: user_code.ref.id, idx, severity: 'high' })
      } else if (change.text.length > 20) {
        info.suspicious_points.push({ id: crypto.randomUUID(), user_code_id: user_code.ref.id, idx, severity: 'medium' })
      } else if (change.text.length > 10) {
        info.suspicious_points.push({ id: crypto.randomUUID(), user_code_id: user_code.ref.id, idx, severity: 'low' })
      }
    }
  }
  if (user_codes.length > 0) {
    info.average_attemps_per_student = code_runs.length / user_codes.length
  }
  for (let code_run of code_runs) {
    info.code_run_times.push(code_run.runtime)
  }

  let unit_ids: any[] = []
  let question_belongs_to_course_ids: { [key: string]: boolean } = {}
  for (let pool of question.pools.toRefArray()) {
    unit_ids.push(pool.unit_id)
    let unit = session.Unit.withId(pool.unit_id as never)
    question_belongs_to_course_ids[unit.ref.course_id] = true
  }
  let users_enrolled = {}
  for (let enrollment of session.UserEnrolled_courses.all().toModelArray()) {
    console.log(enrollment)
    if (question_belongs_to_course_ids[enrollment.ref.toCourseId]) {
      users_enrolled[enrollment.ref.fromUserId] = true
    }
  }
  info.users_enrolled = Object.keys(users_enrolled).length
  return info
}

const users = (state: RootState) => {
  store.dispatch<any>(fetch_table('users'))
  let session = orm.session(state.entities)
  return _.cloneDeep(session.User.all().toRefArray())
}

export const selectors = {
  users,
  course,
  courses,
  question,
  units,
  unit,
  categories,
  imports,
  structures,
  questions,
  enrolled,
  completed_courses,
  enrolled_courses,
  question_user_code,
  question_stats,
  user_attempts_for_question,
  code_runs,
  user_code_instance,
  code_run_instance,
  unit_pools,
  courses_reg,
  question_charts
}

export default orm