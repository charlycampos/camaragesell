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


@router.get("/search/advanced", response_model=dict)
async def search_sedes_advanced(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    # Paginación
    page: int = 1,
    page_size: int = 10,
    # Búsqueda
    search: str | None = None,
    # Filtros
    is_active: bool | None = None,
    # Ordenamiento
    sort_by: str = "nombre",
    sort_order: str = "asc"
):
    """
    Búsqueda avanzada de sedes con filtros múltiples, paginación y ordenamiento
    """
    from sqlmodel import or_, and_, func, col

    # Construir query base
    statement = select(Sede)

    # Aplicar búsqueda
    if search:
        search_pattern = f"%{search}%"
        statement = statement.where(
            or_(
                Sede.nombre.ilike(search_pattern),
                Sede.direccion.ilike(search_pattern),
                Sede.telefono.ilike(search_pattern)
            )
        )

    # Aplicar filtros
    if is_active is not None:
        statement = statement.where(Sede.is_active == is_active)

    # Contar total de resultados (antes de paginación)
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # Aplicar ordenamiento
    if sort_order.lower() == "desc":
        statement = statement.order_by(col(getattr(Sede, sort_by)).desc())
    else:
        statement = statement.order_by(col(getattr(Sede, sort_by)).asc())

    # Aplicar paginación
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    # Ejecutar query
    sedes = session.exec(statement).all()

    # Calcular total de páginas
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": sedes,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
