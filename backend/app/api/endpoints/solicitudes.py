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
from ...schemas.solicitud import SolicitudCreate, SolicitudUpdate, SolicitudResponse
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
