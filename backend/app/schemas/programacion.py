"""
Schemas de Programación
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.programacion import EstadoProgramacion


class ProgramacionBase(BaseModel):
    fecha_hora: datetime
    duracion_minutos: int = 60
    solicitud_id: int
    sala_id: int
    perito_id: int


class ProgramacionCreate(ProgramacionBase):
    pass


class ProgramacionUpdate(BaseModel):
    fecha_hora: Optional[datetime] = None
    duracion_minutos: Optional[int] = None
    estado: Optional[EstadoProgramacion] = None
    notas: Optional[str] = None
    sala_id: Optional[int] = None
    perito_id: Optional[int] = None


class ProgramacionResponse(ProgramacionBase):
    id: int
    estado: EstadoProgramacion
    notas: Optional[str] = None
    programador_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentoCreate(BaseModel):
    numero_dictamen: str
    tipo_documento: str
    fecha_emision: Optional[datetime] = None
    observaciones: Optional[str] = None
    programacion_id: int


class DocumentoResponse(BaseModel):
    id: int
    numero_dictamen: str
    tipo_documento: str
    fecha_emision: datetime
    ruta_archivo: Optional[str] = None
    observaciones: Optional[str] = None
    programacion_id: int
    registrado_por_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
