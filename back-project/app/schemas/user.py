from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRead(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead

class RefreshTokenRequest(BaseModel):
    refresh_token: str
    device_id: Optional[str] = None

class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None  # New refresh token (optional rotation)
    token_type: str = "bearer" 