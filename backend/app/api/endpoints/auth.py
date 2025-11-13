"""
Router de Autenticación
"""
from typing import Annotated
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from slowapi import Limiter
from slowapi.util import get_remote_address

from ...core.config import settings
from ...core.database import get_session
from ...core.security import verify_password, create_access_token
from ...core.logging_config import logger, log_authentication
from ...models.user import User
from ...schemas.auth import Token
from ...api.deps.auth import get_current_active_user
from ...schemas.user import UserResponse

router = APIRouter()

# Configurar limiter para este router
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")  # Máximo 5 intentos de login por minuto por IP
async def login(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[Session, Depends(get_session)]
):
    """
    Endpoint de login - Establece token JWT en cookie httpOnly
    """
    from fastapi.responses import JSONResponse

    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        log_authentication(form_data.username, success=False, reason="Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        log_authentication(user.username, success=False, reason="Inactive user")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )

    # Crear respuesta con cookie httpOnly
    response = JSONResponse(
        content={"access_token": access_token, "token_type": "bearer"}
    )

    # Establecer cookie segura con el token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # No accesible desde JavaScript (protección XSS)
        secure=not settings.DEBUG_MODE,  # HTTPS en producción
        samesite="lax",  # Protección CSRF
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # En segundos
        path="/"
    )

    # Log autenticación exitosa
    log_authentication(user.username, success=True)

    return response


@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Obtiene información del usuario actual
    """
    return current_user


@router.post("/logout")
async def logout():
    """
    Endpoint de logout - Limpia la cookie del token
    """
    from fastapi.responses import JSONResponse

    response = JSONResponse(
        content={"message": "Logout successful"}
    )

    # Eliminar la cookie estableciendo max_age=0
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        samesite="lax"
    )

    return response
