from fastapi import Request
import jwt
import os
PROD = os.environ.get('PROD')
import app.main as main


class User:
    def __init__(self, request: Request):
        token = request.headers.get('Authorization').split(' ')[1]
        if not token:
            return None
        decoded = jwt.decode(token, options={"verify_signature": False})
        username = decoded['username']
        user = main.database.get_user(username=username)
        self.username = username
        self.type = user.type if user else None
        self.id = user.id if user else None
