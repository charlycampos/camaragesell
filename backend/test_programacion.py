"""
Test para crear programación como ccampos
"""
from datetime import datetime, timedelta, timezone
from sqlmodel import Session, create_engine, select
from app.models.user import User
from app.models.programacion import Programacion, EstadoProgramacion
from app.models.solicitud import Solicitud, EstadoSolicitud
from app.core.validators import ProgramacionValidator

# Conectar a la BD
engine = create_engine('sqlite:///sigeca.db')
session = Session(engine)

# Obtener usuario ccampos
ccampos = session.exec(select(User).where(User.username == 'ccampos')).first()
print(f"Usuario: {ccampos.username}, Role: {ccampos.role}")

# Obtener solicitud pendiente
solicitud = session.exec(select(Solicitud).where(Solicitud.estado == EstadoSolicitud.PENDIENTE)).first()
print(f"Solicitud: ID={solicitud.id}, Caso={solicitud.numero_caso}, Estado={solicitud.estado}")

# Crear datos para programación (mañana a las 10:00 AM, 60 minutos)
fecha_hora = datetime.now(timezone.utc).replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)
print(f"\nIntentando crear programación:")
print(f"  Fecha: {fecha_hora}")
print(f"  Duración: 60 minutos")
print(f"  Sala ID: 1")
print(f"  Perito ID: 1")
print(f"  Solicitud ID: {solicitud.id}")

# Validar programación
validator = ProgramacionValidator(session)
try:
    is_valid, errors = validator.validate_programacion(
        fecha_hora=fecha_hora,
        duracion_minutos=60,
        sala_id=1,
        perito_id=1
    )

    if is_valid:
        print("\n[OK] Validacion exitosa")

        # Crear programación
        programacion = Programacion(
            solicitud_id=solicitud.id,
            fecha_hora=fecha_hora,
            duracion_minutos=60,
            sala_id=1,
            perito_id=1,
            programador_id=ccampos.id
        )
        session.add(programacion)

        # Actualizar solicitud
        solicitud.estado = EstadoSolicitud.PROGRAMADA
        session.add(solicitud)

        session.commit()
        print(f"[OK] Programacion creada con ID: {programacion.id}")
    else:
        print("\n[ERROR] Errores de validacion:")
        for error in errors:
            print(f"  - {error}")

except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

finally:
    session.close()
