"""
Schemas Enriquecidos con Relaciones
Estos schemas incluyen datos relacionados para mostrar información rica en el frontend
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.solicitud import EstadoSolicitud
from ..models.programacion import EstadoProgramacion
from ..models.user import UserRole


# ========== Schemas Simplificados para Relaciones ==========

class DespachoFiscalSimple(BaseModel):
    """Datos simplificados de DespachoFiscal para incluir en otras entidades"""
    id: int
    nombre: str
    distrito: Optional[str] = None
    fiscal_titular: Optional[str] = None

    class Config:
        from_attributes = True


class UsuarioSimple(BaseModel):
    """Datos simplificados de Usuario para incluir en otras entidades"""
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: UserRole

    class Config:
        from_attributes = True


class SalaSimple(BaseModel):
    """Datos simplificados de Sala para incluir en otras entidades"""
    id: int
    nombre: str
    sede_nombre: str  # Nombre de la sede (join)
    capacidad: Optional[int] = None
    equipamiento: Optional[str] = None

    class Config:
        from_attributes = True


class PeritoSimple(BaseModel):
    """Datos simplificados de Perito para incluir en otras entidades"""
    id: int
    nombres: str
    apellidos: str
    nombre_completo: str  # Computed field
    especialidad: Optional[str] = None
    numero_colegiatura: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


class SedeSimple(BaseModel):
    """Datos simplificados de Sede"""
    id: int
    nombre: str
    direccion: Optional[str] = None
    ciudad: Optional[str] = None

    class Config:
        from_attributes = True


# ========== Solicitud Enriquecida ==========

class SolicitudEnriched(BaseModel):
    """
    Solicitud con datos enriquecidos de relaciones
    Muestra nombres en lugar de IDs
    """
    id: int
    numero_caso: str
    tipo_diligencia: str
    nombre_evaluado: str
    edad_evaluado: Optional[int] = None
    observaciones: Optional[str] = None
    estado: EstadoSolicitud
    fecha_solicitud: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    # IDs originales
    despacho_fiscal_id: int
    solicitante_id: int

    # Datos enriquecidos
    despacho_fiscal: DespachoFiscalSimple
    solicitante: UsuarioSimple

    # Indicadores
    tiene_programacion: bool = False
    programacion_id: Optional[int] = None

    class Config:
        from_attributes = True


# ========== Programación Enriquecida ==========

class SolicitudParaProgramacion(BaseModel):
    """Datos de solicitud para mostrar en programación"""
    id: int
    numero_caso: str
    tipo_diligencia: str
    nombre_evaluado: str
    edad_evaluado: Optional[int] = None
    despacho_fiscal_nombre: str

    class Config:
        from_attributes = True


class ProgramacionEnriched(BaseModel):
    """
    Programación con datos enriquecidos de todas las relaciones
    Muestra nombres completos en lugar de IDs
    """
    id: int
    fecha_hora: datetime
    duracion_minutos: int
    estado: EstadoProgramacion
    notas: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # IDs originales
    solicitud_id: int
    sala_id: int
    perito_id: int
    programador_id: int

    # Datos enriquecidos
    solicitud: SolicitudParaProgramacion
    sala: SalaSimple
    perito: PeritoSimple
    programador: UsuarioSimple

    # Campos calculados
    hora_inicio: str  # HH:MM format
    hora_fin: str  # HH:MM format
    duracion_horas: float  # Duración en horas decimales

    class Config:
        from_attributes = True


# ========== Documento Enriquecido ==========

class DocumentoEnriched(BaseModel):
    """
    Documento con datos enriquecidos
    """
    id: int
    numero_dictamen: str
    tipo_documento: str
    fecha_emision: datetime
    ruta_archivo: Optional[str] = None
    observaciones: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    # IDs originales
    programacion_id: int
    registrado_por_id: int

    # Datos enriquecidos
    registrado_por: UsuarioSimple
    programacion_numero_caso: str  # Para contexto

    class Config:
        from_attributes = True


# ========== Sala Enriquecida ==========

class SalaEnriched(BaseModel):
    """
    Sala con datos de la sede
    """
    id: int
    nombre: str
    capacidad: Optional[int] = None
    equipamiento: Optional[str] = None
    disponible: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    # IDs originales
    sede_id: int

    # Datos enriquecidos
    sede: SedeSimple

    class Config:
        from_attributes = True
