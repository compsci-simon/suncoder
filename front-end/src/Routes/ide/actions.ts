import fastapi from "../../apis/api";
import { GET_USER_CODE, HIDE_BACKDROP, LOG_KEYSTROKE, SHOW_BACKDROP, UPDATE_USER_CODE } from "../../orm/index";
import orm from "../../orm/orm";
import { AppDispatch, RootState } from "../../store";

export const fetch_user_code = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.user_code.get()
        dispatch({ type: GET_USER_CODE, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /user_code' })
      }
    }
  }
})()

export const log_keystroke = (keystroke_object: any) => {
  return { type: LOG_KEYSTROKE, payload: keystroke_object }
}

export const flush_user_code = (user_code_id: string, callback?: () => void) => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    let state = getState()
    let session = orm.session(state.entities)
    let user_code = session.UserCode.withId(user_code_id as never)
    dispatch({ type: 'FLUSHING USER_CODE' })
    if (callback) {
      callback()
    }
    await fastapi.user_code.save(user_code.ref)
  } catch (error) {
    dispatch({ type: '[PUT: ERROR] /user_code', payload: error })
  }
}

export const execute_code = (course_id: string, unit_id: string, pool_id: string, question_id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    dispatch({ type: SHOW_BACKDROP })
    let session = orm.session(getState().entities)
    let user_code = session.UserCode.all().toModelArray().filter((item: any) => {
      if (item.ref.user_id == getState().identity.id && item.ref.question_id == question_id) {
        return item
      }
    })[0]
    dispatch<any>(flush_user_code(user_code.id, () => {
      fastapi.execute_code(course_id, unit_id, pool_id, question_id).then((resp: any) => {
        let job_id = resp.data['job_id']['uuid']
        setTimeout(() => dispatch<any>(get_job_status(job_id, 100)), 100)
      })
    }))

  } catch (error) {
    console.log(error)
    dispatch({ type: 'EXECUTION ERROR', payload: error })
  }
}

const get_job_status = (job_id: string, wait: number) => async (dispatch: AppDispatch) => {
  try {
    const { data } = await fastapi.get_job(job_id)
    if (data['status'] != 'waiting' && data['status'] != 'busy') {
      dispatch({ type: '[POST] /execution_results', payload: { ...data.results, question_id: data.question_id } })
      dispatch({
        type: '[POST] /execution', payload: {
          code_run: data.code_run,
          question: data.userQuestionCompleted,
          unit: data.userUnitCompleted,
          course: data.userCourseCompleted,
          question_id: data.question_id,
          unit_id: data.unit_id,
          course_id: data.course_id,
        }
      })
      dispatch({ type: 'SELECT TREE ITEM', payload: -1 })
      dispatch({ type: HIDE_BACKDROP })
    } else {
      setTimeout(() => dispatch<any>(get_job_status(job_id, wait + 100)), wait + 100)
    }
  } catch (error) {
    console.log(error)
    dispatch({ type: 'GET_JOB_STATUS_ERROR', payload: error })
  }
}

export const create_user_code = (() => {
  let executed = {}
  return (user_code: any) => async (dispatch: AppDispatch) => {
    if (!executed[`${user_code.user_id}-${user_code.question_id}`]) {
      executed[`${user_code.user_id}-${user_code.question_id}`] = true
      dispatch({ type: '[POST] user_code', payload: user_code })
    }
  }
})()

export const lint = (source: string, setModelChanges: (modelchange: any, source: string) => void) => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    const { data } = await fastapi.lint({ source: source, function: true })
    setModelChanges(data['errors'], source)
  } catch (error) {
    dispatch({ type: '[SERVICES: ERROR] /linting' })
  }
}

export const select_tree_item = (selected_item: number) => {
  return { type: 'SELECT TREE ITEM', payload: selected_item }
}