"""
Router de Programaciones
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timedelta

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
from ...core.validators import ProgramacionValidator

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

    # VALIDAR PROGRAMACIÓN
    validator = ProgramacionValidator(session)
    is_valid, errors = validator.validate_programacion(
        fecha_hora=programacion_data.fecha_hora,
        duracion_minutos=programacion_data.duracion_minutos,
        sala_id=programacion_data.sala_id,
        perito_id=programacion_data.perito_id
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Error de validación",
                "errors": errors
            }
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

        # VALIDAR si se están actualizando campos críticos
        fields_criticos = {'fecha_hora', 'duracion_minutos', 'sala_id', 'perito_id'}
        if any(field in update_data for field in fields_criticos):
            # Obtener valores actuales o nuevos
            nueva_fecha = update_data.get('fecha_hora', programacion.fecha_hora)
            nueva_duracion = update_data.get('duracion_minutos', programacion.duracion_minutos)
            nueva_sala = update_data.get('sala_id', programacion.sala_id)
            nuevo_perito = update_data.get('perito_id', programacion.perito_id)

            # Validar la nueva configuración
            validator = ProgramacionValidator(session)
            is_valid, errors = validator.validate_programacion(
                fecha_hora=nueva_fecha,
                duracion_minutos=nueva_duracion,
                sala_id=nueva_sala,
                perito_id=nuevo_perito,
                programacion_id=programacion_id  # Excluir esta programación de validaciones
            )

            if not is_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "message": "Error de validación",
                        "errors": errors
                    }
                )

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

# ========== ENDPOINT DE VALIDACIÓN ==========

from pydantic import BaseModel as PydanticBaseModel

class ValidacionRequest(PydanticBaseModel):
    """Request para validar una programación antes de crearla"""
    fecha_hora: datetime
    duracion_minutos: int
    sala_id: int
    perito_id: int
    programacion_id: Optional[int] = None  # Para excluir en caso de edición


class ValidacionResponse(PydanticBaseModel):
    """Response de validación"""
    is_valid: bool
    errors: List[str]
    warnings: List[str] = []


@router.post("/validar", response_model=ValidacionResponse)
async def validar_programacion(
    validacion_data: ValidacionRequest,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Valida una programación sin crearla
    Útil para validación en tiempo real en el frontend
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.ASISTENTE_ADMINISTRATIVO]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrative assistants can validate appointments"
        )

    validator = ProgramacionValidator(session)
    is_valid, errors = validator.validate_programacion(
        fecha_hora=validacion_data.fecha_hora,
        duracion_minutos=validacion_data.duracion_minutos,
        sala_id=validacion_data.sala_id,
        perito_id=validacion_data.perito_id,
        programacion_id=validacion_data.programacion_id
    )

    return ValidacionResponse(
        is_valid=is_valid,
        errors=errors,
        warnings=[]
    )


# ========== ENDPOINT DE BÚSQUEDA Y FILTROS AVANZADOS ==========

@router.get("/search/advanced", response_model=dict)
async def search_programaciones_advanced(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    # Paginación
    page: int = 1,
    page_size: int = 10,
    # Búsqueda
    search: str | None = None,
    # Filtros
    estado: EstadoProgramacion | None = None,
    perito_id: int | None = None,
    sala_id: int | None = None,
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
    # Ordenamiento
    sort_by: str = "fecha_hora",
    sort_order: str = "desc"
):
    """
    Búsqueda avanzada de programaciones con filtros múltiples, paginación y ordenamiento
    
    Parámetros:
    - page: Número de página (1-indexed)
    - page_size: Cantidad de resultados por página
    - search: Búsqueda en número de caso
    - estado: Filtrar por estado
    - perito_id: Filtrar por perito
    - sala_id: Filtrar por sala
    - fecha_desde: Fecha de inicio (YYYY-MM-DD)
    - fecha_hasta: Fecha de fin (YYYY-MM-DD)
    - sort_by: Campo para ordenar
    - sort_order: Orden (asc/desc)
    
    Retorna:
    - items: Lista de programaciones enriquecidas
    - total: Total de resultados
    - page: Página actual
    - page_size: Tamaño de página
    - total_pages: Total de páginas
    """
    from sqlmodel import or_, and_, func, col
    
    # Construir query base
    statement = select(Programacion)
    
    # Control de acceso por rol
    if current_user.role == UserRole.PERITO:
        # Obtener el perito asociado al usuario
        perito = session.exec(
            select(Perito).where(Perito.user_id == current_user.id)
        ).first()
        if perito:
            statement = statement.where(Programacion.perito_id == perito.id)
    
    # Aplicar búsqueda por número de caso en la solicitud relacionada
    if search:
        search_pattern = f"%{search}%"
        statement = statement.join(Solicitud).where(
            Solicitud.numero_caso.ilike(search_pattern)
        )
    
    # Aplicar filtros
    if estado:
        statement = statement.where(Programacion.estado == estado)
    
    if perito_id:
        statement = statement.where(Programacion.perito_id == perito_id)
    
    if sala_id:
        statement = statement.where(Programacion.sala_id == sala_id)
    
    if fecha_desde:
        try:
            fecha_desde_dt = datetime.strptime(fecha_desde, "%Y-%m-%d")
            statement = statement.where(Programacion.fecha_hora >= fecha_desde_dt)
        except ValueError:
            pass
    
    if fecha_hasta:
        try:
            fecha_hasta_dt = datetime.strptime(fecha_hasta, "%Y-%m-%d") + timedelta(days=1)
            statement = statement.where(Programacion.fecha_hora < fecha_hasta_dt)
        except ValueError:
            pass
    
    # Contar total de resultados (antes de paginación)
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()
    
    # Aplicar ordenamiento
    if sort_order.lower() == "desc":
        statement = statement.order_by(col(getattr(Programacion, sort_by)).desc())
    else:
        statement = statement.order_by(col(getattr(Programacion, sort_by)).asc())
    
    # Aplicar paginación
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    
    # Ejecutar query
    programaciones = session.exec(statement).all()
    
    # Construir respuestas enriquecidas
    enriched_items = []
    for programacion in programaciones:
        enriched_items.append(build_programacion_enriched(programacion, session))
    
    # Calcular total de páginas
    total_pages = (total + page_size - 1) // page_size
    
    return {
        "items": enriched_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
