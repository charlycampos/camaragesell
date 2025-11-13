"""
Router de Peritos
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone

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
    """Lista todos los peritos (filtrados por distrito si no es admin)"""
    statement = select(Perito)

    # Si no es admin, solo mostrar peritos de su distrito
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        statement = statement.where(Perito.distrito_fiscal_id == current_user.distrito_fiscal_id)

    statement = statement.offset(skip).limit(limit)
    peritos = session.exec(statement).all()
    return peritos


@router.get("/{perito_id}", response_model=PeritoResponse)
async def get_perito(
    perito_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Obtiene un perito por ID (validando acceso por distrito)"""
    perito = session.get(Perito, perito_id)
    if not perito:
        raise HTTPException(status_code=404, detail="Perito not found")

    # Si no es admin, validar que el perito pertenezca a su distrito
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        if perito.distrito_fiscal_id != current_user.distrito_fiscal_id:
            raise HTTPException(
                status_code=403,
                detail="No tiene permiso para acceder a este perito"
            )

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

    perito.updated_at = datetime.now(timezone.utc)
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


@router.get("/search/advanced", response_model=dict)
async def search_peritos_advanced(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    # Paginación
    page: int = 1,
    page_size: int = 10,
    # Búsqueda
    search: str | None = None,
    # Filtros
    especialidad: str | None = None,
    is_active: bool | None = None,
    # Ordenamiento
    sort_by: str = "apellidos",
    sort_order: str = "asc"
):
    """
    Búsqueda avanzada de peritos con filtros múltiples, paginación y ordenamiento
    (filtrados por distrito si no es admin)
    """
    from sqlmodel import or_, and_, func, col

    # Construir query base
    statement = select(Perito)

    # FILTRO POR DISTRITO: Si no es admin, solo mostrar peritos de su distrito
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        statement = statement.where(Perito.distrito_fiscal_id == current_user.distrito_fiscal_id)

    # Aplicar búsqueda
    if search:
        search_pattern = f"%{search}%"
        statement = statement.where(
            or_(
                Perito.nombres.ilike(search_pattern),
                Perito.apellidos.ilike(search_pattern),
                Perito.especialidad.ilike(search_pattern),
                Perito.colegiatura.ilike(search_pattern),
                Perito.email.ilike(search_pattern)
            )
        )

    # Aplicar filtros
    if especialidad:
        statement = statement.where(Perito.especialidad.ilike(f"%{especialidad}%"))

    if is_active is not None:
        statement = statement.where(Perito.is_active == is_active)

    # Contar total de resultados (antes de paginación)
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # Aplicar ordenamiento
    if sort_order.lower() == "desc":
        statement = statement.order_by(col(getattr(Perito, sort_by)).desc())
    else:
        statement = statement.order_by(col(getattr(Perito, sort_by)).asc())

    # Aplicar paginación
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    # Ejecutar query
    peritos = session.exec(statement).all()

    # Calcular total de páginas
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": peritos,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
