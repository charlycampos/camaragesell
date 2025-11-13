"""
Tests para configuración de la aplicación
"""
import pytest
from app.core.config import Settings
from pydantic_core import ValidationError


def test_settings_require_secret_key():
    """Test que SECRET_KEY es requerida"""
    with pytest.raises(ValidationError) as exc_info:
        Settings(_env_file=None)  # Sin .env

    errors = exc_info.value.errors()
    assert any('SECRET_KEY' in str(err.get('loc')) for err in errors)


def test_secret_key_minimum_length():
    """Test que SECRET_KEY debe tener mínimo 32 caracteres"""
    with pytest.raises(ValidationError) as exc_info:
        Settings(SECRET_KEY="too_short")

    errors = exc_info.value.errors()
    assert any('32 characters' in str(err.get('msg')) for err in errors)


def test_secret_key_no_insecure_defaults():
    """Test que rechaza claves inseguras comunes"""
    insecure_keys = [
        'clave-secreta-cambiar-en-produccion',
        'tu_clave_secreta_muy_segura_cambiala_en_produccion',
        'secret',
        'secretkey'
    ]

    for key in insecure_keys:
        with pytest.raises(ValidationError):
            Settings(SECRET_KEY=key)


def test_settings_with_valid_secret_key():
    """Test que settings se crea correctamente con SECRET_KEY válida"""
    import secrets

    valid_key = secrets.token_urlsafe(32)
    settings = Settings(SECRET_KEY=valid_key)

    assert settings.SECRET_KEY == valid_key
    assert len(settings.SECRET_KEY) >= 32
    assert settings.ALGORITHM == "HS256"
    assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 30


def test_debug_mode_defaults_to_false():
    """Test que DEBUG_MODE por defecto es False"""
    import secrets

    settings = Settings(SECRET_KEY=secrets.token_urlsafe(32))
    assert settings.DEBUG_MODE is False
