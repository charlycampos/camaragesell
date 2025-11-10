"""
Modelo de Despacho Fiscal
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class DespachoFiscal(SQLModel, table=True):
    """Modelo de Despacho Fiscal / Fiscalía"""
    __tablename__ = "despachos_fiscales"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=200, unique=True, index=True)
    distrito: Optional[str] = Field(default=None, max_length=100)
    direccion: Optional[str] = Field(default=None, max_length=200)
    telefono: Optional[str] = Field(default=None, max_length=20)
    fiscal_titular: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Relaciones
    solicitudes: List["Solicitud"] = Relationship(back_populates="despacho_fiscal")
