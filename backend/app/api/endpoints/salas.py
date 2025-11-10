"""
Router de Salas
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from ...core.database import get_session
from ...models.sala import Sala
from ...models.user import User, UserRole
from ...schemas.common import SalaCreate, SalaUpdate, SalaResponse
from ...api.deps.auth import get_current_active_user, RoleChecker

router = APIRouter()

require_admin = RoleChecker([UserRole.ADMIN])


@router.get("/", response_model=List[SalaResponse])
async def list_salas(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
):
    """Lista todas las salas"""
    statement = select(Sala).offset(skip).limit(limit)
    salas = session.exec(statement).all()
    return salas


@router.get("/{sala_id}", response_model=SalaResponse)
async def get_sala(
    sala_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Obtiene una sala por ID"""
    sala = session.get(Sala, sala_id)
    if not sala:
        raise HTTPException(status_code=404, detail="Sala not found")
    return sala


@router.post("/", response_model=SalaResponse, status_code=status.HTTP_201_CREATED)
async def create_sala(
    sala_data: SalaCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Crea una nueva sala (solo admin)"""
    sala = Sala(**sala_data.model_dump())
    session.add(sala)
    session.commit()
    session.refresh(sala)
    return sala


@router.put("/{sala_id}", response_model=SalaResponse)
async def update_sala(
    sala_id: int,
    sala_data: SalaUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Actualiza una sala (solo admin)"""
    sala = session.get(Sala, sala_id)
    if not sala:
        raise HTTPException(status_code=404, detail="Sala not found")

    update_data = sala_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(sala, key, value)

    sala.updated_at = datetime.utcnow()
    session.add(sala)
    session.commit()
    session.refresh(sala)
    return sala


@router.delete("/{sala_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sala(
    sala_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Elimina una sala (solo admin)"""
    sala = session.get(Sala, sala_id)
    if not sala:
        raise HTTPException(status_code=404, detail="Sala not found")

    session.delete(sala)
    session.commit()
    return None


@router.get("/search/advanced", response_model=dict)
async def search_salas_advanced(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    # Paginación
    page: int = 1,
    page_size: int = 10,
    # Búsqueda
    search: str | None = None,
    # Filtros
    sede_id: int | None = None,
    is_active: bool | None = None,
    # Ordenamiento
    sort_by: str = "nombre",
    sort_order: str = "asc"
):
    """
    Búsqueda avanzada de salas con filtros múltiples, paginación y ordenamiento
    """
    from sqlmodel import or_, and_, func, col

    # Construir query base
    statement = select(Sala)

    # Aplicar búsqueda
    if search:
        search_pattern = f"%{search}%"
        statement = statement.where(
            or_(
                Sala.nombre.ilike(search_pattern),
                Sala.equipamiento.ilike(search_pattern)
            )
        )

    # Aplicar filtros
    if sede_id:
        statement = statement.where(Sala.sede_id == sede_id)

    if is_active is not None:
        statement = statement.where(Sala.is_active == is_active)

    # Contar total de resultados (antes de paginación)
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # Aplicar ordenamiento
    if sort_order.lower() == "desc":
        statement = statement.order_by(col(getattr(Sala, sort_by)).desc())
    else:
        statement = statement.order_by(col(getattr(Sala, sort_by)).asc())

    # Aplicar paginación
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    # Ejecutar query
    salas = session.exec(statement).all()

    # Calcular total de páginas
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": salas,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
