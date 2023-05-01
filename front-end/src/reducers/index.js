import { combineReducers } from 'redux'
import { createReducer } from 'redux-orm'
import orm from '../orm/orm'
import { SHOW_BACKDROP, HIDE_BACKDROP } from '../orm'

const identityReducer = (identity={}, action) => {
  if (action.type === 'SIGN_IN') {
    return action.payload ? action.payload : identity
  }
  return identity
}

const backdrop_reducer = (backdrop=false, action) => {
  if (action.type === SHOW_BACKDROP) {
    return true
  } else if (action.type === HIDE_BACKDROP) {
    return false
  }
  return backdrop
}

const execution_reducer = (results={}, action) => {
  if (action.type === '[POST] /execution_results') {
    if (action.payload) {
      return action.payload
    }
  }
  return results
}

const selected_item_reducer = (selected_item='Tests', action) => {
  if (action.type == 'SELECT TREE ITEM') {
    return action.payload
  }
  return selected_item
}

export default combineReducers({
  identity: identityReducer,
  entities: createReducer(orm),
  backdrop: backdrop_reducer,
  code_run_results: execution_reducer,
  selected_item: selected_item_reducer,
})