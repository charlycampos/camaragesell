"""
Schemas de Usuario
"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from ..models.user import UserRole
import re


class UserBase(BaseModel):
    """Schema base de Usuario"""
    username: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool = True
    distrito_fiscal_id: Optional[int] = None  # Opcional para ADMIN


class UserCreate(UserBase):
    """Schema para crear Usuario"""
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        Valida que la contraseña cumpla con requisitos de seguridad:
        - Mínimo 8 caracteres
        - Al menos una letra mayúscula
        - Al menos una letra minúscula
        - Al menos un número
        - Al menos un carácter especial
        """
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')

        if not re.search(r'[A-Z]', v):
            raise ValueError('La contraseña debe contener al menos una letra mayúscula')

        if not re.search(r'[a-z]', v):
            raise ValueError('La contraseña debe contener al menos una letra minúscula')

        if not re.search(r'\d', v):
            raise ValueError('La contraseña debe contener al menos un número')

        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;~`]', v):
            raise ValueError('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)')

        return v

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        """Valida que el username tenga formato apropiado"""
        if len(v) < 3:
            raise ValueError('El nombre de usuario debe tener al menos 3 caracteres')

        if len(v) > 50:
            raise ValueError('El nombre de usuario no puede exceder 50 caracteres')

        if not re.match(r'^[a-zA-Z0-9_\-\.]+$', v):
            raise ValueError('El nombre de usuario solo puede contener letras, números, guiones, puntos y guiones bajos')

        return v


class UserUpdate(BaseModel):
    """Schema para actualizar Usuario"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    distrito_fiscal_id: Optional[int] = None

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        """Valida la contraseña si se proporciona"""
        if v is None:
            return v

        # Aplicar las mismas validaciones que UserCreate
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')

        if not re.search(r'[A-Z]', v):
            raise ValueError('La contraseña debe contener al menos una letra mayúscula')

        if not re.search(r'[a-z]', v):
            raise ValueError('La contraseña debe contener al menos una letra minúscula')

        if not re.search(r'\d', v):
            raise ValueError('La contraseña debe contener al menos un número')

        if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;~`]', v):
            raise ValueError('La contraseña debe contener al menos un carácter especial (!@#$%^&*...)')

        return v


class UserResponse(UserBase):
    """Schema para respuesta de Usuario"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
