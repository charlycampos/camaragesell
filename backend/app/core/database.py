"""
Configuración de la base de datos con SQLModel
"""
from sqlmodel import create_engine, SQLModel, Session
from .config import settings

# Crear el engine de la base de datos
engine = create_engine(
    settings.DATABASE_URL,
    echo=True,  # Log de SQL queries (desactivar en producción)
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)


def create_db_and_tables():
    """Crea todas las tablas en la base de datos"""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Generador de sesiones de base de datos para dependency injection"""
    with Session(engine) as session:
        yield session
