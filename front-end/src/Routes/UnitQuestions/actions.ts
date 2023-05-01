import fastapi from "../../apis/api"
import { AppDispatch } from "../../store"

export const fetch_completed_questions = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.user.completed_questions()
        dispatch({ type: '[GET] /users/questions_completed', payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /users/questions_completed' })
      }
    }
  }
})()

export const fetch_pools = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.pools.get()
        dispatch({ type: '[GET] /pools', payload: data })
      } catch (error) {

      }
    }
  }
})()

export const fetch_pool_question_jtable = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.table.get('pool_questions')
        dispatch({ type: '[GET] pool_questions', payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] pool_questions', payload: error })
      }
    }
  }
})()

export const fetch_pool_pool_jtable = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.table.get('pool_prerequisites')
        dispatch({ type: '[GET] pool_prerequisites', payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] pool_prerequisites', payload: error })
      }
    }
  }
})()

export const fetch_completed_pools = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.table.get('pool_completed')
        dispatch({ type: '[GET] pool_completed', payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] pool_completed', payload: error })
      }
    }
  }
})()

export const fetch_user_pool_questions = (() => {
  let executed = {}
  return (unit_id: string) => async (dispatch: AppDispatch) => {
    if (!executed[unit_id]) {
      // executed[unit_id] = true
      try {
        const { data } = await fastapi.user.pool_questions(unit_id)
        dispatch({ type: '[GET] user_pool_questions', payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] user_pool_questions', payload: error })
      }
    }
  }
})()