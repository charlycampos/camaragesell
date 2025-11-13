"""
Tests para validadores de ordenamiento
"""
import pytest
from fastapi import HTTPException
from app.core.sorting import SortValidator


class TestSortFieldValidation:
    """Tests para validación de campos de ordenamiento"""

    def test_valid_solicitud_sort_field(self):
        """Test que acepta campos válidos para Solicitud"""
        valid_fields = [
            'id', 'numero_caso', 'nombre_evaluado', 'estado',
            'fecha_solicitud', 'created_at', 'updated_at'
        ]

        for field in valid_fields:
            result = SortValidator.validate_sort_field(
                field,
                SortValidator.SOLICITUD_SORT_FIELDS,
                "Solicitud"
            )
            assert result == field

    def test_invalid_solicitud_sort_field(self):
        """Test que rechaza campos inválidos para Solicitud"""
        invalid_fields = ['invalid_field', 'sql_injection', 'password', '__dict__']

        for field in invalid_fields:
            with pytest.raises(HTTPException) as exc_info:
                SortValidator.validate_sort_field(
                    field,
                    SortValidator.SOLICITUD_SORT_FIELDS,
                    "Solicitud"
                )

            assert exc_info.value.status_code == 400
            assert field in exc_info.value.detail

    def test_valid_user_sort_field(self):
        """Test que acepta campos válidos para User"""
        valid_fields = [
            'id', 'username', 'email', 'full_name',
            'role', 'is_active', 'created_at'
        ]

        for field in valid_fields:
            result = SortValidator.validate_sort_field(
                field,
                SortValidator.USER_SORT_FIELDS,
                "User"
            )
            assert result == field

    def test_invalid_user_sort_field(self):
        """Test que rechaza campos inválidos para User"""
        invalid_fields = ['hashed_password', 'admin_secret', 'DROP TABLE']

        for field in invalid_fields:
            with pytest.raises(HTTPException) as exc_info:
                SortValidator.validate_sort_field(
                    field,
                    SortValidator.USER_SORT_FIELDS,
                    "User"
                )

            assert exc_info.value.status_code == 400


class TestSortOrderValidation:
    """Tests para validación de orden de ordenamiento"""

    def test_valid_sort_order_asc(self):
        """Test que acepta 'asc' en cualquier capitalización"""
        valid_orders = ['asc', 'ASC', 'Asc', 'aSc']

        for order in valid_orders:
            result = SortValidator.validate_sort_order(order)
            assert result == 'asc'

    def test_valid_sort_order_desc(self):
        """Test que acepta 'desc' en cualquier capitalización"""
        valid_orders = ['desc', 'DESC', 'Desc', 'dEsC']

        for order in valid_orders:
            result = SortValidator.validate_sort_order(order)
            assert result == 'desc'

    def test_invalid_sort_order(self):
        """Test que rechaza órdenes inválidos"""
        invalid_orders = ['ascending', 'descending', '1', 'true', 'ASC OR 1=1']

        for order in invalid_orders:
            with pytest.raises(HTTPException) as exc_info:
                SortValidator.validate_sort_order(order)

            assert exc_info.value.status_code == 400
            assert 'asc' in exc_info.value.detail.lower()
            assert 'desc' in exc_info.value.detail.lower()


class TestSortValidatorIntegration:
    """Tests de integración para el validador de ordenamiento"""

    def test_prevents_sql_injection_attempts(self):
        """Test que previene intentos de inyección SQL"""
        sql_injection_attempts = [
            "id; DROP TABLE users--",
            "id' OR '1'='1",
            "id UNION SELECT * FROM users",
            "id; DELETE FROM users WHERE 1=1--"
        ]

        for injection in sql_injection_attempts:
            with pytest.raises(HTTPException):
                SortValidator.validate_sort_field(
                    injection,
                    SortValidator.USER_SORT_FIELDS,
                    "User"
                )

    def test_case_sensitivity(self):
        """Test que la validación de campos es case-sensitive"""
        # Los campos deben coincidir exactamente
        with pytest.raises(HTTPException):
            SortValidator.validate_sort_field(
                'USERNAME',  # Mayúsculas
                SortValidator.USER_SORT_FIELDS,
                "User"
            )

        # El campo correcto en minúsculas debe funcionar
        result = SortValidator.validate_sort_field(
            'username',
            SortValidator.USER_SORT_FIELDS,
            "User"
        )
        assert result == 'username'
