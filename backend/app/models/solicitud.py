"""
Modelo de Solicitud
"""
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum


class EstadoSolicitud(str, Enum):
    """Estados de una solicitud"""
    PENDIENTE = "pendiente"
    PROGRAMADA = "programada"
    RECHAZADA = "rechazada"
    CANCELADA = "cancelada"


class Solicitud(SQLModel, table=True):
    """Modelo de Solicitud de cita"""
    __tablename__ = "solicitudes"

    id: Optional[int] = Field(default=None, primary_key=True)
    numero_caso: str = Field(max_length=50, index=True)
    tipo_diligencia: str = Field(max_length=100)
    nombre_evaluado: str = Field(max_length=200)
    edad_evaluado: Optional[int] = Field(default=None)
    observaciones: Optional[str] = Field(default=None)
    fecha_solicitud: datetime = Field(default_factory=datetime.utcnow)
    estado: EstadoSolicitud = Field(default=EstadoSolicitud.PENDIENTE)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Foreign Keys
    despacho_fiscal_id: int = Field(foreign_key="despachos_fiscales.id")
    solicitante_id: int = Field(foreign_key="users.id")

    # Relaciones
    despacho_fiscal: Optional["DespachoFiscal"] = Relationship(back_populates="solicitudes")
    programacion: Optional["Programacion"] = Relationship(back_populates="solicitud")

    class Config:
        use_enum_values = True
