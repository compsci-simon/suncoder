import app.main as main
from fastapi import Request
import jwt
import os
PROD = os.environ.get('PROD')


class User:
    def __init__(self, request: Request):
        token = request.headers.get('Authorization')
        if not token:
            return None
        token = token.split(' ')[1]
        decoded = jwt.decode(token, options={"verify_signature": False})
        username = decoded['username']
        user = main.database.get_user(username=username)
        self.username = username
        self.type = user.type if user else None
        self.id = user.id if user else None
