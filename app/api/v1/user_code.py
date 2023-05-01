from fastapi import APIRouter, Depends, HTTPException

from app.util import types, Schemas
import app.main as main

router = APIRouter(prefix='/api/v1')


# -------------------------------- CREATE -------------------------------------


# -------------------------------- READ ---------------------------------------


@router.get('/user_code')
async def get_user_code(user: types.User = Depends()):
    res, err = main.database.get_user_code(user)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res


@router.get('/user_code/code_runs')
async def get_code_runs(user_code_id: str):
    res, err = main.database.get_user_code_runs(user_code_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res


@router.get('/user_code/instance')
async def get_user_code_instance(user_code_id: str):
    res, err = main.database.get_user_code_instance(user_code_id)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res


# -------------------------------- UPDATE -------------------------------------


@router.put('/user_code')
async def save_user_code(user_code: Schemas.UserCodeTable):
    res, err = main.database.save_user_code(user_code)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res

# -------------------------------- DELETE -------------------------------------
