"""
Modelo de Documento
"""
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class Documento(SQLModel, table=True):
    """Modelo de Documento (Dictamen, Acta, etc.)"""
    __tablename__ = "documentos"

    id: Optional[int] = Field(default=None, primary_key=True)
    numero_dictamen: str = Field(max_length=50, index=True)
    tipo_documento: str = Field(max_length=50)  # "Dictamen", "Acta", etc.
    fecha_emision: datetime = Field(default_factory=datetime.utcnow)
    ruta_archivo: Optional[str] = Field(default=None, max_length=500)
    observaciones: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Foreign Keys
    programacion_id: int = Field(foreign_key="programaciones.id")
    registrado_por_id: int = Field(foreign_key="users.id")

    # Relaciones
    programacion: Optional["Programacion"] = Relationship(back_populates="documentos")
