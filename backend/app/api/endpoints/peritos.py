"""
Router de Peritos
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from ...core.database import get_session
from ...models.perito import Perito
from ...models.user import User, UserRole
from ...schemas.common import PeritoCreate, PeritoUpdate, PeritoResponse
from ...api.deps.auth import get_current_active_user, RoleChecker

router = APIRouter()

require_admin = RoleChecker([UserRole.ADMIN])


@router.get("/", response_model=List[PeritoResponse])
async def list_peritos(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
):
    """Lista todos los peritos"""
    statement = select(Perito).offset(skip).limit(limit)
    peritos = session.exec(statement).all()
    return peritos


@router.get("/{perito_id}", response_model=PeritoResponse)
async def get_perito(
    perito_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Obtiene un perito por ID"""
    perito = session.get(Perito, perito_id)
    if not perito:
        raise HTTPException(status_code=404, detail="Perito not found")
    return perito


@router.post("/", response_model=PeritoResponse, status_code=status.HTTP_201_CREATED)
async def create_perito(
    perito_data: PeritoCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Crea un nuevo perito (solo admin)"""
    perito = Perito(**perito_data.model_dump())
    session.add(perito)
    session.commit()
    session.refresh(perito)
    return perito


@router.put("/{perito_id}", response_model=PeritoResponse)
async def update_perito(
    perito_id: int,
    perito_data: PeritoUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Actualiza un perito (solo admin)"""
    perito = session.get(Perito, perito_id)
    if not perito:
        raise HTTPException(status_code=404, detail="Perito not found")

    update_data = perito_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(perito, key, value)

    perito.updated_at = datetime.utcnow()
    session.add(perito)
    session.commit()
    session.refresh(perito)
    return perito


@router.delete("/{perito_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_perito(
    perito_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Elimina un perito (solo admin)"""
    perito = session.get(Perito, perito_id)
    if not perito:
        raise HTTPException(status_code=404, detail="Perito not found")

    session.delete(perito)
    session.commit()
    return None
