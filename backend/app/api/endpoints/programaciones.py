"""
Router de Programaciones
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from ...core.database import get_session
from ...models.programacion import Programacion, EstadoProgramacion
from ...models.solicitud import Solicitud, EstadoSolicitud
from ...models.user import User, UserRole
from ...models.documento import Documento
from ...schemas.programacion import (
    ProgramacionCreate,
    ProgramacionUpdate,
    ProgramacionResponse,
    DocumentoCreate,
    DocumentoResponse
)
from ...api.deps.auth import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[ProgramacionResponse])
async def list_programaciones(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
):
    """Lista programaciones según el rol del usuario"""
    statement = select(Programacion)

    # Los peritos solo ven sus propias programaciones
    if current_user.role == UserRole.PERITO:
        statement = statement.where(Programacion.perito_id == current_user.id)

    statement = statement.offset(skip).limit(limit).order_by(Programacion.fecha_hora)
    programaciones = session.exec(statement).all()
    return programaciones


@router.get("/mis-citas", response_model=List[ProgramacionResponse])
async def get_mis_citas(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Obtiene las citas del perito actual"""
    if current_user.role not in [UserRole.PERITO, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only peritos can view their appointments"
        )

    statement = select(Programacion).where(
        Programacion.perito_id == current_user.id
    ).order_by(Programacion.fecha_hora)

    programaciones = session.exec(statement).all()
    return programaciones


@router.post("/", response_model=ProgramacionResponse, status_code=status.HTTP_201_CREATED)
async def create_programacion(
    programacion_data: ProgramacionCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Crea una nueva programación (solo asistente administrativo)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.ASISTENTE_ADMINISTRATIVO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrative assistants can schedule appointments"
        )

    # Verificar que la solicitud existe y está pendiente
    solicitud = session.get(Solicitud, programacion_data.solicitud_id)
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud not found")

    if solicitud.estado != EstadoSolicitud.PENDIENTE:
        raise HTTPException(
            status_code=400,
            detail="Solicitud must be in pending state"
        )

    # Crear la programación
    programacion = Programacion(
        **programacion_data.model_dump(),
        programador_id=current_user.id
    )
    session.add(programacion)

    # Actualizar el estado de la solicitud
    solicitud.estado = EstadoSolicitud.PROGRAMADA
    solicitud.updated_at = datetime.utcnow()
    session.add(solicitud)

    session.commit()
    session.refresh(programacion)
    return programacion


@router.put("/{programacion_id}", response_model=ProgramacionResponse)
async def update_programacion(
    programacion_id: int,
    programacion_data: ProgramacionUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Actualiza una programación"""
    programacion = session.get(Programacion, programacion_id)
    if not programacion:
        raise HTTPException(status_code=404, detail="Programacion not found")

    # Los peritos solo pueden actualizar estado y notas de sus propias citas
    if current_user.role == UserRole.PERITO:
        if programacion.perito_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        # Solo pueden actualizar estado y notas
        allowed_fields = {"estado", "notas"}
        update_data = {k: v for k, v in programacion_data.model_dump(exclude_unset=True).items()
                       if k in allowed_fields}
    else:
        update_data = programacion_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(programacion, key, value)

    programacion.updated_at = datetime.utcnow()
    session.add(programacion)
    session.commit()
    session.refresh(programacion)
    return programacion


@router.post("/{programacion_id}/documentos", response_model=DocumentoResponse)
async def registrar_documento(
    programacion_id: int,
    documento_data: DocumentoCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Registra un documento (dictamen) para una programación"""
    programacion = session.get(Programacion, programacion_id)
    if not programacion:
        raise HTTPException(status_code=404, detail="Programacion not found")

    # Solo el perito asignado puede registrar documentos
    if current_user.role == UserRole.PERITO and programacion.perito_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    documento = Documento(
        **documento_data.model_dump(),
        registrado_por_id=current_user.id
    )
    session.add(documento)
    session.commit()
    session.refresh(documento)
    return documento
