"""
Router de Solicitudes
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from ...core.database import get_session
from ...models.solicitud import Solicitud, EstadoSolicitud
from ...models.user import User, UserRole
from ...models.despacho_fiscal import DespachoFiscal
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
    """Lista solicitudes según el rol del usuario"""
    statement = select(Solicitud)

    # Los fiscales solo ven sus propias solicitudes
    if current_user.role == UserRole.FISCAL:
        statement = statement.where(Solicitud.solicitante_id == current_user.id)

    statement = statement.offset(skip).limit(limit)
    solicitudes = session.exec(statement).all()
    return solicitudes


@router.get("/pendientes", response_model=List[SolicitudResponse])
async def list_solicitudes_pendientes(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Lista solicitudes pendientes (para asistente administrativo)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.ASISTENTE_ADMINISTRATIVO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view pending requests"
        )

    statement = select(Solicitud).where(Solicitud.estado == EstadoSolicitud.PENDIENTE)
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

    solicitud.updated_at = datetime.utcnow()
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
            distrito=despacho.distrito,
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
    Incluye información del despacho fiscal y solicitante
    """
    statement = select(Solicitud)

    # Los fiscales solo ven sus propias solicitudes
    if current_user.role == UserRole.FISCAL:
        statement = statement.where(Solicitud.solicitante_id == current_user.id)

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
    Solo para asistente administrativo
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.ASISTENTE_ADMINISTRATIVO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view pending requests"
        )

    statement = select(Solicitud).where(Solicitud.estado == EstadoSolicitud.PENDIENTE)
    solicitudes = session.exec(statement).all()

    # Construir respuestas enriquecidas
    enriched_list = []
    for solicitud in solicitudes:
        enriched_list.append(build_solicitud_enriched(solicitud, session))

    return enriched_list
