"""
Endpoints de Estadísticas y Métricas para Dashboards
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func, and_, or_
from typing import Dict, List, Any
from datetime import datetime, timedelta
from ...core.database import get_session
from ...api.deps.auth import get_current_active_user
from ...models import (
    Solicitud, Programacion, Sala, Perito, DespachoFiscal, User,
    EstadoSolicitud, EstadoProgramacion, UserRole
)

router = APIRouter()


@router.get("/resumen-general", response_model=Dict[str, Any])
async def get_resumen_general(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Resumen general del sistema (para Admin y Asistente)
    """
    # Total de solicitudes
    total_solicitudes = session.exec(select(func.count(Solicitud.id))).one()

    # Solicitudes por estado
    solicitudes_pendientes = session.exec(
        select(func.count(Solicitud.id))
        .where(Solicitud.estado == EstadoSolicitud.PENDIENTE)
    ).one()

    solicitudes_aprobadas = session.exec(
        select(func.count(Solicitud.id))
        .where(Solicitud.estado == EstadoSolicitud.APROBADA)
    ).one()

    solicitudes_rechazadas = session.exec(
        select(func.count(Solicitud.id))
        .where(Solicitud.estado == EstadoSolicitud.RECHAZADA)
    ).one()

    # Total de programaciones
    total_programaciones = session.exec(select(func.count(Programacion.id))).one()

    # Programaciones realizadas este mes
    primer_dia_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    programaciones_mes = session.exec(
        select(func.count(Programacion.id))
        .where(Programacion.fecha_hora >= primer_dia_mes)
    ).one()

    # Programaciones por estado
    programaciones_programadas = session.exec(
        select(func.count(Programacion.id))
        .where(Programacion.estado == EstadoProgramacion.PROGRAMADA)
    ).one()

    programaciones_realizadas = session.exec(
        select(func.count(Programacion.id))
        .where(Programacion.estado == EstadoProgramacion.REALIZADA)
    ).one()

    # Tasa de realización
    tasa_realizacion = 0
    if total_programaciones > 0:
        tasa_realizacion = round((programaciones_realizadas / total_programaciones) * 100, 2)

    # Total de salas y peritos
    total_salas = session.exec(select(func.count(Sala.id)).where(Sala.activa == True)).one()
    total_peritos = session.exec(select(func.count(Perito.id)).where(Perito.activo == True)).one()

    return {
        "total_solicitudes": total_solicitudes,
        "solicitudes_pendientes": solicitudes_pendientes,
        "solicitudes_aprobadas": solicitudes_aprobadas,
        "solicitudes_rechazadas": solicitudes_rechazadas,
        "total_programaciones": total_programaciones,
        "programaciones_mes": programaciones_mes,
        "programaciones_programadas": programaciones_programadas,
        "programaciones_realizadas": programaciones_realizadas,
        "tasa_realizacion": tasa_realizacion,
        "total_salas": total_salas,
        "total_peritos": total_peritos
    }


@router.get("/solicitudes-por-mes", response_model=List[Dict[str, Any]])
async def get_solicitudes_por_mes(
    meses: int = 6,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Solicitudes agrupadas por mes (últimos N meses)
    """
    fecha_inicio = datetime.now() - timedelta(days=30 * meses)

    # Obtener todas las solicitudes desde la fecha de inicio
    statement = select(Solicitud).where(Solicitud.fecha_solicitud >= fecha_inicio)
    solicitudes = session.exec(statement).all()

    # Agrupar por mes
    meses_dict = {}
    for solicitud in solicitudes:
        mes_key = solicitud.fecha_solicitud.strftime("%Y-%m")
        mes_nombre = solicitud.fecha_solicitud.strftime("%b %Y")

        if mes_key not in meses_dict:
            meses_dict[mes_key] = {
                "mes": mes_nombre,
                "total": 0,
                "pendientes": 0,
                "aprobadas": 0,
                "rechazadas": 0
            }

        meses_dict[mes_key]["total"] += 1
        if solicitud.estado == EstadoSolicitud.PENDIENTE:
            meses_dict[mes_key]["pendientes"] += 1
        elif solicitud.estado == EstadoSolicitud.APROBADA:
            meses_dict[mes_key]["aprobadas"] += 1
        elif solicitud.estado == EstadoSolicitud.RECHAZADA:
            meses_dict[mes_key]["rechazadas"] += 1

    # Convertir a lista ordenada
    resultado = sorted(meses_dict.values(), key=lambda x: x["mes"])

    return resultado


@router.get("/programaciones-por-perito", response_model=List[Dict[str, Any]])
async def get_programaciones_por_perito(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Número de programaciones por perito
    """
    # Obtener todos los peritos activos
    peritos = session.exec(select(Perito).where(Perito.activo == True)).all()

    resultado = []
    for perito in peritos:
        # Contar programaciones
        total = session.exec(
            select(func.count(Programacion.id))
            .where(Programacion.perito_id == perito.id)
        ).one()

        realizadas = session.exec(
            select(func.count(Programacion.id))
            .where(
                and_(
                    Programacion.perito_id == perito.id,
                    Programacion.estado == EstadoProgramacion.REALIZADA
                )
            )
        ).one()

        resultado.append({
            "perito": perito.nombre_completo,
            "total": total,
            "realizadas": realizadas
        })

    # Ordenar por total descendente
    resultado.sort(key=lambda x: x["total"], reverse=True)

    return resultado


@router.get("/ocupacion-salas", response_model=List[Dict[str, Any]])
async def get_ocupacion_salas(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Tasa de ocupación de salas
    """
    # Obtener todas las salas activas
    salas = session.exec(select(Sala).where(Sala.activa == True)).all()

    resultado = []
    for sala in salas:
        # Contar programaciones de esta sala
        total = session.exec(
            select(func.count(Programacion.id))
            .where(Programacion.sala_id == sala.id)
        ).one()

        # Contar programaciones realizadas
        realizadas = session.exec(
            select(func.count(Programacion.id))
            .where(
                and_(
                    Programacion.sala_id == sala.id,
                    Programacion.estado == EstadoProgramacion.REALIZADA
                )
            )
        ).one()

        tasa_ocupacion = 0
        if total > 0:
            tasa_ocupacion = round((realizadas / total) * 100, 2)

        resultado.append({
            "sala": sala.nombre,
            "total_programaciones": total,
            "realizadas": realizadas,
            "tasa_ocupacion": tasa_ocupacion
        })

    # Ordenar por total descendente
    resultado.sort(key=lambda x: x["total_programaciones"], reverse=True)

    return resultado


@router.get("/solicitudes-por-despacho", response_model=List[Dict[str, Any]])
async def get_solicitudes_por_despacho(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Número de solicitudes por despacho fiscal
    """
    # Obtener todos los despachos
    despachos = session.exec(select(DespachoFiscal)).all()

    resultado = []
    for despacho in despachos:
        # Contar solicitudes
        total = session.exec(
            select(func.count(Solicitud.id))
            .where(Solicitud.despacho_fiscal_id == despacho.id)
        ).one()

        pendientes = session.exec(
            select(func.count(Solicitud.id))
            .where(
                and_(
                    Solicitud.despacho_fiscal_id == despacho.id,
                    Solicitud.estado == EstadoSolicitud.PENDIENTE
                )
            )
        ).one()

        aprobadas = session.exec(
            select(func.count(Solicitud.id))
            .where(
                and_(
                    Solicitud.despacho_fiscal_id == despacho.id,
                    Solicitud.estado == EstadoSolicitud.APROBADA
                )
            )
        ).one()

        resultado.append({
            "despacho": despacho.nombre,
            "total": total,
            "pendientes": pendientes,
            "aprobadas": aprobadas
        })

    # Ordenar por total descendente
    resultado.sort(key=lambda x: x["total"], reverse=True)

    return resultado[:10]  # Top 10


@router.get("/estadisticas-perito", response_model=Dict[str, Any])
async def get_estadisticas_perito(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Estadísticas del perito actual
    """
    # Obtener el perito asociado al usuario
    perito = session.exec(
        select(Perito).where(Perito.user_id == current_user.id)
    ).first()

    if not perito:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró perito asociado a este usuario"
        )

    # Total de citas
    total_citas = session.exec(
        select(func.count(Programacion.id))
        .where(Programacion.perito_id == perito.id)
    ).one()

    # Citas realizadas
    citas_realizadas = session.exec(
        select(func.count(Programacion.id))
        .where(
            and_(
                Programacion.perito_id == perito.id,
                Programacion.estado == EstadoProgramacion.REALIZADA
            )
        )
    ).one()

    # Citas programadas (próximas)
    citas_proximas = session.exec(
        select(func.count(Programacion.id))
        .where(
            and_(
                Programacion.perito_id == perito.id,
                Programacion.estado == EstadoProgramacion.PROGRAMADA,
                Programacion.fecha_hora >= datetime.now()
            )
        )
    ).one()

    # Citas este mes
    primer_dia_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    citas_mes = session.exec(
        select(func.count(Programacion.id))
        .where(
            and_(
                Programacion.perito_id == perito.id,
                Programacion.fecha_hora >= primer_dia_mes
            )
        )
    ).one()

    # Tasa de realización
    tasa_realizacion = 0
    if total_citas > 0:
        tasa_realizacion = round((citas_realizadas / total_citas) * 100, 2)

    return {
        "total_citas": total_citas,
        "citas_realizadas": citas_realizadas,
        "citas_proximas": citas_proximas,
        "citas_mes": citas_mes,
        "tasa_realizacion": tasa_realizacion
    }


@router.get("/estadisticas-fiscal", response_model=Dict[str, Any])
async def get_estadisticas_fiscal(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """
    Estadísticas del fiscal actual
    """
    # Total de solicitudes del fiscal
    total_solicitudes = session.exec(
        select(func.count(Solicitud.id))
        .where(Solicitud.solicitante_id == current_user.id)
    ).one()

    # Solicitudes por estado
    pendientes = session.exec(
        select(func.count(Solicitud.id))
        .where(
            and_(
                Solicitud.solicitante_id == current_user.id,
                Solicitud.estado == EstadoSolicitud.PENDIENTE
            )
        )
    ).one()

    aprobadas = session.exec(
        select(func.count(Solicitud.id))
        .where(
            and_(
                Solicitud.solicitante_id == current_user.id,
                Solicitud.estado == EstadoSolicitud.APROBADA
            )
        )
    ).one()

    rechazadas = session.exec(
        select(func.count(Solicitud.id))
        .where(
            and_(
                Solicitud.solicitante_id == current_user.id,
                Solicitud.estado == EstadoSolicitud.RECHAZADA
            )
        )
    ).one()

    # Solicitudes este mes
    primer_dia_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    solicitudes_mes = session.exec(
        select(func.count(Solicitud.id))
        .where(
            and_(
                Solicitud.solicitante_id == current_user.id,
                Solicitud.fecha_solicitud >= primer_dia_mes
            )
        )
    ).one()

    # Tasa de aprobación
    tasa_aprobacion = 0
    if total_solicitudes > 0:
        tasa_aprobacion = round((aprobadas / total_solicitudes) * 100, 2)

    return {
        "total_solicitudes": total_solicitudes,
        "pendientes": pendientes,
        "aprobadas": aprobadas,
        "rechazadas": rechazadas,
        "solicitudes_mes": solicitudes_mes,
        "tasa_aprobacion": tasa_aprobacion
    }
