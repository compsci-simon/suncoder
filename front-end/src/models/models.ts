import { Model, attr, many, fk } from 'redux-orm'
import { question } from '../apis';
import { LOG_KEYSTROKE, UPDATE_USER_CODE } from '../orm';
import { Action } from './'

class User extends Model {
  static get fields() {
    return {
      id: attr(),
      username: attr(),
      type: attr(),
      enrolled_courses: many('Course', 'enrolled_users'),
      questions_completed: many('Question', 'users_completed'),
      pool_questions: many('Pool', 'user_questions')
    }
  }

  static reducer(action: Action, User: any, session: any) {
    switch (action.type) {
      case '[GET] users':
        for (let user of action.payload) {
          User.upsert(user)
        }
        break;
      case '[GET] enrolled':
        for (let item of action.payload) {
          session.UserEnrolled_courses.upsert(item)
        }
        break;
      case '[GET] questions_completed':
        for (let item of action.payload) {
          session.UserQuestions_completed.upsert(item)
        }
        break
      case '[GET] /users/units_completed':
        for (let item of action.payload) {
          session.UserUnits_completed.create(item)
        }
        break;
      case '[GET] /users/code_runs':
        for (let run of action.payload) {
          session.Code_Run.upsert(run)
        }
        break
      case '[GET] /questions/user_code':
        for (let uc of action.payload) {
          session.UserCode.upsert(uc)
        }
        break
      case '[GET] user_pool_questions':
        for (let item of action.payload) {
          session.UserPool_questions.upsert(item)
        }
        break
      case '[POST] users':
        for (let user of action.payload) {
          User.upsert(user)
        }
        break;
      case '[DELETE] users':
        if (Array.isArray(action.payload)) {
          for (let item of action.payload) {
            User.all().filter((user: any) => user.id == item.id).delete()
          }
        }
        break;
      case '[PUT] /users/enroll':
        session.UserEnrolled_courses.upsert({ id: crypto.randomUUID().replaceAll('-', ''), fromUserId: action.payload.user_id, toCourseId: action.payload.course_id })
        break;
    }
  }
}
User.modelName = 'User'


class UserCode extends Model {
  static get fields() {
    return {
      id: attr(),
      user_id: fk('User', 'user_code'),
      question_id: fk('Question', 'user_code'),
      source: attr(),
      versionId: attr(),
      changes: attr(),
    }
  }

  static generate(attributes: any) {
    return this.upsert({
      ...attributes,
      versionId: 1,
      changes: JSON.stringify(attributes.changes),
    })
  }

  static append_keystroke(payload: any, session: any) {
    let db_user_code = session.UserCode.withId(payload.id)
    if (!db_user_code) return {}
    let changes = JSON.parse(db_user_code.ref.changes)
    if (!payload.changes) return;
    for (let change of payload.changes) {
      change.versionId = db_user_code.versionId + 1
      changes.push(change)
    }
    db_user_code.set('changes', JSON.stringify(changes))
    db_user_code.set('versionId', db_user_code.versionId + 1)
    db_user_code.set('source', payload.source)
  }

  static reducer(action: Action, UserCode: any, session: any) {
    switch (action.type) {
      case '[GET] user_code':
        for (let item of action.payload) {
          UserCode.upsert(item)
        }
        break;
      case '[GET] /user_code/code_runs':
        for (let item of action.payload) {
          session.Code_Run.upsert(item)
        }
        break;
      case '[GET] /user_code/instance':
        UserCode.upsert(action.payload)
        break;
      case '[POST] user_code':
        UserCode.generate(action.payload)
        break
      case LOG_KEYSTROKE:
        if (UserCode.idExists(action.payload.id)) {
          UserCode.append_keystroke(action.payload, session)
        } else {
          UserCode.generate(action.payload)
        }
        break
    }
  }
}
UserCode.modelName = 'UserCode'

class Category extends Model {
  static get fields() {
    return {
      name: attr()
    }
  }

  static reducer(action: Action, Category: any, session: any) {
    switch (action.type) {
      case '[GET] categories':
        for (let category of action.payload) {
          Category.upsert(category)
        }
        break
      case '[POST] categories':
        for (let category of action.payload) {
          session.Category.upsert(category)
        }
        break
      case '[DELETE] categories':
        let name_list = action.payload.map((_: any) => _.name)
        Category.all().filter((category: any) => name_list.includes(category.name)).delete()
        break
    }
  }
}
Category.options = {
  idAttribute: 'name'
}
Category.modelName = 'Category'


class Import extends Model {
  static get fields() {
    return {
      name: attr()
    }
  }

  static reducer(action: Action, Import: any, session: any) {
    switch (action.type) {
      case '[GET] imports':
        for (let item of action.payload) {
          Import.upsert(item)
        }
        break
      case '[GET] allowed_imports':
        for (let item of action.payload) {
          session.QuestionImports.upsert(item)
        }
        break
      case '[POST] imports':
        for (let item of action.payload) {
          Import.upsert(item)
        }
        break
      case '[DELETE] imports':
        let name_list = action.payload.map((_: any) => _.name)
        Import.all().filter((item: any) => name_list.includes(item.name)).delete()
        break
    }
  }
}
Import.options = {
  idAttribute: 'name'
}
Import.modelName = 'Import'


class Structure extends Model {
  static get fields() {
    return {
      name: attr()
    }
  }

  static reducer(action: Action, Structure: any, session: any) {
    switch (action.type) {
      case '[GET] structures':
        for (let struct of action.payload) {
          if (Structure.withId(struct.name) === null) {
            Structure.upsert(struct)
          }
        }
        break
      case '[GET] required_structures':
        for (let item of action.payload) {
          session.QuestionRequired_structures.upsert(item)
        }
        break
      case '[GET] illegal_structures':
        for (let item of action.payload) {
          session.QuestionIllegal_structures.upsert(item)
        }
        break
      case '[POST] structures':
        for (let item of action.payload) {
          Structure.create(item)
        }
        break
      case '[DELETE] structures':
        let name_list = action.payload.map((_: any) => _.name)
        Structure.all().filter((struct: any) => name_list.includes(struct.name)).delete()
        break
    }
  }
}
Structure.options = {
  idAttribute: 'name'
}
Structure.modelName = 'Structure'


class Question extends Model {
  static get fields() {
    return {
      id: attr(),
      name: attr(),
      description: attr(),
      creator_id: fk({ to: 'User', as: 'creator', relatedName: 'questions' }),
      imports: many({ to: 'Import', as: 'imports', relatedName: 'questions' }),
      required_structures: many('Structure', 'required_for'),
      illegal_structures: many('Structure', 'illegal_for'),
      categories: many({ to: 'Category', as: 'categories', relatedName: 'question' }),
      operators: attr(),
      calls: attr(),
    }
  }

  static reducer(action: Action, Question: any, session: any) {
    switch (action.type) {
      case '[GET] questions':
        for (let question of action.payload) {
          if (Question.withId(question.id) == null) {
            let q = Question.upsert(question)
            q.update({ creator: session.User.first() })
          }
        }
        break
      case '[POST] /questions':
        for (let question of action.payload) {
          Question.upsert(question)
        }
        break
      case '[PUT] /questions':
        Question.upsert(action.payload)
        break
      case '[DELETE] questions':
        for (let item of action.payload) {
          Question.all().filter((question: question) => question.id == item.id).first().delete()
        }
        break
      case 'DELETE_RELATIONS':
        for (let id of action.payload.question_ids) {
          if (session.UserQuestions_completed.idExists(id)) {
            session.UserQuestions_completed.withId(id).delete()
          }
        }
        for (let id of action.payload.unit_ids) {
          if (session.UserUnits_completed.idExists(id)) {
            session.UserUnits_completed.withId(id).delete()
          }
        }
        for (let id of action.payload.course_ids) {
          if (session.UserCourses_completed.idExists(id)) {
            session.UserCourses_completed.withId(id).delete()
          }
        }
        break
      case '[GET] /questions/req_structures':
        for (let item of action.payload) {
          session.QuestionRequired_structures.create(item)
        }
        break
      case '[GET] /questions/ill_structures':
        for (let item of action.payload) {
          session.QuestionIllegal_structures.create(item)
        }
        break
      case '[GET] question_categories':
        for (let item of action.payload) {
          session.QuestionCategories.upsert(item)
        }
        break
      case '[GET] questions_completed':
        for (let item of action.payload) {
          session.UserQuestions_completed.upsert(item)
        }
        break
    }
  }
}
Question.modelName = 'Question'

class PoolQuestions extends Model {
  static get fields() {
    return {
      id: attr({ getDefault: () => crypto.randomUUID() }),
      fromPoolId: fk('Pool', 'questions_to'),
      toQuestionId: fk('Question', 'pools_from'),
    }
  }
}
PoolQuestions.modelName = 'PoolQuestions'

class Pool extends Model {
  static get fields() {
    return {
      id: attr(),
      poolnum: attr(),
      unit_id: fk('Unit', 'pools'),
      questions: many({ to: 'Question', through: 'PoolQuestions', relatedName: 'pools' }),
      prerequisites_to: many('Pool', 'prerequisites')
    }
  }

  static reducer(action: Action, Pool: any, session: any) {
    switch (action.type) {
      case '[GET] pools':
        for (let pool of action.payload) {
          Pool.upsert(pool)
        }
        break
      case '[GET] pool_questions':
        for (let item of action.payload) {
          session.PoolQuestions.upsert(item)
        }
        break
      case '[GET] pool_prerequisites':
        for (let item of action.payload) {
          session.PoolPrerequisites_to.upsert(item)
        }
        break
      case '[GET] pool_completed':
        for (let item of action.payload) {
          session.UserPools_completed.upsert(item)
        }
        break
    }
  }
}
Pool.modelName = 'Pool'

class UnitPrerequisites extends Model {
  static get fields() {
    return {
      id: attr({ getDefault: () => crypto.randomUUID() }),
      fromUnitId: fk('Unit', 'p_to'),
      toUnitId: fk('Unit', 'p'),
    }
  }

  static get modelName() {
    return 'UnitPrerequisites'
  }
}

class Unit extends Model {
  static get fields() {
    return {
      id: attr(),
      name: attr(),
      course_id: fk('Course', 'units'),
      categories: many({ to: 'Category', as: 'categories', relatedName: 'units' }),
      prerequisites: many({ to: 'Unit', through: 'UnitPrerequisites', throughFields: ['toUnitId', 'fromUnitId'], relatedName: 'prerequisite_to' }),
    }
  }

  static customUpsert(unit: any, session: any) {
    if (unit.prerequisites && unit.prerequisites.length > 0 && typeof (unit.prerequisites[0]) === 'object') {
      unit.prerequisites = unit.prerequisites.map((item: any) => item.id)
    }
    let db_unit = session.Unit.withId(unit.id as never)
    if (unit.pools) {
      for (let pool of db_unit.pools.all().toModelArray()) {
        pool.delete()
      }
      for (let pool of unit.pools) {
        // First we enforce the correct structure of the questions in the pool
        if (pool.questions) {
          pool.questions = pool.questions.map((question: any) => {
            if (typeof (question) == 'string') {
              return question
            } else {
              return question.id
            }
          })
        }
        pool.unit_id = unit.id
        if (pool.prerequisites) {
          pool.prerequisites = pool.prerequisites.map((prerequisite: any) => {
            if (typeof (prerequisite) == 'string') {
              return prerequisite
            } else {
              return prerequisite.id
            }
          })
        }
        session.Pool.create(pool)
      }
    }
    unit.categories = unit.categories.map((category: any) => category.name)
    return this.upsert(unit)
  }

  static updateUnitPrereqs(unit: any, session: any) {
    if (unit.prerequisites && unit.prerequisites.length > 0 && typeof (unit.prerequisites[0]) === 'object') {
      unit.prerequisites = unit.prerequisites.map((item: any) => item.id)
    }
    session.Unit.upsert(unit)
  }

  static reducer(action: Action, Unit: any, session: any) {
    switch (action.type) {
      case '[GET] units':
        for (let unit of action.payload) {
          Unit.upsert(unit)
        }
        break
      case '[GET] /units/unit':
        Unit.upsert(action.payload)
        break
      case '[GET] /units/questions':
        for (let item of action.payload) {
          session.UnitQuestions.upsert(item)
        }
        break
      case '[GET] unit_categories':
        for (let item of action.payload) {
          session.UnitCategories.upsert(item)
        }
        break
      case '[GET] unit_prerequisites':
        for (let item of action.payload) {
          session.UnitPrerequisites.create(item)
        }
        break
      case '[POST] /units':
        Unit.create(action.payload)
        for (let category of action.payload.categories) {
          session.UnitCategories.create({ id: crypto.randomUUID(), fromUnitId: action.payload.id, toCategoryId: category.name })
        }
        for (let pool of action.payload.pools) {
          session.Pool.create(pool)
        }
        break
      case '[PUT] /units':
        if (!Unit.idExists(action.payload.id)) return
        Unit.customUpsert(action.payload, session)
        break
      case '[DELETE] units':
        for (let item of action.payload) {
          if (Unit.idExists(item.id)) {
            Unit.withId(item.id).delete()
          }
        }
        break
    }
  }
}
Unit.modelName = 'Unit'


class QuestionInputOutput extends Model {
  static get fields() {
    return {
      id: attr(),
      question_id: fk({ to: 'Question', as: 'question', relatedName: 'input_outputs' }),
      input: attr(),
      output: attr(),
    }
  }

  static reducer(action: Action, QuestionInputOutput: any) {
    switch (action.type) {
      case '[GET] input_output':
        for (let item of action.payload) {
          QuestionInputOutput.upsert(item)
        }
        break;
    }
  }
}
QuestionInputOutput.modelName = 'QuestionInputOutput'


class Course extends Model {
  static get fields() {
    return {
      id: attr(),
      name: attr(),
      prerequisites_to: many('Course', 'prerequisites')
    }
  }

  static customUpsert(course: any, session: any) {
    let db_course = session.Course.withId(course.id)
    for (let unit of db_course.units.toModelArray()) {
      unit.set('course_id', null)
    }
    for (let unit of course.units) {
      session.Unit.updateUnitPrereqs(unit, session)
    }
    return this.upsert(course)
  }


  static reducer(action: Action, Course: any, session: any) {
    switch (action.type) {
      case '[GET] courses':
        for (let course of action.payload) {
          Course.upsert(course)
        }
        break
      case '[GET] /courses/course':
        if (Course.withId(action.payload.id) === null) {
          Course.create(action.payload)
        }
        break
      case '[GET] course_prerequisites':
        for (let item of action.payload) {
          session.CoursePrerequisites_to.upsert(item)
        }
        break
      case '[PUT] /courses':
        if (!Course.idExists(action.payload.id)) return
        Course.customUpsert(action.payload, session)
        break
      case '[POST] /courses':
        for (let course of action.payload) {
          Course.upsert(course)
          for (let unit of course.units) {
            session.Unit.upsert(unit)
          }
        }
        break
      case '[DELETE] courses':
        for (let item of action.payload) {
          if (Course.idExists(item.id)) {
            let db_course = Course.withId(item.id)
            for (let db_unit of db_course.units.toModelArray()) {
              db_unit.set('prerequisites', [])
            }
            db_course.delete()
          }
        }
        break
    }
  }
}
Course.modelName = 'Course'


class Example extends Model {
  static get fields() {
    return {
      id: attr(),
      input: attr(),
      output: attr(),
      explanation: attr(),
      question_id: fk({ to: 'Question', as: 'question', relatedName: 'examples' })
    }
  }

  static reducer(action: Action, Example: any) {
    switch (action.type) {
      case '[GET] /examples':
        for (let example of action.payload) {
          Example.upsert(example)
        }
        break
      case '[POST] /examples':
        for (let example of action.payload) {
          Example.create(example)
        }
        break
    }
  }
}
Example.modelName = 'Example'


class Sample extends Model {
  static get fields() {
    return {
      id: attr(),
      question_id: fk({ to: 'Question', as: 'question', relatedName: 'sample_solutions' }),
      source: attr(),
    }
  }

  static reducer(action: Action, Sample: any) {
    switch (action.type) {
      case '[GET] samples':
        for (let sample of action.payload) {
          Sample.upsert(sample)
        }
    }
  }
}
Sample.modelName = 'Sample'


class Code_Run extends Model {
  static get fields() {
    return {
      id: attr(),
      date: attr(),
      start_version: attr(),
      end_version: attr(),
      total_cases: attr(),
      cases_passed: attr(),
      runtime: attr(),
      user_code_id: fk('UserCode', 'code_runs')
    }
  }

  static reducer(action: Action, Code_Run: any, session: any) {
    switch (action.type) {
      case '[POST] /execution':
        if (Object.keys(action.payload).length == 0) return
        Code_Run.upsert(action.payload.code_run)
        let code_run = action.payload.code_run
        let db_user_code = session.UserCode.withId(code_run.user_code_id as never)
        let userid = db_user_code.user_id.ref.id
        let questionid = action.payload.question_id
        let db_question_completed = session.UserQuestions_completed.all().toModelArray().filter(
          (item: any) => {
            let iud = item.ref.fromUserId
            let iqid = item.ref.toQuestionId
            return iud == userid && iqid == questionid
          }
        )
        for (let item of db_question_completed) {
          item.delete()
        }
        if (action.payload.question) {
          session.UserQuestions_completed.create(action.payload.question)
        }
        break
      case '[GET] code_runs':
        for (let run of action.payload) {
          Code_Run.upsert(run)
        }
        break
      case '[GET] code_run':
        for (let code_run of action.payload) {
          Code_Run.upsert(code_run)
        }
    }
  }
}
Code_Run.modelName = 'Code_Run'

export { User, Category, UnitPrerequisites, Import, Structure, Question, Unit, Pool, PoolQuestions, Course, QuestionInputOutput, Example, Sample, UserCode, Code_Run }