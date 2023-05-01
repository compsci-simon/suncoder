import fastapi from "../../apis/api"
import { HIDE_BACKDROP, SHOW_BACKDROP } from "../../orm"
import { AppDispatch } from "../../store"

export const login = (username: string, password: string, afterEffect: (data: boolean) => void) => async (dispatch: AppDispatch) => {
  try {
    dispatch({ type: SHOW_BACKDROP })
    const { data } = await fastapi.user.login(username, password)
    afterEffect(data)
    dispatch({ type: HIDE_BACKDROP })
  } catch (error) {
    console.log(error)
    dispatch({ type: '[POST:ERROR] /authentication', payload: error })
    dispatch({ type: HIDE_BACKDROP })
  }
}