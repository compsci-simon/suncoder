import fastapi from "../../apis/api";
import { user } from "../../models";
import { AppDispatch } from "../../store";

export const fetch_users = (() => {
  let executed = false;
  return () => async (dispatch: AppDispatch) => {
    if (!executed) {
      executed = true;
      try {
        dispatch({ type: "USERS FETCHING", payload: null });
        const { data } = await fastapi.users.get();
        dispatch({ type: "[GET] /users", payload: data });
        dispatch({ type: "USERS FETCHED", payload: null });
      } catch (error) {
        dispatch({ type: "[GET:ERROR] /users", payload: error });
      }
    }
  };
})();

export const delete_users = (users: number[]) => {
  return async (dispatch: AppDispatch) => {
    try {
      await fastapi.users.delete(users);
      dispatch({ type: "[DELETE] /users", payload: users });
    } catch (error) {
      dispatch({ type: "[DELETE:ERROR] /users", payload: error });
    }
  };
};

export const create_users = (users: [user]) => {
  return async (dispatch: AppDispatch) => {
    try {
      const { data } = await fastapi.users.create(users);
      dispatch({ type: "[POST] /users", payload: data });
    } catch (error) {
      dispatch({ type: "[POST:ERROR] /users", payload: error });
    }
  };
};
