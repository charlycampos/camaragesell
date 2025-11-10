"""
Router de Sedes
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from ...core.database import get_session
from ...models.sede import Sede
from ...models.user import User, UserRole
from ...schemas.common import SedeCreate, SedeUpdate, SedeResponse
from ...api.deps.auth import get_current_active_user, RoleChecker

router = APIRouter()

require_admin = RoleChecker([UserRole.ADMIN])


@router.get("/", response_model=List[SedeResponse])
async def list_sedes(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
):
    """Lista todas las sedes"""
    statement = select(Sede).offset(skip).limit(limit)
    sedes = session.exec(statement).all()
    return sedes


@router.get("/{sede_id}", response_model=SedeResponse)
async def get_sede(
    sede_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Obtiene una sede por ID"""
    sede = session.get(Sede, sede_id)
    if not sede:
        raise HTTPException(status_code=404, detail="Sede not found")
    return sede


@router.post("/", response_model=SedeResponse, status_code=status.HTTP_201_CREATED)
async def create_sede(
    sede_data: SedeCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Crea una nueva sede (solo admin)"""
    sede = Sede(**sede_data.model_dump())
    session.add(sede)
    session.commit()
    session.refresh(sede)
    return sede


@router.put("/{sede_id}", response_model=SedeResponse)
async def update_sede(
    sede_id: int,
    sede_data: SedeUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Actualiza una sede (solo admin)"""
    sede = session.get(Sede, sede_id)
    if not sede:
        raise HTTPException(status_code=404, detail="Sede not found")

    update_data = sede_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sede, key, value)

    sede.updated_at = datetime.utcnow()
    session.add(sede)
    session.commit()
    session.refresh(sede)
    return sede


@router.delete("/{sede_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sede(
    sede_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Elimina una sede (solo admin)"""
    sede = session.get(Sede, sede_id)
    if not sede:
        raise HTTPException(status_code=404, detail="Sede not found")

    session.delete(sede)
    session.commit()
    return None
