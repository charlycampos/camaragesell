"""
Aplicación principal SIGECA - Sistema de Gestión de Cámaras Gesell
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_db_and_tables
from app.api.endpoints import auth, solicitudes, programaciones, sedes, salas, peritos, despachos, reportes, usuarios


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manejador del ciclo de vida de la aplicación"""
    # Startup: Crear tablas de base de datos
    print("Creating database tables...")
    create_db_and_tables()
    print("Database tables created successfully!")
    yield
    # Shutdown: Limpiar recursos si es necesario
    print("Shutting down...")


# Crear la aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["authentication"]
)

app.include_router(
    solicitudes.router,
    prefix=f"{settings.API_V1_STR}/solicitudes",
    tags=["solicitudes"]
)

app.include_router(
    programaciones.router,
    prefix=f"{settings.API_V1_STR}/programaciones",
    tags=["programaciones"]
)

app.include_router(
    sedes.router,
    prefix=f"{settings.API_V1_STR}/sedes",
    tags=["mantenimientos"]
)

app.include_router(
    salas.router,
    prefix=f"{settings.API_V1_STR}/salas",
    tags=["mantenimientos"]
)

app.include_router(
    peritos.router,
    prefix=f"{settings.API_V1_STR}/peritos",
    tags=["mantenimientos"]
)

app.include_router(
    despachos.router,
    prefix=f"{settings.API_V1_STR}/despachos",
    tags=["mantenimientos"]
)

app.include_router(
    reportes.router,
    prefix=f"{settings.API_V1_STR}/reportes",
    tags=["reportes"]
)

app.include_router(
    usuarios.router,
    prefix=f"{settings.API_V1_STR}/usuarios",
    tags=["usuarios"]
)


@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "SIGECA API",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
