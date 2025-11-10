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
from ...models.sala import Sala
from ...models.perito import Perito
from ...models.sede import Sede
from ...models.despacho_fiscal import DespachoFiscal
from ...schemas.programacion import (
    ProgramacionCreate,
    ProgramacionUpdate,
    ProgramacionResponse,
    DocumentoCreate,
    DocumentoResponse
)
from ...schemas.enriched import (
    ProgramacionEnriched,
    SolicitudParaProgramacion,
    SalaSimple,
    PeritoSimple,
    UsuarioSimple
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


# ========== ENDPOINTS ENRIQUECIDOS ==========

def build_programacion_enriched(programacion: Programacion, session: Session) -> ProgramacionEnriched:
    """
    Construye un objeto ProgramacionEnriched con todos los datos relacionados
    """
    # Obtener solicitud
    solicitud = session.get(Solicitud, programacion.solicitud_id)
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud not found")

    # Obtener despacho fiscal de la solicitud
    despacho = session.get(DespachoFiscal, solicitud.despacho_fiscal_id)

    # Obtener sala
    sala = session.get(Sala, programacion.sala_id)
    if not sala:
        raise HTTPException(status_code=404, detail="Sala not found")

    # Obtener sede de la sala
    sede = session.get(Sede, sala.sede_id)

    # Obtener perito
    perito = session.get(Perito, programacion.perito_id)
    if not perito:
        raise HTTPException(status_code=404, detail="Perito not found")

    # Obtener programador (usuario)
    programador = session.get(User, programacion.programador_id)
    if not programador:
        raise HTTPException(status_code=404, detail="Programador not found")

    # Calcular horas
    hora_inicio = programacion.fecha_hora.strftime("%H:%M")
    duracion_horas = programacion.duracion_minutos / 60
    # Calcular hora fin
    from datetime import timedelta
    fecha_fin = programacion.fecha_hora + timedelta(minutes=programacion.duracion_minutos)
    hora_fin = fecha_fin.strftime("%H:%M")

    return ProgramacionEnriched(
        id=programacion.id,
        fecha_hora=programacion.fecha_hora,
        duracion_minutos=programacion.duracion_minutos,
        estado=programacion.estado,
        notas=programacion.notas,
        created_at=programacion.created_at,
        updated_at=programacion.updated_at,
        solicitud_id=programacion.solicitud_id,
        sala_id=programacion.sala_id,
        perito_id=programacion.perito_id,
        programador_id=programacion.programador_id,
        solicitud=SolicitudParaProgramacion(
            id=solicitud.id,
            numero_caso=solicitud.numero_caso,
            tipo_diligencia=solicitud.tipo_diligencia,
            nombre_evaluado=solicitud.nombre_evaluado,
            edad_evaluado=solicitud.edad_evaluado,
            despacho_fiscal_nombre=despacho.nombre if despacho else "N/A"
        ),
        sala=SalaSimple(
            id=sala.id,
            nombre=sala.nombre,
            sede_nombre=sede.nombre if sede else "N/A",
            capacidad=sala.capacidad,
            equipamiento=sala.equipamiento
        ),
        perito=PeritoSimple(
            id=perito.id,
            nombres=perito.nombres,
            apellidos=perito.apellidos,
            nombre_completo=perito.nombre_completo,
            especialidad=perito.especialidad,
            numero_colegiatura=perito.colegiatura,
            telefono=perito.telefono,
            email=perito.email
        ),
        programador=UsuarioSimple(
            id=programador.id,
            username=programador.username,
            email=programador.email,
            full_name=programador.full_name,
            role=programador.role
        ),
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
        duracion_horas=duracion_horas
    )


@router.get("/enriched", response_model=List[ProgramacionEnriched])
async def list_programaciones_enriched(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
):
    """
    Lista programaciones con datos enriquecidos (nombres en lugar de IDs)
    Incluye información completa de sala, perito, solicitud, etc.
    """
    statement = select(Programacion)

    # Los peritos solo ven sus propias programaciones
    if current_user.role == UserRole.PERITO:
        statement = statement.where(Programacion.perito_id == current_user.id)

    statement = statement.offset(skip).limit(limit).order_by(Programacion.fecha_hora)
    programaciones = session.exec(statement).all()

    # Construir respuestas enriquecidas
    enriched_list = []
    for programacion in programaciones:
        enriched_list.append(build_programacion_enriched(programacion, session))

    return enriched_list


@router.get("/enriched/{programacion_id}", response_model=ProgramacionEnriched)
async def get_programacion_enriched(
    programacion_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Obtiene una programación con datos enriquecidos
    """
    programacion = session.get(Programacion, programacion_id)
    if not programacion:
        raise HTTPException(status_code=404, detail="Programacion not found")

    # Los peritos solo pueden ver sus propias programaciones
    if current_user.role == UserRole.PERITO and programacion.perito_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return build_programacion_enriched(programacion, session)


@router.get("/enriched/mis-citas/list", response_model=List[ProgramacionEnriched])
async def get_mis_citas_enriched(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Obtiene las citas del perito actual con datos enriquecidos
    """
    if current_user.role not in [UserRole.PERITO, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only peritos can view their appointments"
        )

    statement = select(Programacion).where(
        Programacion.perito_id == current_user.id
    ).order_by(Programacion.fecha_hora)

    programaciones = session.exec(statement).all()

    # Construir respuestas enriquecidas
    enriched_list = []
    for programacion in programaciones:
        enriched_list.append(build_programacion_enriched(programacion, session))

    return enriched_list
