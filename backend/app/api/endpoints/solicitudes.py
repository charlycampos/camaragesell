"""
Router de Solicitudes
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone

from ...core.database import get_session
from ...core.sorting import sort_validator, SortValidator
from ...models.solicitud import Solicitud, EstadoSolicitud
from ...models.user import User, UserRole
from ...models.despacho_fiscal import DespachoFiscal
from ...models.distrito_fiscal import DistritoFiscal
from ...models.programacion import Programacion
from ...schemas.solicitud import SolicitudCreate, SolicitudUpdate, SolicitudResponse
from ...schemas.enriched import (
    SolicitudEnriched,
    DespachoFiscalSimple,
    UsuarioSimple
)
from ...api.deps.auth import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[SolicitudResponse])
async def list_solicitudes(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
):
    """Lista solicitudes según el rol del usuario (filtradas por distrito si no es admin)"""
    statement = select(Solicitud)

    # Los fiscales solo ven sus propias solicitudes
    if current_user.role == UserRole.FISCAL:
        statement = statement.where(Solicitud.solicitante_id == current_user.id)

    # Si no es admin, filtrar por distrito fiscal a través del DespachoFiscal
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        # Join con DespachoFiscal para filtrar por distrito
        statement = statement.join(DespachoFiscal).where(
            DespachoFiscal.distrito_fiscal_id == current_user.distrito_fiscal_id
        )

    statement = statement.offset(skip).limit(limit)
    solicitudes = session.exec(statement).all()
    return solicitudes


@router.get("/pendientes", response_model=List[SolicitudResponse])
async def list_solicitudes_pendientes(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Lista solicitudes pendientes (para asistente administrativo, filtradas por distrito)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.ASISTENTE_ADMINISTRATIVO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view pending requests"
        )

    statement = select(Solicitud).where(Solicitud.estado == EstadoSolicitud.PENDIENTE)

    # Si no es admin, filtrar por distrito fiscal
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        statement = statement.join(DespachoFiscal).where(
            DespachoFiscal.distrito_fiscal_id == current_user.distrito_fiscal_id
        )

    solicitudes = session.exec(statement).all()
    return solicitudes


@router.get("/{solicitud_id}", response_model=SolicitudResponse)
async def get_solicitud(
    solicitud_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Obtiene una solicitud por ID"""
    solicitud = session.get(Solicitud, solicitud_id)
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud not found")

    # Los fiscales solo pueden ver sus propias solicitudes
    if current_user.role == UserRole.FISCAL and solicitud.solicitante_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return solicitud


@router.post("/", response_model=SolicitudResponse, status_code=status.HTTP_201_CREATED)
async def create_solicitud(
    solicitud_data: SolicitudCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Crea una nueva solicitud"""
    # Solo fiscales pueden crear solicitudes
    if current_user.role not in [UserRole.ADMIN, UserRole.FISCAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only fiscales can create requests"
        )

    solicitud = Solicitud(
        **solicitud_data.model_dump(),
        solicitante_id=current_user.id
    )
    session.add(solicitud)
    session.commit()
    session.refresh(solicitud)
    return solicitud


@router.put("/{solicitud_id}", response_model=SolicitudResponse)
async def update_solicitud(
    solicitud_id: int,
    solicitud_data: SolicitudUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Actualiza una solicitud"""
    solicitud = session.get(Solicitud, solicitud_id)
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud not found")

    # Solo el creador o admin/asistente pueden actualizar
    if (current_user.role == UserRole.FISCAL and
        solicitud.solicitante_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = solicitud_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(solicitud, key, value)

    solicitud.updated_at = datetime.now(timezone.utc)
    session.add(solicitud)
    session.commit()
    session.refresh(solicitud)
    return solicitud


# ========== ENDPOINTS ENRIQUECIDOS ==========

def build_solicitud_enriched(solicitud: Solicitud, session: Session) -> SolicitudEnriched:
    """
    Construye un objeto SolicitudEnriched con todos los datos relacionados
    """
    # Obtener despacho fiscal
    despacho = session.get(DespachoFiscal, solicitud.despacho_fiscal_id)
    if not despacho:
        raise HTTPException(status_code=404, detail="DespachoFiscal not found")

    # Obtener distrito fiscal (si existe)
    distrito_nombre = None
    if despacho.distrito_fiscal_id:
        distrito = session.get(DistritoFiscal, despacho.distrito_fiscal_id)
        if distrito:
            distrito_nombre = distrito.nombre

    # Obtener solicitante (usuario fiscal)
    solicitante = session.get(User, solicitud.solicitante_id)
    if not solicitante:
        raise HTTPException(status_code=404, detail="Solicitante not found")

    # Verificar si tiene programación
    programacion = session.exec(
        select(Programacion).where(Programacion.solicitud_id == solicitud.id)
    ).first()

    return SolicitudEnriched(
        id=solicitud.id,
        numero_caso=solicitud.numero_caso,
        tipo_diligencia=solicitud.tipo_diligencia,
        nombre_evaluado=solicitud.nombre_evaluado,
        edad_evaluado=solicitud.edad_evaluado,
        observaciones=solicitud.observaciones,
        estado=solicitud.estado,
        fecha_solicitud=solicitud.fecha_solicitud,
        created_at=solicitud.created_at,
        updated_at=solicitud.updated_at,
        despacho_fiscal_id=solicitud.despacho_fiscal_id,
        solicitante_id=solicitud.solicitante_id,
        despacho_fiscal=DespachoFiscalSimple(
            id=despacho.id,
            nombre=despacho.nombre,
            distrito=distrito_nombre,
            fiscal_titular=despacho.fiscal_titular
        ),
        solicitante=UsuarioSimple(
            id=solicitante.id,
            username=solicitante.username,
            email=solicitante.email,
            full_name=solicitante.full_name,
            role=solicitante.role
        ),
        tiene_programacion=programacion is not None,
        programacion_id=programacion.id if programacion else None
    )


@router.get("/enriched", response_model=List[SolicitudEnriched])
async def list_solicitudes_enriched(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
):
    """
    Lista solicitudes con datos enriquecidos (nombres en lugar de IDs)
    Incluye información del despacho fiscal y solicitante (filtradas por distrito)
    """
    statement = select(Solicitud)

    # Los fiscales solo ven sus propias solicitudes
    if current_user.role == UserRole.FISCAL:
        statement = statement.where(Solicitud.solicitante_id == current_user.id)

    # Si no es admin, filtrar por distrito fiscal
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        statement = statement.join(DespachoFiscal).where(
            DespachoFiscal.distrito_fiscal_id == current_user.distrito_fiscal_id
        )

    statement = statement.offset(skip).limit(limit)
    solicitudes = session.exec(statement).all()

    # Construir respuestas enriquecidas
    enriched_list = []
    for solicitud in solicitudes:
        enriched_list.append(build_solicitud_enriched(solicitud, session))

    return enriched_list


@router.get("/enriched/{solicitud_id}", response_model=SolicitudEnriched)
async def get_solicitud_enriched(
    solicitud_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Obtiene una solicitud con datos enriquecidos
    """
    solicitud = session.get(Solicitud, solicitud_id)
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud not found")

    # Los fiscales solo pueden ver sus propias solicitudes
    if current_user.role == UserRole.FISCAL and solicitud.solicitante_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return build_solicitud_enriched(solicitud, session)


@router.get("/enriched/pendientes/list", response_model=List[SolicitudEnriched])
async def list_solicitudes_pendientes_enriched(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Lista solicitudes pendientes con datos enriquecidos
    Solo para asistente administrativo (filtradas por distrito)
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.ASISTENTE_ADMINISTRATIVO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view pending requests"
        )

    statement = select(Solicitud).where(Solicitud.estado == EstadoSolicitud.PENDIENTE)

    # Si no es admin, filtrar por distrito fiscal
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        statement = statement.join(DespachoFiscal).where(
            DespachoFiscal.distrito_fiscal_id == current_user.distrito_fiscal_id
        )

    solicitudes = session.exec(statement).all()

    # Construir respuestas enriquecidas
    enriched_list = []
    for solicitud in solicitudes:
        enriched_list.append(build_solicitud_enriched(solicitud, session))

    return enriched_list


# ========== ENDPOINT DE BÚSQUEDA Y FILTROS AVANZADOS ==========

@router.get("/search/advanced", response_model=dict)
async def search_solicitudes_advanced(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    # Paginación
    page: int = 1,
    page_size: int = 10,
    # Búsqueda
    search: str | None = None,
    # Filtros
    estado: EstadoSolicitud | None = None,
    despacho_fiscal_id: int | None = None,
    tipo_diligencia: str | None = None,
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
    # Ordenamiento
    sort_by: str = "fecha_solicitud",
    sort_order: str = "desc"
):
    """
    Búsqueda avanzada de solicitudes con filtros múltiples, paginación y ordenamiento
    
    Parámetros:
    - page: Número de página (1-indexed)
    - page_size: Cantidad de resultados por página
    - search: Búsqueda en número de caso y nombre evaluado
    - estado: Filtrar por estado
    - despacho_fiscal_id: Filtrar por despacho fiscal
    - tipo_diligencia: Filtrar por tipo de diligencia
    - fecha_desde: Fecha de inicio (YYYY-MM-DD)
    - fecha_hasta: Fecha de fin (YYYY-MM-DD)
    - sort_by: Campo para ordenar
    - sort_order: Orden (asc/desc)
    
    Retorna:
    - items: Lista de solicitudes enriquecidas
    - total: Total de resultados
    - page: Página actual
    - page_size: Tamaño de página
    - total_pages: Total de páginas
    """
    from sqlmodel import or_, and_, func, col
    
    # Construir query base
    statement = select(Solicitud)

    # Control de acceso por rol
    if current_user.role == UserRole.FISCAL:
        statement = statement.where(Solicitud.solicitante_id == current_user.id)

    # FILTRO POR DISTRITO: Si no es admin, solo mostrar solicitudes de su distrito
    if current_user.role != UserRole.ADMIN:
        if current_user.distrito_fiscal_id is None:
            raise HTTPException(
                status_code=403,
                detail="Usuario sin distrito fiscal asignado"
            )
        # Join con DespachoFiscal para filtrar por distrito
        statement = statement.join(DespachoFiscal).where(
            DespachoFiscal.distrito_fiscal_id == current_user.distrito_fiscal_id
        )
    
    # Aplicar búsqueda
    if search:
        search_pattern = f"%{search}%"
        statement = statement.where(
            or_(
                Solicitud.numero_caso.ilike(search_pattern),
                Solicitud.nombre_evaluado.ilike(search_pattern)
            )
        )
    
    # Aplicar filtros
    if estado:
        statement = statement.where(Solicitud.estado == estado)
    
    if despacho_fiscal_id:
        statement = statement.where(Solicitud.despacho_fiscal_id == despacho_fiscal_id)
    
    if tipo_diligencia:
        statement = statement.where(Solicitud.tipo_diligencia.ilike(f"%{tipo_diligencia}%"))
    
    if fecha_desde:
        try:
            fecha_desde_dt = datetime.strptime(fecha_desde, "%Y-%m-%d")
            statement = statement.where(Solicitud.fecha_solicitud >= fecha_desde_dt)
        except ValueError:
            pass
    
    if fecha_hasta:
        try:
            fecha_hasta_dt = datetime.strptime(fecha_hasta, "%Y-%m-%d")
            statement = statement.where(Solicitud.fecha_solicitud <= fecha_hasta_dt)
        except ValueError:
            pass
    
    # Contar total de resultados (antes de paginación)
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # Validar campos de ordenamiento
    sort_by = sort_validator.validate_sort_field(
        sort_by,
        SortValidator.SOLICITUD_SORT_FIELDS,
        "Solicitud"
    )
    sort_order = sort_validator.validate_sort_order(sort_order)

    # Aplicar ordenamiento
    if sort_order == "desc":
        statement = statement.order_by(col(getattr(Solicitud, sort_by)).desc())
    else:
        statement = statement.order_by(col(getattr(Solicitud, sort_by)).asc())
    
    # Aplicar paginación
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    
    # Ejecutar query
    solicitudes = session.exec(statement).all()
    
    # Construir respuestas enriquecidas
    enriched_items = []
    for solicitud in solicitudes:
        enriched_items.append(build_solicitud_enriched(solicitud, session))
    
    # Calcular total de páginas
    total_pages = (total + page_size - 1) // page_size
    
    return {
        "items": enriched_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
