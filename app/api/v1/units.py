from fastapi import APIRouter, HTTPException

from app.Crud.Crud import Crud
from app.util import Schemas
import app.main as main

router = APIRouter(prefix='/api/v1')


# -------------------------------- CREATE -------------------------------------


@router.post('/units')
async def create_unit(unit: Schemas.Unit):
    res, err = main.database.create_unit(unit)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res


# -------------------------------- READ ---------------------------------------


# -------------------------------- UPDATE -------------------------------------


@router.put('/units')
async def update_unit(unit: Schemas.Unit):
    res, err = main.database.update_unit(unit)
    if err:
        raise HTTPException(status_code=500, detail=err)
    return res


# -------------------------------- DELETE -------------------------------------

