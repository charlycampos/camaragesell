"""
Modelo de Sala (Cámara Gesell)
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class Sala(SQLModel, table=True):
    """Modelo de Sala / Cámara Gesell"""
    __tablename__ = "salas"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, index=True)
    capacidad: Optional[int] = Field(default=None)
    equipamiento: Optional[str] = Field(default=None, max_length=500)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Foreign Keys
    sede_id: int = Field(foreign_key="sedes.id")

    # Relaciones
    sede: Optional["Sede"] = Relationship(back_populates="salas")
    programaciones: List["Programacion"] = Relationship(back_populates="sala")
