"""
Modelo de Sede
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class Sede(SQLModel, table=True):
    """Modelo de Sede del Instituto de Medicina Legal"""
    __tablename__ = "sedes"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100, unique=True, index=True)
    direccion: Optional[str] = Field(default=None, max_length=200)
    telefono: Optional[str] = Field(default=None, max_length=20)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Relaciones
    salas: List["Sala"] = Relationship(back_populates="sede")
