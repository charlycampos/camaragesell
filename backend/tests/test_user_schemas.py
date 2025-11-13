"""
Tests para schemas de usuario y validación de contraseñas
"""
import pytest
from pydantic import ValidationError
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import UserRole


class TestPasswordValidation:
    """Tests para validación de contraseñas"""

    def test_valid_password(self):
        """Test que acepta una contraseña válida"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": UserRole.FISCAL,
            "password": "ValidPass123!@#"
        }

        user = UserCreate(**user_data)
        assert user.password == "ValidPass123!@#"

    def test_password_too_short(self):
        """Test que rechaza contraseñas cortas"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": UserRole.FISCAL,
            "password": "Short1!"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        assert "8 caracteres" in str(exc_info.value)

    def test_password_no_uppercase(self):
        """Test que rechaza contraseñas sin mayúsculas"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": UserRole.FISCAL,
            "password": "lowercase123!@#"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        assert "mayúscula" in str(exc_info.value)

    def test_password_no_lowercase(self):
        """Test que rechaza contraseñas sin minúsculas"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": UserRole.FISCAL,
            "password": "UPPERCASE123!@#"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        assert "minúscula" in str(exc_info.value)

    def test_password_no_number(self):
        """Test que rechaza contraseñas sin números"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": UserRole.FISCAL,
            "password": "NoNumbers!@#"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        assert "número" in str(exc_info.value)

    def test_password_no_special_char(self):
        """Test que rechaza contraseñas sin caracteres especiales"""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": UserRole.FISCAL,
            "password": "NoSpecial123"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        assert "carácter especial" in str(exc_info.value)


class TestUsernameValidation:
    """Tests para validación de usernames"""

    def test_valid_username(self):
        """Test que acepta un username válido"""
        user_data = {
            "username": "valid_user123",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": UserRole.FISCAL,
            "password": "ValidPass123!@#"
        }

        user = UserCreate(**user_data)
        assert user.username == "valid_user123"

    def test_username_too_short(self):
        """Test que rechaza usernames muy cortos"""
        user_data = {
            "username": "ab",
            "email": "test@example.com",
            "full_name": "Test User",
            "role": UserRole.FISCAL,
            "password": "ValidPass123!@#"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        assert "3 caracteres" in str(exc_info.value)

    def test_username_too_long(self):
        """Test que rechaza usernames muy largos"""
        user_data = {
            "username": "a" * 51,  # 51 caracteres
            "email": "test@example.com",
            "full_name": "Test User",
            "role": UserRole.FISCAL,
            "password": "ValidPass123!@#"
        }

        with pytest.raises(ValidationError) as exc_info:
            UserCreate(**user_data)

        assert "50 caracteres" in str(exc_info.value)

    def test_username_invalid_characters(self):
        """Test que rechaza usernames con caracteres inválidos"""
        invalid_usernames = [
            "user@name",
            "user name",
            "user#name",
            "user$name"
        ]

        for username in invalid_usernames:
            user_data = {
                "username": username,
                "email": "test@example.com",
                "full_name": "Test User",
                "role": UserRole.FISCAL,
                "password": "ValidPass123!@#"
            }

            with pytest.raises(ValidationError):
                UserCreate(**user_data)


class TestUserUpdate:
    """Tests para UserUpdate schema"""

    def test_optional_password_validation(self):
        """Test que valida password en UserUpdate solo si se proporciona"""
        # Sin contraseña - debe ser válido
        update_data = {
            "full_name": "Updated Name"
        }
        user_update = UserUpdate(**update_data)
        assert user_update.password is None

        # Con contraseña válida
        update_data_with_password = {
            "full_name": "Updated Name",
            "password": "NewPass123!@#"
        }
        user_update = UserUpdate(**update_data_with_password)
        assert user_update.password == "NewPass123!@#"

        # Con contraseña inválida
        update_data_invalid_password = {
            "full_name": "Updated Name",
            "password": "weak"
        }
        with pytest.raises(ValidationError):
            UserUpdate(**update_data_invalid_password)
