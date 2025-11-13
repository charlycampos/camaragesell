"""
Aplicación principal SIGECA - Sistema de Gestión de Cámaras Gesell
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import create_db_and_tables
from app.core.logging_config import logger, log_startup_info
from app.api.endpoints import auth, solicitudes, programaciones, distrito_fiscal, sedes, salas, peritos, despachos, reportes, usuarios, estadisticas


# Configurar rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manejador del ciclo de vida de la aplicación"""
    # Startup: Crear tablas de base de datos
    logger.info("Creating database tables...")
    create_db_and_tables()
    logger.info("Database tables created successfully!")
    log_startup_info()
    yield
    # Shutdown: Limpiar recursos si es necesario
    logger.info("Shutting down application...")


# Crear la aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Agregar el limiter a la app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,  # Requerido para cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin"],
    expose_headers=["Content-Type", "Authorization"],
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
    distrito_fiscal.router,
    prefix=f"{settings.API_V1_STR}/distritos-fiscales",
    tags=["mantenimientos"]
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

app.include_router(
    estadisticas.router,
    prefix=f"{settings.API_V1_STR}/estadisticas",
    tags=["estadisticas"]
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

