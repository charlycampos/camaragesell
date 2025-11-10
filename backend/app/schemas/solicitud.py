"""
Schemas de Solicitud
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.solicitud import EstadoSolicitud


class SolicitudBase(BaseModel):
    numero_caso: str
    tipo_diligencia: str
    nombre_evaluado: str
    edad_evaluado: Optional[int] = None
    observaciones: Optional[str] = None
    despacho_fiscal_id: int


class SolicitudCreate(SolicitudBase):
    pass


class SolicitudUpdate(BaseModel):
    numero_caso: Optional[str] = None
    tipo_diligencia: Optional[str] = None
    nombre_evaluado: Optional[str] = None
    edad_evaluado: Optional[int] = None
    observaciones: Optional[str] = None
    estado: Optional[EstadoSolicitud] = None


class SolicitudResponse(SolicitudBase):
    id: int
    estado: EstadoSolicitud
    fecha_solicitud: datetime
    solicitante_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
