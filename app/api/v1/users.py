import os
from fastapi import APIRouter, Depends, HTTPException
import app.main as main
from app.util import Schemas, types

router = APIRouter()

# -------------------------------- READ ---------------------------------------


@router.get('/users/get_id')
async def get_id(user: types.User = Depends()):
    try:
        return {'id': user.id, 'type': user.type, 'username': user.username}
    except Exception:
        raise HTTPException(status_code=500, detail='Cannot get username')


@router.get('/users/unit/pool/questions')
async def get_user_unit_pool_questions(unit_id: str, user: types.User = Depends()):
    res, err = main.database.get_user_unit_pool_questions(unit_id, user)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res

# -------------------------------- UPDATE -------------------------------------


@router.put('/users/enroll')
async def enroll_user(course_id: Schemas.Course_ID, user: types.User = Depends()):
    res, err = main.database.enroll_user(course_id.id, user)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res


@router.patch('/users/change_password')
def change_password(passwordClass: Schemas.Password, user: types.User = Depends()):
    return main.database.change_password(passwordClass.password, user)
