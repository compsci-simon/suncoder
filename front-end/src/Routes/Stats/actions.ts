import fastapi from "../../apis/api"
import { AppDispatch } from "../../store"

export const fetch_question_user_attempts = (() => {
  let executed: {
    [key: string]: boolean
  } = {}
  return (question_id: string) => async (dispatch: AppDispatch) => {
    if (!executed[question_id]) {
      executed[question_id] = true
      try {
        const { data } = await fastapi.question.user_code(question_id)
        dispatch({ type: '[GET] /questions/user_code', payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /questions/user_code', payload: error })
      }
    }
  }
})()

export const fetch_question_user_code_runs = (() => {
  let executed = false
  return (question_id: string) => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.user.code_runs(question_id)
        dispatch({ type: '[GET] /users/code_runs', payload: data })
      } catch (error) {
        console.log(error)
        dispatch({ type: '[GET:ERROR] /users/code_runs', payload: error })
      }
    }
  }
})()

export const fetch_user_code_code_runs = (() => {
  let executed = false
  return (user_code_id: string) => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.user_code.code_runs(user_code_id)
        dispatch({ type: '[GET] /user_code/code_runs', payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /user_code/code_runs', payload: error })
      }
    }
  }
})()

export const fetch_user_code_instance = (() => {
  let executed: {
    [key: string]: boolean
  } = {}
  return (user_code_id: string) => async (dispatch: AppDispatch) => {
    if (!executed[user_code_id]) {
      executed[user_code_id] = true
      try {
        const { data } = await fastapi.user_code.instance(user_code_id)
        dispatch({ type: '[GET] /user_code/instance', payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /user_code/instance', payload: error })
      }
    }
  }
})()

export const fetch_code_run_instance = (() => {
  let executed: {
    [key: string]: boolean
  } = {}
  return (code_run_id: string) => async (dispatch: AppDispatch) => {
    if (!executed[code_run_id]) {
      executed[code_run_id] = true
      try {
        const { data } = await fastapi.table.get('code_run', { id: code_run_id })
        dispatch({ type: '[GET] code_run', payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /code_runs/instance', payload: error })
      }
    }
  }
})()