from fastapi import APIRouter, HTTPException

from app.Crud.Crud import Crud
from app.util import Schemas

router = APIRouter()

# -------------------------------- CREATE -------------------------------------


# @router.post('/categories')
# async def create_category(category: Schemas.Fragment):
#     res, err = Crud().create_new_category(category.name)
#     if err:
#         raise HTTPException(status_code=500, detail=err)
#     return res


# -------------------------------- READ ---------------------------------------


# -------------------------------- UPDATE -------------------------------------


# -------------------------------- DELETE -------------------------------------


# @router.delete('/categories')
# async def delete_category(category: Schemas.Fragment):
#     res, err = Crud().delete_category(category.name)
#     if err:
#         raise HTTPException(status_code=500, detail=str(err))
#     return res
