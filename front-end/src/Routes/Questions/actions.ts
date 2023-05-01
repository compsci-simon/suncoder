import { question } from '../../apis'
import fastapi from '../../apis/api'
import { CREATE_QUESTION, DELETE_QUESTIONS, GET_EXAMPLES, GET_QUESTIONS, GET_QUESTION_ILL_STRUCTURES, GET_QUESTION_IMPORTS, GET_QUESTION_IO, GET_QUESTION_REQ_STRUCTURES, GET_SAMPLES, HIDE_BACKDROP, SHOW_BACKDROP, UPDATE_QUESTION } from '../../orm/index'
import { AppDispatch, RootState } from '../../store'
import _ from 'underscore'
import { erinObj, sample_verification_obj } from '../..'

export const create_questions = (questions: question[], afterEffect: () => void) => async (dispatch: AppDispatch) => {
  try {
    dispatch({ type: SHOW_BACKDROP })
    const { data } = await fastapi.questions.create(questions)
    dispatch({ type: CREATE_QUESTION, payload: data })
    afterEffect()
    dispatch({ type: HIDE_BACKDROP })
  } catch (error) {
    console.log(error)
    dispatch({ type: '[POST:ERROR] /questions', payload: error })
  }
}

export const update_question = (question: question) => async (dispatch: AppDispatch) => {
  try {
    dispatch({ type: SHOW_BACKDROP })
    console.log('updating question', question)
    const { data } = await fastapi.questions.update(question)
    dispatch({ type: UPDATE_QUESTION, payload: data })
    dispatch({ type: HIDE_BACKDROP })
  } catch (error) {
    console.log(error)
    dispatch({ type: '[PUT:ERROR] /questions', payload: error })
  }
}

export const fetch_questions = (() => {
  var executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.table.get('questions')
        dispatch({ type: GET_QUESTIONS, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /questions', payload: error })
      }
    }
  }
})()



export const fetch_question_categories = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.table.get('question_categories')
        dispatch({ type: '[GET] question_categories', payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /questions/categories', payload: error })
      }
    }
  }
})()


export const fetch_examples = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.table.get('examples')
        dispatch({ type: GET_EXAMPLES, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /examples', payload: error })
      }
    }
  }
})()


export const fetch_question_io = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.questions.get_io()
        dispatch({ type: GET_QUESTION_IO, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /questions/io', payload: error })
      }
    }
  }
})()


export const fetch_question_imports = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.imprts.question_imports()
        dispatch({ type: GET_QUESTION_IMPORTS, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /imports/questions', payload: error })
      }
    }
  }
})()


export const fetch_question_required_structures = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.structures.required_structures()
        dispatch({ type: GET_QUESTION_REQ_STRUCTURES, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /structures/required', payload: error })
      }
    }
  }
})()


export const fetch_question_illegal_structures = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.structures.illegal_structures()
        dispatch({ type: GET_QUESTION_ILL_STRUCTURES, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /structures/required', payload: error })
      }
    }
  }
})()


export const delete_questions = (questions: number[]) => async (dispatch: AppDispatch) => {
  try {
    await fastapi.questions.delete(questions)
    dispatch({ type: DELETE_QUESTIONS, payload: questions })
  } catch (error) {
    dispatch({ type: '[DELETE:ERROR] /questions', payload: error })
  }
}

export const fetch_samples = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.samples.get()
        dispatch({ type: GET_SAMPLES, payload: data })
      } catch (error) {
        dispatch({ type: '[DELETE:ERROR] /questions', payload: error })
      }
    }
  }
})()

export const lint = (source: string, setModelMarkers: (errors: any, source: any) => void) => async (dispatch: AppDispatch) => {
  try {
    const { data } = await fastapi.lint({ source: source, function: true })
    setModelMarkers(data['errors'], source)
  } catch (error) {
    dispatch({ type: 'ERROR linting', payload: error })
  }
}

export const test_sample = (sample: string, question: any, fields: any, index: number) => async (dispatch: AppDispatch) => {
  try {
    let test_cases: { 'in': any, 'out': any }[] = []
    for (let test_case of question.input_outputs) {
      let i = test_case.input
      let o = test_case.output
      try {
        i = JSON.parse(test_case.input)
      } catch (error) { }
      try {
        o = JSON.parse(test_case.output)
      } catch (error) { }
      test_cases.push({ 'in': i, 'out': o })
    }

    let required: any = {
      'branching': false, 'classes': false,
      'for': false, 'nested': false, 'recursion': false, 'while': false
    }
    let illegal: any = {
      'branching': false, 'classes': false,
      'for': false, 'nested': false, 'recursion': false, 'while': false
    }
    for (let structure of question.required_structures) {
      if (structure.name in required) {
        required[structure.name] = true
      }
    }
    for (let structure of question.illegal_structures) {
      if (structure.name in illegal) {
        illegal[structure.name] = true
      }
    }
    let ques = {
      'imports': question.allowed_imports,
      'calls': question.calls,
      'operators': question.operators.map((op: { name: string }) => op.name),
      'required': required,
      'illegal': illegal,
      'test cases': test_cases,
      'solutions': [sample]
    }
    const { data } = await fastapi.verify_sample(ques)
    let field_val = fields.value[index]
    fields.update(index, { ...field_val, test_results: data })
  } catch (error) {
    dispatch({ type: 'ERROR Testing sample' })
  }
}

export const test_sample2 = (question: erinObj, callback: (response: sample_verification_obj) => void) => async (dispatch: AppDispatch) => {
  try {
    const { data } = await fastapi.verify_sample(question)
    callback(data)
  } catch (error) {
    dispatch({ type: 'ERROR: test sample 2' })
  }
}