import { unit } from "../../apis";
import fastapi from "../../apis/api";
import { CREATE_UNIT, DELETE_UNITS, GET_UNIT, GET_UNITS, GET_UNIT_CATEGORIES, GET_UNIT_QUESTIONS, HIDE_BACKDROP, SHOW_BACKDROP, UPDATE_UNIT } from "../../orm/index";
import { AppDispatch, RootState } from "../../store";


export const fetch_units = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.units.get()
        dispatch({ type: GET_UNITS, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /units', payload: error })
      }
    }
  }
})()


export const update_unit = (unit: unit, afterEffect: () => void) => async (dispatch: AppDispatch) => {
  try {
    dispatch({ type: SHOW_BACKDROP })
    await fastapi.unit.put(unit)
    dispatch({ type: UPDATE_UNIT, payload: unit })
    dispatch({ type: HIDE_BACKDROP })
    afterEffect()
  } catch (error) {
    dispatch({ type: '[PUT:ERROR] /units', payload: `${error}` })
  }
}

export const create_unit = (unit: unit, afterEffect: () => void) => async (dispatch: AppDispatch) => {
  try {
    dispatch({ type: SHOW_BACKDROP })
    const { data } = await fastapi.units.create(unit)
    dispatch({ type: CREATE_UNIT, payload: data })
    dispatch({ type: HIDE_BACKDROP })
    afterEffect()
  } catch (error) {
    dispatch({ type: '[POST:ERROR] /units', payload: error })
  }
}

export const delete_units = (units: number[]) => async (dispatch: AppDispatch) => {
  try {
    await fastapi.units.delete(units)
    dispatch({ type: DELETE_UNITS, payload: units })
  } catch (error) {
    dispatch({ type: '[DELETE:ERROR] /units', payload: error })
  }
}

export const fetch_unit = (unit_id: number) => async (dispatch: AppDispatch) => {
  try {
    const { data } = await fastapi.unit.get(unit_id)
    dispatch({ type: GET_UNIT, payload: data })
  } catch (error) {
    dispatch({ type: '[GET:ERROR] /units/unit', payload: error })
  }
}

export const fetch_unit_questions = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.unit.questions()
        dispatch({ type: GET_UNIT_QUESTIONS, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /units/questions', payload: error })
      }
    }
  }
})()


export const fetch_unit_categories = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.unit.categories()
        dispatch({ type: GET_UNIT_CATEGORIES, payload: data })
      } catch (error) {
        dispatch({ type: '[GET:ERROR] /units/categories', payload: error })
      }
    }
  }
})()
