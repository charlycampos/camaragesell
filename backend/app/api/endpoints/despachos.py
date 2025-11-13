"""
Router de Despachos Fiscales
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone

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
    """Lista todos los despachos fiscales (filtrados por distrito si no es admin)"""
    statement = select(DespachoFiscal)

    # Si no es admin, solo mostrar despachos de su distrito
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        statement = statement.where(DespachoFiscal.distrito_fiscal_id == current_user.distrito_fiscal_id)

    statement = statement.offset(skip).limit(limit)
    despachos = session.exec(statement).all()
    return despachos


@router.get("/{despacho_id}", response_model=DespachoFiscalResponse)
async def get_despacho(
    despacho_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Obtiene un despacho fiscal por ID (validando acceso por distrito)"""
    despacho = session.get(DespachoFiscal, despacho_id)
    if not despacho:
        raise HTTPException(status_code=404, detail="Despacho Fiscal not found")

    # Si no es admin, validar que el despacho pertenezca a su distrito
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        if despacho.distrito_fiscal_id != current_user.distrito_fiscal_id:
            raise HTTPException(
                status_code=403,
                detail="No tiene permiso para acceder a este despacho fiscal"
            )

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

    despacho.updated_at = datetime.now(timezone.utc)
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


@router.get("/search/advanced", response_model=dict)
async def search_despachos_advanced(
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
    Búsqueda avanzada de despachos fiscales con filtros múltiples, paginación y ordenamiento
    (filtrados por distrito si no es admin)
    """
    from sqlmodel import or_, and_, func, col

    # Construir query base
    statement = select(DespachoFiscal)

    # FILTRO POR DISTRITO: Si no es admin, solo mostrar despachos de su distrito
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        statement = statement.where(DespachoFiscal.distrito_fiscal_id == current_user.distrito_fiscal_id)

    # Aplicar búsqueda
    if search:
        search_pattern = f"%{search}%"
        statement = statement.where(
            or_(
                DespachoFiscal.nombre.ilike(search_pattern),
                DespachoFiscal.fiscal_titular.ilike(search_pattern),
                DespachoFiscal.direccion.ilike(search_pattern)
            )
        )

    # Aplicar filtros
    if is_active is not None:
        statement = statement.where(DespachoFiscal.is_active == is_active)

    # Contar total de resultados (antes de paginación)
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # Aplicar ordenamiento
    if sort_order.lower() == "desc":
        statement = statement.order_by(col(getattr(DespachoFiscal, sort_by)).desc())
    else:
        statement = statement.order_by(col(getattr(DespachoFiscal, sort_by)).asc())

    # Aplicar paginación
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    # Ejecutar query
    despachos = session.exec(statement).all()

    # Calcular total de páginas
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": despachos,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
