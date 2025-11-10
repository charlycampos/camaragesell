"""
Router de Despachos Fiscales
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from ...core.database import get_session
from ...models.despacho_fiscal import DespachoFiscal
from ...models.user import User, UserRole
from ...schemas.common import DespachoFiscalCreate, DespachoFiscalUpdate, DespachoFiscalResponse
from ...api.deps.auth import get_current_active_user, RoleChecker

router = APIRouter()

require_admin = RoleChecker([UserRole.ADMIN])


@router.get("/", response_model=List[DespachoFiscalResponse])
async def list_despachos(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
):
    """Lista todos los despachos fiscales"""
    statement = select(DespachoFiscal).offset(skip).limit(limit)
    despachos = session.exec(statement).all()
    return despachos


@router.get("/{despacho_id}", response_model=DespachoFiscalResponse)
async def get_despacho(
    despacho_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Obtiene un despacho fiscal por ID"""
    despacho = session.get(DespachoFiscal, despacho_id)
    if not despacho:
        raise HTTPException(status_code=404, detail="Despacho Fiscal not found")
    return despacho


@router.post("/", response_model=DespachoFiscalResponse, status_code=status.HTTP_201_CREATED)
async def create_despacho(
    despacho_data: DespachoFiscalCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Crea un nuevo despacho fiscal (solo admin)"""
    despacho = DespachoFiscal(**despacho_data.model_dump())
    session.add(despacho)
    session.commit()
    session.refresh(despacho)
    return despacho


@router.put("/{despacho_id}", response_model=DespachoFiscalResponse)
async def update_despacho(
    despacho_id: int,
    despacho_data: DespachoFiscalUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Actualiza un despacho fiscal (solo admin)"""
    despacho = session.get(DespachoFiscal, despacho_id)
    if not despacho:
        raise HTTPException(status_code=404, detail="Despacho Fiscal not found")

    update_data = despacho_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(despacho, key, value)

    despacho.updated_at = datetime.utcnow()
    session.add(despacho)
    session.commit()
    session.refresh(despacho)
    return despacho


@router.delete("/{despacho_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_despacho(
    despacho_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Elimina un despacho fiscal (solo admin)"""
    despacho = session.get(DespachoFiscal, despacho_id)
    if not despacho:
        raise HTTPException(status_code=404, detail="Despacho Fiscal not found")

    session.delete(despacho)
    session.commit()
    return None
