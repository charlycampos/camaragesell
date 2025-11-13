"""
Tests para funciones de seguridad
"""
import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token
)
from app.core.config import settings


class TestPasswordHashing:
    """Tests para hashing de contraseñas"""

    def test_hash_password(self):
        """Test que se puede hashear una contraseña"""
        password = "TestPassword123!@#"
        hashed = get_password_hash(password)

        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith('$2b$')  # bcrypt prefix

    def test_verify_correct_password(self):
        """Test que verifica correctamente una contraseña válida"""
        password = "TestPassword123!@#"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_incorrect_password(self):
        """Test que rechaza una contraseña incorrecta"""
        password = "TestPassword123!@#"
        wrong_password = "WrongPassword456!@#"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_different_hashes_for_same_password(self):
        """Test que el mismo password genera diferentes hashes (salt)"""
        password = "TestPassword123!@#"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestJWTTokens:
    """Tests para creación de tokens JWT"""

    def test_create_access_token(self):
        """Test que se puede crear un token JWT"""
        data = {"sub": "testuser", "role": "admin"}
        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

    def test_token_contains_correct_data(self):
        """Test que el token contiene los datos correctos"""
        data = {"sub": "testuser", "role": "admin"}
        token = create_access_token(data)

        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        assert decoded["sub"] == "testuser"
        assert decoded["role"] == "admin"
        assert "exp" in decoded

    def test_token_expiration(self):
        """Test que el token tiene tiempo de expiración correcto"""
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=15)
        token = create_access_token(data, expires_delta)

        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        exp_timestamp = decoded["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)

        # Verificar que expira en aproximadamente 15 minutos
        now = datetime.now(timezone.utc)
        time_diff = (exp_datetime - now).total_seconds()

        assert 14 * 60 < time_diff < 16 * 60  # Entre 14 y 16 minutos

    def test_token_default_expiration(self):
        """Test que el token usa expiración por defecto de settings"""
        data = {"sub": "testuser"}
        token = create_access_token(data)

        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        exp_timestamp = decoded["exp"]
        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)

        now = datetime.now(timezone.utc)
        expected_expiration = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        time_diff = abs((exp_datetime - expected_expiration).total_seconds())

        assert time_diff < 5  # Diferencia menor a 5 segundos

    def test_expired_token_raises_error(self):
        """Test que un token expirado lanza error al decodificarse"""
        data = {"sub": "testuser"}
        expired_delta = timedelta(seconds=-10)  # Expirado hace 10 segundos
        token = create_access_token(data, expired_delta)

        with pytest.raises(jwt.ExpiredSignatureError):
            jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    def test_invalid_token_raises_error(self):
        """Test que un token inválido lanza error"""
        invalid_token = "invalid.token.here"

        with pytest.raises(jwt.JWTError):
            jwt.decode(invalid_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
