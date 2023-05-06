import app.main as main
from fastapi import HTTPException, Request
import jwt
import os


class User:
    def __init__(self, request: Request):
        token = request.headers.get('Authorization')
        if not token:
            raise HTTPException(
                status_code=401, detail='Authorization token not set')
        token = token.split(' ')[1]
        decoded = jwt.decode(token, options={"verify_signature": False})
        username = decoded['username']
        id = decoded['id']
        user = main.database.get_user(id=id)
        self.username = username
        self.type = user.type if user else None
        self.id = user.id if user else None
