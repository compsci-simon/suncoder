import { category, imprt, structure } from "../../apis";
import fastapi from "../../apis/api";
import { DELETE_CATEGORY, DELETE_IMPORT, DELETE_STRUCTURE } from "../../orm/index";
import { AppDispatch } from "../../store";

// --------------------------------- CATEGORIES -------------------------------
export const delete_category = (category: category) => async (dispatch: AppDispatch) => {
  try {
    await fastapi.categories.delete(category)
    dispatch({ type: DELETE_CATEGORY, payload: category })
  } catch (error) {
    dispatch({ type: '[DELETE:ERROR] /categories', payload: error })
  }
}

// --------------------------------- IMPORTS -------------------------------
export const delete_import = (imprt: imprt) => async (dispatch: AppDispatch) => {
  try {
    await fastapi.imprts.delete(imprt)
    dispatch({ type: DELETE_IMPORT, payload: imprt })
  } catch (error) {
    dispatch({ type: '[DELETE:ERROR] /imports', payload: error })
  }
}


// --------------------------------- STRUCTURES -------------------------------
export const delete_structure = (structure: structure) => async (dispatch: AppDispatch) => {
  try {
    await fastapi.structures.delete(structure)
    dispatch({ type: DELETE_STRUCTURE, payload: structure })
  } catch (error) {
    dispatch({ type: '[DELETE:ERROR] /structures', payload: error })
  }
}