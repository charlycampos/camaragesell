"""
Router de Distritos Fiscales
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, or_, and_, func, col
from datetime import datetime, timezone

from ...core.database import get_session
from ...models.distrito_fiscal import DistritoFiscal
from ...models.user import User, UserRole
from ...schemas.common import DistritoFiscalCreate, DistritoFiscalUpdate, DistritoFiscalResponse
from ...api.deps.auth import get_current_active_user, RoleChecker

router = APIRouter()

require_admin = RoleChecker([UserRole.ADMIN])


@router.get("/", response_model=List[DistritoFiscalResponse])
async def list_distritos_fiscales(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None
):
    """Lista todos los distritos fiscales"""
    statement = select(DistritoFiscal)

    # Filtrar por estado si se proporciona
    if is_active is not None:
        statement = statement.where(DistritoFiscal.is_active == is_active)

    statement = statement.offset(skip).limit(limit)
    distritos = session.exec(statement).all()
    return distritos


@router.get("/{distrito_id}", response_model=DistritoFiscalResponse)
async def get_distrito_fiscal(
    distrito_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Obtiene un distrito fiscal por ID"""
    distrito = session.get(DistritoFiscal, distrito_id)
    if not distrito:
        raise HTTPException(status_code=404, detail="Distrito Fiscal not found")
    return distrito


@router.post("/", response_model=DistritoFiscalResponse, status_code=status.HTTP_201_CREATED)
async def create_distrito_fiscal(
    distrito_data: DistritoFiscalCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Crea un nuevo distrito fiscal (solo admin)"""
    # Verificar que el código no esté duplicado
    existing = session.exec(
        select(DistritoFiscal).where(DistritoFiscal.codigo == distrito_data.codigo)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un distrito fiscal con el código '{distrito_data.codigo}'"
        )

    # Verificar que el nombre no esté duplicado
    existing = session.exec(
        select(DistritoFiscal).where(DistritoFiscal.nombre == distrito_data.nombre)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un distrito fiscal con el nombre '{distrito_data.nombre}'"
        )

    distrito = DistritoFiscal(**distrito_data.model_dump())
    session.add(distrito)
    session.commit()
    session.refresh(distrito)
    return distrito


@router.put("/{distrito_id}", response_model=DistritoFiscalResponse)
async def update_distrito_fiscal(
    distrito_id: int,
    distrito_data: DistritoFiscalUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Actualiza un distrito fiscal (solo admin)"""
    distrito = session.get(DistritoFiscal, distrito_id)
    if not distrito:
        raise HTTPException(status_code=404, detail="Distrito Fiscal not found")

    update_data = distrito_data.model_dump(exclude_unset=True)

    # Verificar duplicados si se está actualizando el código
    if "codigo" in update_data and update_data["codigo"] != distrito.codigo:
        existing = session.exec(
            select(DistritoFiscal).where(
                and_(
                    DistritoFiscal.codigo == update_data["codigo"],
                    DistritoFiscal.id != distrito_id
                )
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un distrito fiscal con el código '{update_data['codigo']}'"
            )

    # Verificar duplicados si se está actualizando el nombre
    if "nombre" in update_data and update_data["nombre"] != distrito.nombre:
        existing = session.exec(
            select(DistritoFiscal).where(
                and_(
                    DistritoFiscal.nombre == update_data["nombre"],
                    DistritoFiscal.id != distrito_id
                )
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un distrito fiscal con el nombre '{update_data['nombre']}'"
            )

    for key, value in update_data.items():
        setattr(distrito, key, value)

    distrito.updated_at = datetime.now(timezone.utc)
    session.add(distrito)
    session.commit()
    session.refresh(distrito)
    return distrito


@router.delete("/{distrito_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_distrito_fiscal(
    distrito_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Elimina un distrito fiscal (solo admin)"""
    distrito = session.get(DistritoFiscal, distrito_id)
    if not distrito:
        raise HTTPException(status_code=404, detail="Distrito Fiscal not found")

    # Verificar si tiene recursos asociados
    from ...models.sede import Sede
    from ...models.perito import Perito
    from ...models.despacho_fiscal import DespachoFiscal

    sedes = session.exec(select(Sede).where(Sede.distrito_fiscal_id == distrito_id)).first()
    if sedes:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el distrito fiscal porque tiene sedes asociadas"
        )

    peritos = session.exec(select(Perito).where(Perito.distrito_fiscal_id == distrito_id)).first()
    if peritos:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el distrito fiscal porque tiene peritos asociados"
        )

    despachos = session.exec(
        select(DespachoFiscal).where(DespachoFiscal.distrito_fiscal_id == distrito_id)
    ).first()
    if despachos:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el distrito fiscal porque tiene despachos fiscales asociados"
        )

    usuarios = session.exec(select(User).where(User.distrito_fiscal_id == distrito_id)).first()
    if usuarios:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el distrito fiscal porque tiene usuarios asociados"
        )

    session.delete(distrito)
    session.commit()
    return None


@router.get("/search/advanced", response_model=dict)
async def search_distritos_fiscales_advanced(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    # Paginación
    page: int = 1,
    page_size: int = 10,
    # Búsqueda
    search: str | None = None,
    # Filtros
    is_active: bool | None = None,
    region: str | None = None,
    provincia: str | None = None,
    # Ordenamiento
    sort_by: str = "nombre",
    sort_order: str = "asc"
):
    """
    Búsqueda avanzada de distritos fiscales con filtros múltiples, paginación y ordenamiento
    """
    # Construir query base
    statement = select(DistritoFiscal)

    # Aplicar búsqueda
    if search:
        search_pattern = f"%{search}%"
        statement = statement.where(
            or_(
                DistritoFiscal.nombre.ilike(search_pattern),
                DistritoFiscal.codigo.ilike(search_pattern),
                DistritoFiscal.region.ilike(search_pattern),
                DistritoFiscal.provincia.ilike(search_pattern),
                DistritoFiscal.direccion.ilike(search_pattern)
            )
        )

    # Aplicar filtros
    if is_active is not None:
        statement = statement.where(DistritoFiscal.is_active == is_active)

    if region:
        statement = statement.where(DistritoFiscal.region.ilike(f"%{region}%"))

    if provincia:
        statement = statement.where(DistritoFiscal.provincia.ilike(f"%{provincia}%"))

    # Contar total de resultados (antes de paginación)
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # Aplicar ordenamiento
    if sort_order.lower() == "desc":
        statement = statement.order_by(col(getattr(DistritoFiscal, sort_by)).desc())
    else:
        statement = statement.order_by(col(getattr(DistritoFiscal, sort_by)).asc())

    # Aplicar paginación
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    # Ejecutar query
    distritos = session.exec(statement).all()

    # Calcular total de páginas
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": distritos,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
