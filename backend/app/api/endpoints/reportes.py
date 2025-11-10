"""
Router de Reportes
"""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from datetime import datetime, date
import io
import pandas as pd

from ...core.database import get_session
from ...models.programacion import Programacion
from ...models.solicitud import Solicitud
from ...models.user import User, UserRole
from ...api.deps.auth import get_current_active_user, RoleChecker

router = APIRouter()

require_admin_or_asistente = RoleChecker([UserRole.ADMIN, UserRole.ASISTENTE_ADMINISTRATIVO])


@router.get("/programaciones/excel")
async def export_programaciones_excel(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin_or_asistente)],
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
):
    """
    Exporta programaciones a Excel
    """
    statement = select(Programacion)

    if fecha_inicio:
        statement = statement.where(Programacion.fecha_hora >= datetime.combine(fecha_inicio, datetime.min.time()))
    if fecha_fin:
        statement = statement.where(Programacion.fecha_hora <= datetime.combine(fecha_fin, datetime.max.time()))

    programaciones = session.exec(statement).all()

    # Preparar datos para el DataFrame
    data = []
    for prog in programaciones:
        data.append({
            'ID': prog.id,
            'Fecha y Hora': prog.fecha_hora.strftime('%d/%m/%Y %H:%M'),
            'Duración (min)': prog.duracion_minutos,
            'Estado': prog.estado,
            'Sala ID': prog.sala_id,
            'Perito ID': prog.perito_id,
            'Solicitud ID': prog.solicitud_id,
            'Programador ID': prog.programador_id,
            'Notas': prog.notas or '',
            'Fecha Creación': prog.created_at.strftime('%d/%m/%Y %H:%M'),
        })

    # Crear DataFrame
    df = pd.DataFrame(data)

    # Crear archivo Excel en memoria
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Programaciones')

    output.seek(0)

    # Generar nombre de archivo
    fecha_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'reporte_programaciones_{fecha_str}.xlsx'

    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )


@router.get("/solicitudes/excel")
async def export_solicitudes_excel(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin_or_asistente)],
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
):
    """
    Exporta solicitudes a Excel
    """
    statement = select(Solicitud)

    if fecha_inicio:
        statement = statement.where(Solicitud.fecha_solicitud >= datetime.combine(fecha_inicio, datetime.min.time()))
    if fecha_fin:
        statement = statement.where(Solicitud.fecha_solicitud <= datetime.combine(fecha_fin, datetime.max.time()))

    solicitudes = session.exec(statement).all()

    # Preparar datos para el DataFrame
    data = []
    for sol in solicitudes:
        data.append({
            'ID': sol.id,
            'N° Caso': sol.numero_caso,
            'Tipo Diligencia': sol.tipo_diligencia,
            'Evaluado': sol.nombre_evaluado,
            'Edad': sol.edad_evaluado or '',
            'Estado': sol.estado,
            'Despacho Fiscal ID': sol.despacho_fiscal_id,
            'Solicitante ID': sol.solicitante_id,
            'Observaciones': sol.observaciones or '',
            'Fecha Solicitud': sol.fecha_solicitud.strftime('%d/%m/%Y %H:%M'),
        })

    # Crear DataFrame
    df = pd.DataFrame(data)

    # Crear archivo Excel en memoria
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Solicitudes')

    output.seek(0)

    # Generar nombre de archivo
    fecha_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'reporte_solicitudes_{fecha_str}.xlsx'

    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )


@router.get("/estadisticas")
async def get_estadisticas(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin_or_asistente)],
):
    """
    Obtiene estadísticas generales del sistema
    """
    # Contar solicitudes por estado
    solicitudes_total = len(session.exec(select(Solicitud)).all())
    solicitudes_pendientes = len(session.exec(select(Solicitud).where(Solicitud.estado == "pendiente")).all())
    solicitudes_programadas = len(session.exec(select(Solicitud).where(Solicitud.estado == "programada")).all())

    # Contar programaciones por estado
    programaciones_total = len(session.exec(select(Programacion)).all())
    programaciones_programadas = len(session.exec(select(Programacion).where(Programacion.estado == "programada")).all())
    programaciones_realizadas = len(session.exec(select(Programacion).where(Programacion.estado == "realizada")).all())

    return {
        "solicitudes": {
            "total": solicitudes_total,
            "pendientes": solicitudes_pendientes,
            "programadas": solicitudes_programadas,
        },
        "programaciones": {
            "total": programaciones_total,
            "programadas": programaciones_programadas,
            "realizadas": programaciones_realizadas,
        }
    }
