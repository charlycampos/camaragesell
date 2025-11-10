"""
Modelo de Perito (Psicólogo)
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class Perito(SQLModel, table=True):
    """Modelo de Perito/Psicólogo"""
    __tablename__ = "peritos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombres: str = Field(max_length=100)
    apellidos: str = Field(max_length=100)
    especialidad: Optional[str] = Field(default=None, max_length=100)
    colegiatura: Optional[str] = Field(default=None, max_length=50)
    telefono: Optional[str] = Field(default=None, max_length=20)
    email: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Foreign Keys
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")

    # Relaciones
    programaciones: List["Programacion"] = Relationship(back_populates="perito")

    @property
    def nombre_completo(self) -> str:
        """Retorna el nombre completo del perito"""
        return f"{self.nombres} {self.apellidos}"
