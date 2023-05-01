import fastapi from "../../apis/api";
import { AppDispatch, RootState } from "../../store";
import { course } from "../../apis";
import { CREATE_COURSE, DELETE_COURSES, GET_COURSE, GET_COURSES, GET_COURSE_PREREQUISITES, GET_UNIT_PREREQUISITES, HIDE_BACKDROP, SHOW_BACKDROP, UPDATE_COURSE } from "../../orm/index";

export const fetch_course = (courseId: number) => async (dispatch: AppDispatch) => {
  try {
    const { data } = await fastapi.courses.fetch(courseId)
    dispatch({ type: GET_COURSE, payload: data })
  } catch (error) {
    dispatch({ type: '[GET:ERROR] /courses/course', payload: error })
  }
}

export const delete_courses = (ids: number[]) => async (dispatch: AppDispatch) => {
  try {
    dispatch({ type: SHOW_BACKDROP })
    await fastapi.courses.delete(ids)
    dispatch({ type: DELETE_COURSES, payload: ids })
    dispatch({ type: HIDE_BACKDROP })
  } catch (error) {
    dispatch({ type: '[DELETE:ERROR] /courses', payload: error })
  }
}

export const create_courses = (course: course, afterEffect: () => void) => async (dispatch: AppDispatch) => {
  try {
    dispatch({ type: SHOW_BACKDROP })
    console.log(JSON.stringify([course]))
    const { data } = await fastapi.courses.create([course])
    dispatch({ type: CREATE_COURSE, payload: data })
    dispatch({ type: HIDE_BACKDROP })
    afterEffect()
  } catch (error) {
    console.error(error)
    dispatch({ type: '[POST:ERROR] /courses', payload: error })
  }
}

export const update_course = (course: course, afterEffect: () => void) => async (dispatch: AppDispatch) => {
  try {
    dispatch({ type: 'SHOW_BACKDROP' })
    await fastapi.courses.update(course)
    dispatch({ type: UPDATE_COURSE, payload: course })
    dispatch({ type: 'HIDE_BACKDROP' })
    afterEffect()
  } catch (error) {
    console.log(error)
    dispatch({ type: `[PUT:ERROR] ${error}` })
  }
}

export const fetch_course_prerequisites = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.courses.prerequisites()
        dispatch({ type: GET_COURSE_PREREQUISITES, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /courses/prerequisites', payload: error })
      }
    }
  }
})()


export const fetch_unit_prerequisites = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.units.prerequisites()
        dispatch({ type: GET_UNIT_PREREQUISITES, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /units/prerequisites', payload: error })
      }
    }
  }
})()
