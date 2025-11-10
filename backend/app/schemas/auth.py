"""
Schemas de Autenticación
"""
from pydantic import BaseModel
from ..models.user import UserRole


class Token(BaseModel):
    """Schema para respuesta de token"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema para datos del token"""
    username: str | None = None
    role: UserRole | None = None


class LoginRequest(BaseModel):
    """Schema para request de login"""
    username: str
    password: str
