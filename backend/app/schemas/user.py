"""
Schemas de Usuario
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..models.user import UserRole


class UserBase(BaseModel):
    """Schema base de Usuario"""
    username: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool = True


class UserCreate(UserBase):
    """Schema para crear Usuario"""
    password: str


class UserUpdate(BaseModel):
    """Schema para actualizar Usuario"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    """Schema para respuesta de Usuario"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
