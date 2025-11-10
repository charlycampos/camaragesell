"""
Dependencies de autenticación
"""
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlmodel import Session, select

from ...core.config import settings
from ...core.database import get_session
from ...models.user import User, UserRole
from ...schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[Session, Depends(get_session)]
) -> User:
    """
    Obtiene el usuario actual desde el token JWT
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    statement = select(User).where(User.username == token_data.username)
    user = session.exec(statement).first()

    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Verifica que el usuario actual esté activo
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


class RoleChecker:
    """
    Dependency para verificar roles de usuario
    """
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Annotated[User, Depends(get_current_active_user)]) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this user role"
            )
        return user


# Dependencies predefinidos para cada rol
require_admin = Depends(RoleChecker([UserRole.ADMIN]))
require_asistente = Depends(RoleChecker([UserRole.ADMIN, UserRole.ASISTENTE_ADMINISTRATIVO]))
require_perito = Depends(RoleChecker([UserRole.ADMIN, UserRole.PERITO]))
require_fiscal = Depends(RoleChecker([UserRole.ADMIN, UserRole.FISCAL]))
