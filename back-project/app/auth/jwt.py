import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import jwt

SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key_here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))  # Shorter for security
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 30))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token() -> str:
    """Generate a cryptographically secure random refresh token"""
    return secrets.token_urlsafe(32)

def hash_refresh_token(token: str) -> str:
    """Hash the refresh token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()

def verify_refresh_token_hash(token: str, token_hash: str) -> bool:
    """Verify a refresh token against its hash"""
    return hashlib.sha256(token.encode()).hexdigest() == token_hash

def get_refresh_token_expiry() -> datetime:
    """Get the expiry datetime for a new refresh token"""
    return datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None 