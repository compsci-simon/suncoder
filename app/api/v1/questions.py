from typing import List
from fastapi import APIRouter, Depends, HTTPException

from app.util import Schemas, types
import app.main as main

router = APIRouter()

# -------------------------------- CREATE -------------------------------------


@router.post("/questions")
async def create_questions(questions: List[Schemas.Question], user: types.User = Depends()):
    msg, err = main.database.create_questions(questions, user)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return msg


# -------------------------------- READ ---------------------------------------

# -------------------------------- UPDATE -------------------------------------


@router.put("/questions")
async def update_question(question: Schemas.Question):
    res, err = main.database.update_question(question)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res


# -------------------------------- DELETE -------------------------------------
