import fastapi from "../../apis/api";
import { GET_USER_UNITS_COMPLETED } from "../../orm";
import { AppDispatch, RootState } from "../../store";

// export const fetch_units_completed = (() => {
//   let executed = false
//   return () => async(dispatch: AppDispatch) => {
//     if (!executed) {
//       executed = true
//       try {
//         const { data } = await fastapi.user.completed_units()
//         dispatch({type: GET_USER_UNITS_COMPLETED, payload: data})
//       } catch (error) {
//         dispatch({type: '[GET:ERROR] /users/units_completed', payload: error})
//       }
//     }
//   }
// })()
