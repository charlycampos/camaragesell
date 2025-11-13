"""
Modelo de Distrito Fiscal
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class DistritoFiscal(SQLModel, table=True):
    """Modelo de Distrito Fiscal - Agrupa todos los recursos de una zona geográfica"""
    __tablename__ = "distritos_fiscales"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=200, unique=True, index=True)
    codigo: str = Field(max_length=20, unique=True, index=True)  # Ej: "DF-LIMA-NORTE"
    region: Optional[str] = Field(default=None, max_length=100)  # Ej: "Lima", "Arequipa"
    provincia: Optional[str] = Field(default=None, max_length=100)
    direccion: Optional[str] = Field(default=None, max_length=200)
    telefono: Optional[str] = Field(default=None, max_length=20)
    email: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Relaciones
    sedes: List["Sede"] = Relationship(back_populates="distrito_fiscal")
    despachos_fiscales: List["DespachoFiscal"] = Relationship(back_populates="distrito_fiscal")
    peritos: List["Perito"] = Relationship(back_populates="distrito_fiscal")
    usuarios: List["User"] = Relationship(back_populates="distrito_fiscal")
