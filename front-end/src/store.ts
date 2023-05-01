/**
 * @jest-environment jsdom
 */
import { legacy_createStore as createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import reducers from './reducers';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const store = createStore(
  reducers,
  composeEnhancers(applyMiddleware(thunk))
);
declare global {
  interface Window {
    store: any
  }
}
window.store = store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store