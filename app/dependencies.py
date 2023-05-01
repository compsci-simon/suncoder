from fastapi import Depends, HTTPException
import app.util.types as types


async def lecturer(user: types.User = Depends(types.User)):
    if user.type != 'lecturer':
        raise HTTPException(status_code=401)
