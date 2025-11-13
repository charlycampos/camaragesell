"""
Configuración de logging estructurado para SIGECA
"""
import logging
import sys
from typing import Any
from .config import settings


def setup_logging() -> logging.Logger:
    """
    Configura el sistema de logging de la aplicación

    Returns:
        Logger configurado
    """
    # Definir formato de logs
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    # Configurar nivel de logging basado en DEBUG_MODE
    log_level = logging.DEBUG if settings.DEBUG_MODE else logging.INFO

    # Configurar logging básico
    logging.basicConfig(
        level=log_level,
        format=log_format,
        datefmt=date_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Crear logger para la aplicación
    logger = logging.getLogger("sigeca")
    logger.setLevel(log_level)

    # Reducir verbosidad de librerías externas
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)

    return logger


# Logger global para la aplicación
logger = setup_logging()


def log_startup_info():
    """Log información de inicio de la aplicación"""
    logger.info("="*70)
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {'DEVELOPMENT' if settings.DEBUG_MODE else 'PRODUCTION'}")
    logger.info(f"API version: {settings.API_V1_STR}")
    logger.info(f"Database: {settings.DATABASE_URL.split('///')[0] if '///' in settings.DATABASE_URL else 'PostgreSQL'}")
    logger.info("="*70)


def log_request(method: str, path: str, status_code: int, duration_ms: float):
    """
    Log una petición HTTP

    Args:
        method: Método HTTP
        path: Ruta del endpoint
        status_code: Código de estado de la respuesta
        duration_ms: Duración en milisegundos
    """
    log_level = logging.INFO if status_code < 400 else logging.WARNING
    logger.log(
        log_level,
        f"{method} {path} - {status_code} - {duration_ms:.2f}ms"
    )


def log_database_operation(operation: str, table: str, success: bool = True, **kwargs):
    """
    Log una operación de base de datos

    Args:
        operation: Tipo de operación (CREATE, READ, UPDATE, DELETE)
        table: Nombre de la tabla
        success: Si la operación fue exitosa
        **kwargs: Información adicional
    """
    extra_info = " | ".join([f"{k}={v}" for k, v in kwargs.items()])
    status = "SUCCESS" if success else "FAILED"

    logger.info(f"DB {operation} | {table} | {status} | {extra_info}")


def log_authentication(username: str, success: bool, reason: str = ""):
    """
    Log un intento de autenticación

    Args:
        username: Nombre de usuario
        success: Si la autenticación fue exitosa
        reason: Razón del fallo (si aplica)
    """
    if success:
        logger.info(f"AUTH SUCCESS | user={username}")
    else:
        logger.warning(f"AUTH FAILED | user={username} | reason={reason}")


def log_validation_error(entity: str, errors: list, **context):
    """
    Log errores de validación

    Args:
        entity: Entidad siendo validada
        errors: Lista de errores
        **context: Contexto adicional
    """
    context_str = " | ".join([f"{k}={v}" for k, v in context.items()])
    logger.warning(f"VALIDATION ERROR | entity={entity} | errors={errors} | {context_str}")


def log_security_event(event_type: str, severity: str, details: dict):
    """
    Log eventos de seguridad

    Args:
        event_type: Tipo de evento (RATE_LIMIT, INVALID_TOKEN, etc.)
        severity: Severidad (LOW, MEDIUM, HIGH, CRITICAL)
        details: Detalles del evento
    """
    details_str = " | ".join([f"{k}={v}" for k, v in details.items()])

    log_level = {
        "LOW": logging.INFO,
        "MEDIUM": logging.WARNING,
        "HIGH": logging.ERROR,
        "CRITICAL": logging.CRITICAL
    }.get(severity, logging.WARNING)

    logger.log(log_level, f"SECURITY EVENT | {event_type} | {severity} | {details_str}")
