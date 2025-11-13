"""
Validadores de ordenamiento para endpoints de búsqueda avanzada
"""
from fastapi import HTTPException, status
from typing import List, Set


class SortValidator:
    """Valida campos de ordenamiento para prevenir inyección y errores"""

    # Campos permitidos para ordenamiento en Solicitudes
    SOLICITUD_SORT_FIELDS: Set[str] = {
        'id',
        'numero_caso',
        'nombre_evaluado',
        'edad_evaluado',
        'estado',
        'fecha_solicitud',
        'created_at',
        'updated_at',
        'despacho_fiscal_id',
        'solicitante_id'
    }

    # Campos permitidos para ordenamiento en Usuarios
    USER_SORT_FIELDS: Set[str] = {
        'id',
        'username',
        'email',
        'full_name',
        'role',
        'is_active',
        'created_at',
        'updated_at'
    }

    # Campos permitidos para ordenamiento en Programaciones
    PROGRAMACION_SORT_FIELDS: Set[str] = {
        'id',
        'fecha_hora',
        'duracion_minutos',
        'estado',
        'created_at',
        'updated_at',
        'solicitud_id',
        'sala_id',
        'perito_id'
    }

    @staticmethod
    def validate_sort_field(field: str, allowed_fields: Set[str], entity_name: str = "Entity") -> str:
        """
        Valida que el campo de ordenamiento sea permitido

        Args:
            field: Campo a validar
            allowed_fields: Set de campos permitidos
            entity_name: Nombre de la entidad para mensajes de error

        Returns:
            El campo validado

        Raises:
            HTTPException: Si el campo no es válido
        """
        if field not in allowed_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sort field '{field}' for {entity_name}. "
                       f"Allowed fields: {', '.join(sorted(allowed_fields))}"
            )
        return field

    @staticmethod
    def validate_sort_order(order: str) -> str:
        """
        Valida que el orden sea 'asc' o 'desc'

        Args:
            order: Orden a validar

        Returns:
            El orden validado en lowercase

        Raises:
            HTTPException: Si el orden no es válido
        """
        order_lower = order.lower()
        if order_lower not in ['asc', 'desc']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid sort order '{order}'. Must be 'asc' or 'desc'"
            )
        return order_lower


# Instancia global para facilitar el uso
sort_validator = SortValidator()
