"""
Schemas comunes para múltiples modelos
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Sede Schemas
class SedeBase(BaseModel):
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    is_active: bool = True


class SedeCreate(SedeBase):
    pass


class SedeUpdate(BaseModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    is_active: Optional[bool] = None


class SedeResponse(SedeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Sala Schemas
class SalaBase(BaseModel):
    nombre: str
    capacidad: Optional[int] = None
    equipamiento: Optional[str] = None
    is_active: bool = True
    sede_id: int


class SalaCreate(SalaBase):
    pass


class SalaUpdate(BaseModel):
    nombre: Optional[str] = None
    capacidad: Optional[int] = None
    equipamiento: Optional[str] = None
    is_active: Optional[bool] = None
    sede_id: Optional[int] = None


class SalaResponse(SalaBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Perito Schemas
class PeritoBase(BaseModel):
    nombres: str
    apellidos: str
    especialidad: Optional[str] = None
    colegiatura: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True
    user_id: Optional[int] = None


class PeritoCreate(PeritoBase):
    pass


class PeritoUpdate(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    especialidad: Optional[str] = None
    colegiatura: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    user_id: Optional[int] = None


class PeritoResponse(PeritoBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# DespachoFiscal Schemas
class DespachoFiscalBase(BaseModel):
    nombre: str
    distrito: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    fiscal_titular: Optional[str] = None
    is_active: bool = True


class DespachoFiscalCreate(DespachoFiscalBase):
    pass


class DespachoFiscalUpdate(BaseModel):
    nombre: Optional[str] = None
    distrito: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    fiscal_titular: Optional[str] = None
    is_active: Optional[bool] = None


class DespachoFiscalResponse(DespachoFiscalBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
