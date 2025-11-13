"""
Configuración de la aplicación SIGECA
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator, ValidationError as PydanticValidationError


class Settings(BaseSettings):
    """Configuración de la aplicación"""

    # Project Info
    PROJECT_NAME: str = "SIGECA"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Environment
    DEBUG_MODE: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./sigeca.db"

    # Security - SECRET_KEY es OBLIGATORIO y debe venir del .env
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:3000",
    ]

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Valida que SECRET_KEY sea suficientemente segura"""
        if len(v) < 32:
            raise ValueError(
                'SECRET_KEY must be at least 32 characters long for production security. '
                'Generate a secure key with: python -c "import secrets; print(secrets.token_urlsafe(32))"'
            )
        # Advertir si se usa una clave de ejemplo común
        insecure_keys = [
            'clave-secreta-cambiar-en-produccion',
            'tu_clave_secreta_muy_segura_cambiala_en_produccion',
            'secret',
            'secretkey',
            'changeme',
            '123456'
        ]
        if v.lower() in insecure_keys:
            raise ValueError(
                f'SECRET_KEY is using an insecure default value. '
                f'Generate a secure key with: python -c "import secrets; print(secrets.token_urlsafe(32))"'
            )
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


# Inicializar settings con manejo de errores claro
try:
    settings = Settings()
except PydanticValidationError as e:
    print("\n" + "="*70)
    print("ERROR DE CONFIGURACION - SIGECA")
    print("="*70)
    for error in e.errors():
        if 'SECRET_KEY' in str(error.get('loc')):
            print("\nSECRET_KEY no esta configurada o es insegura")
            print("\nPasos para corregir:")
            print("1. Copia el archivo .env.example a .env:")
            print("   cp .env.example .env")
            print("\n2. Genera una clave segura ejecutando:")
            print('   python -c "import secrets; print(secrets.token_urlsafe(32))"')
            print("\n3. Agrega la clave generada al archivo .env:")
            print("   SECRET_KEY=<tu_clave_generada_aqui>")
            print("\n" + "="*70 + "\n")
    raise SystemExit(1)
