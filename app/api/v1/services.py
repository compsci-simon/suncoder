import json
from time import time
from fastapi import APIRouter
import os
import threading

from app.util import Schemas
from app.util.linting import lint
from app.util.APIclient import APIClient
from app.util.verification import inputData

router = APIRouter(prefix='/api/v1/services')


# -------------------------------- CREATE -------------------------------------


@router.post('/lint')
async def linting_engine(code: Schemas.Code):
    results = {'errors': None}
    t1 = threading.Thread(target=lint, args=(
        code.source, results, code.function,))
    t1.start()
    # t1.join()
    return results


@router.post('/verify')
async def verify_sample(sample_question: dict):
    return inputData().getInput(sample_question)


# -------------------------------- READ ---------------------------------------


# -------------------------------- UPDATE -------------------------------------


# -------------------------------- DELETE -------------------------------------
