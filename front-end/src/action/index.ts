import fastapi from "../apis/api"
import { AppDispatch } from "../store"

export const showBackdrop = () => {
  return { type: 'SHOW_BACKDROP' }
}

export const hideBackdrop = () => {
  return { type: 'HIDE_BACKDROP' }
}

export const fetch_table = (() => {
  var executed = {}
  return (table: string, callback?: () => void) => async (dispatch: AppDispatch) => {
    if (!executed[table]) {
      executed[table] = true
      try {
        const { data } = await fastapi.table.get(table)
        dispatch({ type: `[GET] ${table}`, payload: data })
        if (callback) {
          callback()
        }
      } catch (error) {
        delete executed[table]
        console.log(`deleted ${table}`)
        dispatch({ type: `[GET:ERROR] ${error}` })
      }
    } else if (callback) {
      callback()
    }
  }
})()

export const create_object = (tablename: string, object: Object) => async (dispatch: AppDispatch) => {
  try {
    const { data } = await fastapi.table.create(tablename, object)
    dispatch({ type: `[POST] ${tablename}`, payload: data })
  } catch (error) {
    dispatch({ type: '[CREATE] ERROR' })
  }
}

export const delete_object = (tablename: string, pk_list: any[], callback?: () => void) => async (dispatch: AppDispatch) => {
  try {
    await fastapi.table.delete(tablename, pk_list)
    dispatch({ type: `[DELETE] ${tablename}`, payload: pk_list })
  } catch (error) {
    console.log(error)
    if (callback) {
      callback()
    }
    dispatch({ type: 'ERROR:[DELETE]', payload: error })
  }
}

export const get_user = (() => {
  let executed = false
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true
      try {
        const { data } = await fastapi.user.get_id()
        dispatch({ type: 'SIGN_IN', payload: data })
      } catch (error) {
        executed = false
        dispatch({ type: 'ERROR GETTING ID' })
      }
    }
  }
})()