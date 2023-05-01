from typing import Optional
from fastapi import APIRouter, HTTPException
import app.main as main
router = APIRouter(prefix='/api/v1')


# -------------------------------- CREATE -------------------------------------

@router.post('/objects')
async def create_object(tablename: str, items: list):
    try:
        return main.database.create_table(tablename, items)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f'Error creating object: {tablename}\n{e}')
# -------------------------------- READ ---------------------------------------


@router.get('/tables')
async def get_table(table: str, extra_args=None):
    return main.database.get_table(table, extra_args)


# -------------------------------- UPDATE -------------------------------------


# -------------------------------- DELETE -------------------------------------
@router.delete('/objects')
async def delete_objects(tablename: str, id_list: list):
    try:
        return main.database.delete_objects(tablename, id_list)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f'Error deleting objects: {tablename}\n{e}')
