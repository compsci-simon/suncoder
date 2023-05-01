import base64
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
import jwt
import requests
import json


class ValidateToken:
    def __init__(self):
        url = 'https://login.microsoftonline.com/common/discovery/keys'
        text = requests.get(url).text
        self.jwks = json.loads(text)
        self.issuer = 'https://login.microsoftonline.com/a6fa3b03-0a3c-4258-8433-a120dffcd348/v2.0'
        self.valid_audiences = ['48acc21f-b44b-429d-ae7a-4f16a732e2a9']

    class InvalidAuthorizationToken(Exception):
        def __init__(self, details):
            super().__init__('Invalid authorization token: ' + details)

    def ensure_bytes(self, key):
        if isinstance(key, str):
            key = key.encode('utf-8')
        return key

    def decode_value(self, val):
        decoded = base64.urlsafe_b64decode(self.ensure_bytes(val) + b'==')
        return int.from_bytes(decoded, 'big')

    def rsa_pem_from_jwk(self, jwk):
        return RSAPublicNumbers(
            n=self.decode_value(jwk['n']),
            e=self.decode_value(jwk['e'])
        ).public_key(default_backend()).public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

    def get_jwk(self, kid):
        for jwk in self.jwks.get('keys'):
            if jwk.get('kid') == kid:
                return jwk
        raise self.InvalidAuthorizationToken('kid not recognized')

    def get_kid(self, token):
        headers = jwt.get_unverified_header(token)
        if not headers:
            raise self.InvalidAuthorizationToken('missing headers')
        try:
            return headers['kid']
        except KeyError:
            raise self.InvalidAuthorizationToken('missing kid')

    def get_public_key(self, token):
        return self.rsa_pem_from_jwk(self.get_jwk(self.get_kid(token)))

    def validate_jwt(self, jwt_to_validate) -> dict:
        '''Tries to decode a JWT. If the JWT cannot be verified or decoded, this method will return None'''
        try:
            public_key = self.get_public_key(jwt_to_validate)

            decoded = jwt.decode(jwt_to_validate,
                                 public_key,
                                 verify=True,
                                 algorithms=['RS256'],
                                 audience=self.valid_audiences,
                                 issuer=self.issuer)

            # do what you wish with decoded token:
            # if we get here, the JWT is validated
            return decoded
        except Exception as e:
            print(f'Exception validating token; {e}')
            return None

