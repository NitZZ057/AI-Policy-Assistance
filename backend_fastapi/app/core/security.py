import hashlib
import secrets

from passlib.context import CryptContext

password_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(plain_password: str, hash_password: str) -> bool:
    return password_context.verify(plain_password, hash_password)

def generate_plain_token() -> str:
    return secrets.token_urlsafe(45)

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
