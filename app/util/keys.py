from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes

# Generate a new private/public key pair with 2048 bits
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048
)
public_key = private_key.public_key()

# Serialize the keys to PEM format
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
)
public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
)

# Print the keys in PEM format
if __name__ == '__main__':
    from app.main import get_project_root
    root_dir = get_project_root()
    with open(f'{root_dir}/private.pem', 'w') as f:
        f.write(private_pem.decode())
    with open(f'{root_dir}/public.pem', 'w') as f:
        f.write(public_pem.decode())
