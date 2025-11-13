"""
Script para inicializar la base de datos con datos de prueba
"""
import logging
from datetime import datetime, timezone
from sqlmodel import Session
from app.core.database import engine, create_db_and_tables
from app.models.user import User, UserRole
from app.models.sede import Sede
from app.models.sala import Sala
from app.models.perito import Perito
from app.models.despacho_fiscal import DespachoFiscal
from app.models.distrito_fiscal import DistritoFiscal
from app.models.solicitud import Solicitud, EstadoSolicitud
from app.core.security import get_password_hash

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


def init_db():
    """Inicializa la base de datos con datos de prueba"""
    logger.info("Creating database tables...")
    create_db_and_tables()

    with Session(engine) as session:
        # Crear Distritos Fiscales primero
        distritos = [
            DistritoFiscal(
                codigo="DF-LIMA",
                nombre="Lima",
                region="Lima",
                provincia="Lima"
            ),
            DistritoFiscal(
                codigo="DF-CALL",
                nombre="Callao",
                region="Callao",
                provincia="Callao"
            )
        ]

        for distrito in distritos:
            session.add(distrito)

        session.commit()
        logger.info("Fiscal districts created successfully")

        # Crear usuarios de ejemplo con contraseñas seguras
        # ⚠️ IMPORTANTE: Estas son contraseñas de DESARROLLO
        # En producción, deben cambiarse inmediatamente
        users = [
            User(
                username="admin",
                email="admin@sigeca.gob.pe",
                hashed_password=get_password_hash("Admin123!@#"),
                full_name="Administrador Sistema",
                role=UserRole.ADMIN
            ),
            User(
                username="ccampos",
                email="ccampos@sigeca.gob.pe",
                hashed_password=get_password_hash("Ccampos123!@#"),
                full_name="Carlos Campos - Asistente Cámara Gesell",
                role=UserRole.ASISTENTE_ADMINISTRATIVO,
                distrito_fiscal_id=1
            ),
            User(
                username="asistente",
                email="asistente@sigeca.gob.pe",
                hashed_password=get_password_hash("Asistente123!@#"),
                full_name="María López - Asistente",
                role=UserRole.ASISTENTE_ADMINISTRATIVO,
                distrito_fiscal_id=1
            ),
            User(
                username="perito1",
                email="perito1@sigeca.gob.pe",
                hashed_password=get_password_hash("Perito123!@#"),
                full_name="Dr. Juan Pérez",
                role=UserRole.PERITO,
                distrito_fiscal_id=1
            ),
            User(
                username="fiscal1",
                email="fiscal1@mpfn.gob.pe",
                hashed_password=get_password_hash("Fiscal123!@#"),
                full_name="Dra. Ana García",
                role=UserRole.FISCAL,
                distrito_fiscal_id=1
            )
        ]

        for user in users:
            session.add(user)

        session.commit()
        logger.info("Users created successfully")

        # Crear sedes
        sedes = [
            Sede(
                nombre="IML Lima Centro",
                direccion="Av. La Marina 123, Lima",
                telefono="01-4567890",
                distrito_fiscal_id=1
            ),
            Sede(
                nombre="IML Lima Norte",
                direccion="Av. Túpac Amaru 456, Lima",
                telefono="01-4567891",
                distrito_fiscal_id=1
            )
        ]

        for sede in sedes:
            session.add(sede)

        session.commit()
        logger.info("Headquarters created successfully")

        # Crear salas
        salas = [
            Sala(
                nombre="Cámara Gesell 01",
                capacidad=6,
                equipamiento="Sistema de audio y video, espejo unidireccional",
                sede_id=1
            ),
            Sala(
                nombre="Cámara Gesell 02",
                capacidad=4,
                equipamiento="Sistema de audio y video",
                sede_id=1
            ),
            Sala(
                nombre="Cámara Gesell 01",
                capacidad=6,
                equipamiento="Sistema de audio y video, espejo unidireccional",
                sede_id=2
            )
        ]

        for sala in salas:
            session.add(sala)

        session.commit()
        logger.info("Rooms created successfully")

        # Crear peritos
        peritos = [
            Perito(
                nombres="Juan",
                apellidos="Pérez Soto",
                especialidad="Psicología Forense",
                colegiatura="CPsP-12345",
                telefono="999888777",
                email="jperez@sigeca.gob.pe",
                user_id=4,  # Usuario perito1
                distrito_fiscal_id=1
            ),
            Perito(
                nombres="Carmen",
                apellidos="Rojas Mendoza",
                especialidad="Psicología Clínica",
                colegiatura="CPsP-12346",
                telefono="999888778",
                email="crojas@sigeca.gob.pe",
                distrito_fiscal_id=1
            )
        ]

        for perito in peritos:
            session.add(perito)

        session.commit()
        logger.info("Experts created successfully")

        # Crear despachos fiscales
        despachos = [
            DespachoFiscal(
                nombre="Primera Fiscalía Provincial Penal de Lima",
                direccion="Av. Abancay 123, Lima",
                telefono="01-4567892",
                fiscal_titular="Dr. Roberto Mendoza",
                distrito_fiscal_id=1
            ),
            DespachoFiscal(
                nombre="Segunda Fiscalía Provincial de Familia de Lima Norte",
                direccion="Av. Perú 456, SMP",
                telefono="01-4567893",
                fiscal_titular="Dra. Patricia Quispe",
                distrito_fiscal_id=1
            )
        ]

        for despacho in despachos:
            session.add(despacho)

        session.commit()
        logger.info("Prosecutor's offices created successfully")

        # Crear solicitudes pendientes para que ccampos pueda aprobar
        from datetime import timedelta
        solicitudes = [
            Solicitud(
                numero_caso="MP-2024-001",
                tipo_delito="Violencia Familiar",
                descripcion="Evaluación psicológica a menor de edad",
                fecha_solicitud=datetime.now(timezone.utc),
                estado=EstadoSolicitud.PENDIENTE,
                fiscal_id=5,  # fiscal1
                despacho_fiscal_id=1
            ),
            Solicitud(
                numero_caso="MP-2024-002",
                tipo_delito="Abuso Sexual",
                descripcion="Cámara Gesell para testimonio de víctima",
                fecha_solicitud=datetime.now(timezone.utc) - timedelta(days=1),
                estado=EstadoSolicitud.PENDIENTE,
                fiscal_id=5,  # fiscal1
                despacho_fiscal_id=2
            )
        ]

        for solicitud in solicitudes:
            session.add(solicitud)

        session.commit()
        logger.info("Pending requests created successfully")

    logger.info("\n" + "="*70)
    logger.info("Database initialized successfully!")
    logger.info("="*70)
    logger.info("\nAccess credentials (DEVELOPMENT ONLY):")
    logger.warning("IMPORTANT: Change these passwords in production")
    logger.info("\nAdmin:")
    logger.info("  Username: admin")
    logger.info("  Password: Admin123!@#")
    logger.info("\nAsistente Administrativo:")
    logger.info("  Username: asistente")
    logger.info("  Password: Asistente123!@#")
    logger.info("\nPerito:")
    logger.info("  Username: perito1")
    logger.info("  Password: Perito123!@#")
    logger.info("\nFiscal:")
    logger.info("  Username: fiscal1")
    logger.info("  Password: Fiscal123!@#")
    logger.info("\n" + "="*70)
    logger.info("Password requirements:")
    logger.info("   - Minimum 8 characters")
    logger.info("   - At least one uppercase and one lowercase letter")
    logger.info("   - At least one number")
    logger.info("   - At least one special character")
    logger.info("="*70)


if __name__ == "__main__":
    init_db()
