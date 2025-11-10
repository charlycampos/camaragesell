"""
Script para inicializar la base de datos con datos de prueba
"""
from sqlmodel import Session
from app.core.database import engine, create_db_and_tables
from app.models.user import User, UserRole
from app.models.sede import Sede
from app.models.sala import Sala
from app.models.perito import Perito
from app.models.despacho_fiscal import DespachoFiscal
from app.core.security import get_password_hash


def init_db():
    """Inicializa la base de datos con datos de prueba"""
    print("Creating database tables...")
    create_db_and_tables()

    with Session(engine) as session:
        # Crear usuarios de ejemplo
        users = [
            User(
                username="admin",
                email="admin@sigeca.gob.pe",
                hashed_password=get_password_hash("admin123"),
                full_name="Administrador Sistema",
                role=UserRole.ADMIN
            ),
            User(
                username="asistente",
                email="asistente@sigeca.gob.pe",
                hashed_password=get_password_hash("asistente123"),
                full_name="María López - Asistente",
                role=UserRole.ASISTENTE_ADMINISTRATIVO
            ),
            User(
                username="perito1",
                email="perito1@sigeca.gob.pe",
                hashed_password=get_password_hash("perito123"),
                full_name="Dr. Juan Pérez",
                role=UserRole.PERITO
            ),
            User(
                username="fiscal1",
                email="fiscal1@mpfn.gob.pe",
                hashed_password=get_password_hash("fiscal123"),
                full_name="Dra. Ana García",
                role=UserRole.FISCAL
            )
        ]

        for user in users:
            session.add(user)

        session.commit()
        print("✓ Usuarios creados")

        # Crear sedes
        sedes = [
            Sede(
                nombre="IML Lima Centro",
                direccion="Av. La Marina 123, Lima",
                telefono="01-4567890"
            ),
            Sede(
                nombre="IML Lima Norte",
                direccion="Av. Túpac Amaru 456, Lima",
                telefono="01-4567891"
            )
        ]

        for sede in sedes:
            session.add(sede)

        session.commit()
        print("✓ Sedes creadas")

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
        print("✓ Salas creadas")

        # Crear peritos
        peritos = [
            Perito(
                nombres="Juan",
                apellidos="Pérez Soto",
                especialidad="Psicología Forense",
                colegiatura="CPsP-12345",
                telefono="999888777",
                email="jperez@sigeca.gob.pe",
                user_id=3  # Usuario perito1
            ),
            Perito(
                nombres="Carmen",
                apellidos="Rojas Mendoza",
                especialidad="Psicología Clínica",
                colegiatura="CPsP-12346",
                telefono="999888778",
                email="crojas@sigeca.gob.pe"
            )
        ]

        for perito in peritos:
            session.add(perito)

        session.commit()
        print("✓ Peritos creados")

        # Crear despachos fiscales
        despachos = [
            DespachoFiscal(
                nombre="Primera Fiscalía Provincial Penal de Lima",
                distrito="Lima - Cercado",
                direccion="Av. Abancay 123, Lima",
                telefono="01-4567892",
                fiscal_titular="Dr. Roberto Mendoza"
            ),
            DespachoFiscal(
                nombre="Segunda Fiscalía Provincial de Familia de Lima Norte",
                distrito="San Martín de Porres",
                direccion="Av. Perú 456, SMP",
                telefono="01-4567893",
                fiscal_titular="Dra. Patricia Quispe"
            )
        ]

        for despacho in despachos:
            session.add(despacho)

        session.commit()
        print("✓ Despachos fiscales creados")

    print("\n" + "="*50)
    print("Base de datos inicializada correctamente!")
    print("="*50)
    print("\nCredenciales de acceso:")
    print("\nAdmin:")
    print("  Usuario: admin")
    print("  Password: admin123")
    print("\nAsistente Administrativo:")
    print("  Usuario: asistente")
    print("  Password: asistente123")
    print("\nPerito:")
    print("  Usuario: perito1")
    print("  Password: perito123")
    print("\nFiscal:")
    print("  Usuario: fiscal1")
    print("  Password: fiscal123")
    print("="*50)


if __name__ == "__main__":
    init_db()
