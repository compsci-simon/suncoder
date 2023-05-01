import jwt
import datetime 
from .utils import get_project_root

def createJWT(identity):
  # Define the payload for the token
  payload = {
    'id': identity['id'],
    'username': identity['username'],
    'type': identity['type'],
    'iat': datetime.datetime.utcnow()
  }
  filepath = f'{get_project_root()}/private.pem'
  with open(filepath, 'rb') as f:
      private_key = f.read()

  # Sign the payload with the private key to create a token
  return jwt.encode(payload, private_key, algorithm='RS256')
