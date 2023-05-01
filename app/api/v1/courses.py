from typing import List
from fastapi import APIRouter, HTTPException, Depends

from app.dependencies import lecturer
from app.Crud.Crud import Crud
from app.util import Schemas, types
import app.main as main

router = APIRouter(prefix='/api/v1')


# -------------------------------- CREATE -------------------------------------


@router.post('/courses')
async def create_course(courses: List[Schemas.Course]):
    '''This method is used to create a course'''
    return main.database.create_courses(courses)


@router.post('/courses/{courseId}/enroll')
async def enroll_in_course(courseId: str, user: types.User = Depends()):
    '''This route is used when a user wants to enroll in a course.'''
    res, err = Crud().enroll_user(courseId, user)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res


# -------------------------------- READ ---------------------------------------


# -------------------------------- UPDATE -------------------------------------


@router.put('/courses')
async def update_course(course: Schemas.Course):
    res, err = main.database.update_course(course)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res


# -------------------------------- DELETE -------------------------------------

