"""
Modelo de Usuario
"""
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from enum import Enum


class UserRole(str, Enum):
    """Roles de usuario en el sistema"""
    ADMIN = "admin"
    ASISTENTE_ADMINISTRATIVO = "asistente_administrativo"
    PERITO = "perito"
    FISCAL = "fiscal"


class User(SQLModel, table=True):
    """Modelo de Usuario"""
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, max_length=50)
    email: str = Field(unique=True, index=True, max_length=100)
    hashed_password: str
    full_name: str = Field(max_length=100)
    role: UserRole = Field(default=UserRole.FISCAL)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    class Config:
        use_enum_values = True
