"""
Módulo de Validaciones del Sistema SIGECA
Valida horarios laborales, conflictos de sala/perito, disponibilidad, etc.
"""
from datetime import datetime, time, timedelta, timezone
from typing import List, Optional, Tuple
from sqlmodel import Session, select, and_, or_
from fastapi import HTTPException, status
from zoneinfo import ZoneInfo

from ..models.programacion import Programacion, EstadoProgramacion
from ..models.sala import Sala
from ..models.perito import Perito

# Zona horaria de Perú
PERU_TZ = ZoneInfo('America/Lima')  # UTC-5


class ValidationError(Exception):
    """Excepción personalizada para errores de validación"""
    def __init__(self, message: str, code: str):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ProgramacionValidator:
    """Validador de programaciones con reglas de negocio"""

    # Configuración de horarios laborales
    HORA_INICIO_LABORAL = time(7, 0)  # 7:00 AM
    HORA_FIN_LABORAL = time(19, 0)    # 7:00 PM
    DURACION_MINIMA = 30  # minutos
    DURACION_MAXIMA = 240  # minutos (4 horas)
    DIAS_LABORALES = [0, 1, 2, 3, 4]  # Lunes a Viernes (0=Lunes, 6=Domingo)

    def __init__(self, session: Session):
        self.session = session

    def validate_programacion(
        self,
        fecha_hora: datetime,
        duracion_minutos: int,
        sala_id: int,
        perito_id: int,
        programacion_id: Optional[int] = None
    ) -> Tuple[bool, List[str]]:
        """
        Valida una programación completa
        Returns: (is_valid, list_of_errors)
        """
        errors = []

        # 1. Validar fecha futura
        if not self._validate_fecha_futura(fecha_hora):
            errors.append("La fecha de programación debe ser al menos 5 minutos en el futuro")

        # 2. Validar día laboral
        if not self._validate_dia_laboral(fecha_hora):
            errors.append(f"Solo se pueden programar citas de lunes a viernes. Día seleccionado: {self._get_dia_nombre(fecha_hora)}")

        # 3. Validar horario laboral
        if not self._validate_horario_laboral(fecha_hora, duracion_minutos):
            hora_fin = fecha_hora + timedelta(minutes=duracion_minutos)
            errors.append(
                f"La cita debe estar dentro del horario laboral (07:00 - 19:00). "
                f"Horario seleccionado: {fecha_hora.strftime('%H:%M')} - {hora_fin.strftime('%H:%M')}"
            )

        # 4. Validar duración
        if not self._validate_duracion(duracion_minutos):
            errors.append(
                f"La duración debe estar entre {self.DURACION_MINIMA} y {self.DURACION_MAXIMA} minutos. "
                f"Duración seleccionada: {duracion_minutos} minutos"
            )

        # 5. Validar conflicto de sala
        sala_conflicto = self._check_conflicto_sala(
            fecha_hora, duracion_minutos, sala_id, programacion_id
        )
        if sala_conflicto:
            errors.append(
                f"⚠️ Conflicto de sala: La sala ya está ocupada de "
                f"{sala_conflicto.fecha_hora.strftime('%H:%M')} a "
                f"{(sala_conflicto.fecha_hora + timedelta(minutes=sala_conflicto.duracion_minutos)).strftime('%H:%M')} "
                f"(ID Programación: {sala_conflicto.id})"
            )

        # 6. Validar conflicto de perito
        perito_conflicto = self._check_conflicto_perito(
            fecha_hora, duracion_minutos, perito_id, programacion_id
        )
        if perito_conflicto:
            errors.append(
                f"⚠️ Conflicto de perito: El perito ya tiene una cita de "
                f"{perito_conflicto.fecha_hora.strftime('%H:%M')} a "
                f"{(perito_conflicto.fecha_hora + timedelta(minutes=perito_conflicto.duracion_minutos)).strftime('%H:%M')} "
                f"(ID Programación: {perito_conflicto.id})"
            )

        # 7. Validar disponibilidad de sala
        sala = self.session.get(Sala, sala_id)
        if not sala:
            errors.append("La sala seleccionada no existe")
        elif not sala.is_active:
            errors.append(f"La sala '{sala.nombre}' no está activa")

        # 8. Validar disponibilidad de perito
        perito = self.session.get(Perito, perito_id)
        if not perito:
            errors.append("El perito seleccionado no existe")
        elif not perito.is_active:
            errors.append(f"El perito '{perito.nombre_completo}' no está activo")

        return len(errors) == 0, errors

    def _validate_fecha_futura(self, fecha_hora: datetime) -> bool:
        """Valida que la fecha sea futura (al menos 5 minutos desde ahora para dar margen)"""
        # Obtener hora actual en zona horaria de Perú
        now = datetime.now(PERU_TZ)

        # Si fecha_hora no tiene timezone, asumimos que es hora local de Perú
        if fecha_hora.tzinfo is None:
            fecha_hora = fecha_hora.replace(tzinfo=PERU_TZ)
        else:
            # Si tiene timezone UTC, convertir a hora de Perú para comparación
            fecha_hora = fecha_hora.astimezone(PERU_TZ)

        # Permitir programar con al menos 5 minutos de anticipación
        margen_minimo = now + timedelta(minutes=5)
        return fecha_hora > margen_minimo

    def _validate_dia_laboral(self, fecha_hora: datetime) -> bool:
        """Valida que sea día laboral (Lunes-Viernes)"""
        return fecha_hora.weekday() in self.DIAS_LABORALES

    def _validate_horario_laboral(self, fecha_hora: datetime, duracion_minutos: int) -> bool:
        """Valida que esté dentro del horario laboral"""
        hora_inicio = fecha_hora.time()
        hora_fin = (fecha_hora + timedelta(minutes=duracion_minutos)).time()

        # Debe iniciar después de hora inicio laboral
        if hora_inicio < self.HORA_INICIO_LABORAL:
            return False

        # Debe terminar antes de hora fin laboral
        if hora_fin > self.HORA_FIN_LABORAL:
            return False

        return True

    def _validate_duracion(self, duracion_minutos: int) -> bool:
        """Valida que la duración esté en el rango permitido"""
        return self.DURACION_MINIMA <= duracion_minutos <= self.DURACION_MAXIMA

    def _check_conflicto_sala(
        self,
        fecha_hora: datetime,
        duracion_minutos: int,
        sala_id: int,
        programacion_id: Optional[int] = None
    ) -> Optional[Programacion]:
        """
        Verifica si hay conflicto con otra programación en la misma sala
        Returns: Programacion conflictiva o None
        """
        fecha_fin = fecha_hora + timedelta(minutes=duracion_minutos)

        # Obtener todas las programaciones activas de la sala ese día
        inicio_dia = fecha_hora.replace(hour=0, minute=0, second=0, microsecond=0)
        fin_dia = inicio_dia + timedelta(days=1)

        statement = select(Programacion).where(
            and_(
                Programacion.sala_id == sala_id,
                Programacion.estado.in_([
                    EstadoProgramacion.PROGRAMADA,
                    EstadoProgramacion.REPROGRAMADA
                ]),
                Programacion.fecha_hora >= inicio_dia,
                Programacion.fecha_hora < fin_dia
            )
        )

        # Excluir la programación actual si estamos editando
        if programacion_id:
            statement = statement.where(Programacion.id != programacion_id)

        programaciones = self.session.exec(statement).all()

        # Verificar conflictos en Python
        for prog in programaciones:
            prog_inicio = prog.fecha_hora
            prog_fin = prog_inicio + timedelta(minutes=prog.duracion_minutos)

            # Hay conflicto si:
            # 1. La nueva cita empieza durante una cita existente
            # 2. La nueva cita termina durante una cita existente
            # 3. La nueva cita envuelve completamente a una cita existente
            if (prog_inicio <= fecha_hora < prog_fin) or \
               (prog_inicio < fecha_fin <= prog_fin) or \
               (fecha_hora <= prog_inicio and fecha_fin >= prog_fin):
                return prog

        return None

    def _check_conflicto_perito(
        self,
        fecha_hora: datetime,
        duracion_minutos: int,
        perito_id: int,
        programacion_id: Optional[int] = None
    ) -> Optional[Programacion]:
        """
        Verifica si hay conflicto con otra programación del mismo perito
        Returns: Programacion conflictiva o None
        """
        fecha_fin = fecha_hora + timedelta(minutes=duracion_minutos)

        # Obtener todas las programaciones activas del perito ese día
        inicio_dia = fecha_hora.replace(hour=0, minute=0, second=0, microsecond=0)
        fin_dia = inicio_dia + timedelta(days=1)

        statement = select(Programacion).where(
            and_(
                Programacion.perito_id == perito_id,
                Programacion.estado.in_([
                    EstadoProgramacion.PROGRAMADA,
                    EstadoProgramacion.REPROGRAMADA
                ]),
                Programacion.fecha_hora >= inicio_dia,
                Programacion.fecha_hora < fin_dia
            )
        )

        # Excluir la programación actual si estamos editando
        if programacion_id:
            statement = statement.where(Programacion.id != programacion_id)

        programaciones = self.session.exec(statement).all()

        # Verificar conflictos en Python
        for prog in programaciones:
            prog_inicio = prog.fecha_hora
            prog_fin = prog_inicio + timedelta(minutes=prog.duracion_minutos)

            # Hay conflicto si:
            # 1. La nueva cita empieza durante una cita existente
            # 2. La nueva cita termina durante una cita existente
            # 3. La nueva cita envuelve completamente a una cita existente
            if (prog_inicio <= fecha_hora < prog_fin) or \
               (prog_inicio < fecha_fin <= prog_fin) or \
               (fecha_hora <= prog_inicio and fecha_fin >= prog_fin):
                return prog

        return None

    def _get_dia_nombre(self, fecha: datetime) -> str:
        """Retorna el nombre del día en español"""
        dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        return dias[fecha.weekday()]

    def get_disponibilidad_sala(
        self,
        sala_id: int,
        fecha: datetime,
        duracion_minutos: int = 60
    ) -> List[dict]:
        """
        Retorna los horarios disponibles de una sala en un día específico
        Returns: Lista de slots disponibles
        """
        # Obtener todas las programaciones del día para esa sala
        inicio_dia = fecha.replace(hour=0, minute=0, second=0, microsecond=0)
        fin_dia = inicio_dia + timedelta(days=1)

        statement = select(Programacion).where(
            and_(
                Programacion.sala_id == sala_id,
                Programacion.fecha_hora >= inicio_dia,
                Programacion.fecha_hora < fin_dia,
                Programacion.estado.in_([
                    EstadoProgramacion.PROGRAMADA,
                    EstadoProgramacion.REPROGRAMADA
                ])
            )
        ).order_by(Programacion.fecha_hora)

        programaciones = self.session.exec(statement).all()

        # Generar slots disponibles
        slots_disponibles = []
        hora_actual = inicio_dia.replace(
            hour=self.HORA_INICIO_LABORAL.hour,
            minute=self.HORA_INICIO_LABORAL.minute
        )
        hora_fin_dia = inicio_dia.replace(
            hour=self.HORA_FIN_LABORAL.hour,
            minute=self.HORA_FIN_LABORAL.minute
        )

        for prog in programaciones:
            # Si hay tiempo disponible antes de esta programación
            if hora_actual < prog.fecha_hora:
                slots_disponibles.append({
                    'inicio': hora_actual.isoformat(),
                    'fin': prog.fecha_hora.isoformat(),
                    'disponible': True
                })

            # Avanzar al final de esta programación
            hora_actual = prog.fecha_hora + timedelta(minutes=prog.duracion_minutos)

        # Si aún hay tiempo disponible después de la última programación
        if hora_actual < hora_fin_dia:
            slots_disponibles.append({
                'inicio': hora_actual.isoformat(),
                'fin': hora_fin_dia.isoformat(),
                'disponible': True
            })

        return slots_disponibles
