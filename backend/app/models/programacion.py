"""
Modelo de Programación
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum


class EstadoProgramacion(str, Enum):
    """Estados de una programación"""
    PROGRAMADA = "programada"
    REALIZADA = "realizada"
    REPROGRAMADA = "reprogramada"
    CANCELADA = "cancelada"
    NO_ASISTIO = "no_asistio"


class Programacion(SQLModel, table=True):
    """Modelo de Programación de cita"""
    __tablename__ = "programaciones"

    id: Optional[int] = Field(default=None, primary_key=True)
    fecha_hora: datetime
    duracion_minutos: int = Field(default=60)
    estado: EstadoProgramacion = Field(default=EstadoProgramacion.PROGRAMADA)
    notas: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Foreign Keys
    solicitud_id: Optional[int] = Field(default=None, foreign_key="solicitudes.id", nullable=True)
    sala_id: int = Field(foreign_key="salas.id")
    perito_id: int = Field(foreign_key="peritos.id")
    programador_id: int = Field(foreign_key="users.id")

    # Relaciones
    solicitud: Optional["Solicitud"] = Relationship(back_populates="programacion")
    sala: Optional["Sala"] = Relationship(back_populates="programaciones")
    perito: Optional["Perito"] = Relationship(back_populates="programaciones")
    documentos: List["Documento"] = Relationship(back_populates="programacion")

    class Config:
        use_enum_values = True
