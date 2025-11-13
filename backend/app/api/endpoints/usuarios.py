"""
Router de Usuarios
"""
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone

from ...core.database import get_session
from ...core.security import get_password_hash
from ...core.sorting import sort_validator, SortValidator
from ...models.user import User, UserRole
from ...schemas.user import UserCreate, UserUpdate, UserResponse
from ...api.deps.auth import get_current_active_user, RoleChecker

router = APIRouter()

require_admin = RoleChecker([UserRole.ADMIN])


@router.get("/", response_model=List[UserResponse])
async def list_users(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)],
    skip: int = 0,
    limit: int = 100
):
    """Lista todos los usuarios (solo admin)"""
    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Obtiene un usuario por ID (solo admin)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Crea un nuevo usuario (solo admin)"""
    # Verificar que el username no exista
    existing = session.exec(select(User).where(User.username == user_data.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Verificar que el email no exista
    existing = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Crear usuario con contraseña hasheada
    user_dict = user_data.model_dump(exclude={'password'})
    user = User(
        **user_dict,
        hashed_password=get_password_hash(user_data.password)
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Actualiza un usuario (solo admin)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_dict = user_data.model_dump(exclude_unset=True, exclude={'password'})

    # Si se proporciona una nueva contraseña, hashearla
    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)

    # Actualizar otros campos
    for key, value in update_dict.items():
        setattr(user, key, value)

    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """Elimina un usuario (solo admin)"""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # No permitir eliminar al usuario actual
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own user")

    session.delete(user)
    session.commit()
    return None


@router.get("/search/advanced", response_model=dict)
async def search_users_advanced(
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(require_admin)],
    # Paginación
    page: int = 1,
    page_size: int = 10,
    # Búsqueda
    search: str | None = None,
    # Filtros
    role: UserRole | None = None,
    is_active: bool | None = None,
    # Ordenamiento
    sort_by: str = "created_at",
    sort_order: str = "desc"
):
    """
    Búsqueda avanzada de usuarios con filtros múltiples, paginación y ordenamiento
    """
    from sqlmodel import or_, and_, func, col

    # Construir query base
    statement = select(User)

    # Aplicar búsqueda
    if search:
        search_pattern = f"%{search}%"
        statement = statement.where(
            or_(
                User.username.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern)
            )
        )

    # Aplicar filtros
    if role:
        statement = statement.where(User.role == role)

    if is_active is not None:
        statement = statement.where(User.is_active == is_active)

    # Contar total de resultados (antes de paginación)
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()

    # Validar campos de ordenamiento
    sort_by = sort_validator.validate_sort_field(
        sort_by,
        SortValidator.USER_SORT_FIELDS,
        "User"
    )
    sort_order = sort_validator.validate_sort_order(sort_order)

    # Aplicar ordenamiento
    if sort_order == "desc":
        statement = statement.order_by(col(getattr(User, sort_by)).desc())
    else:
        statement = statement.order_by(col(getattr(User, sort_by)).asc())

    # Aplicar paginación
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    # Ejecutar query
    users = session.exec(statement).all()

    # Calcular total de páginas
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }
