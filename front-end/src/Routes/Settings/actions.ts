import fastapi from "../../apis/api";
import { ENROLL_USER, GET_USER_COMPLETED_COURSES, GET_USER_ENROLLED_COURSES } from "../../orm/index";
import { AppDispatch, RootState } from "../../store";

export const fetch_enrolled_courses = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.user.enrolled_courses()
        dispatch({ type: GET_USER_ENROLLED_COURSES, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /users/enrooled_courses' })
      }
    }
  }
})()


export const fetch_completed_courses = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.user.completed_courses()
        dispatch({ type: GET_USER_COMPLETED_COURSES, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /users/completed_courses', payload: error })
      }
    }
  }

})()


export const enroll = (course_id: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
  try {
    await fastapi.user.enroll(course_id)
    dispatch({ type: ENROLL_USER, payload: { course_id, user_id: getState().identity.id } })
  } catch (error) {
    dispatch({ type: `[PUT:ERROR] ${error}` })
  }
}