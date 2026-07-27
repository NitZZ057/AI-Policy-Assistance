import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.database import get_db_session
from app.core.security import generate_plain_token, hash_password, hash_token, verify_password
from app.models.user import User
from app.schemas.user import (
    AuthResponse,
    LoginRequest,
    MeResponse,
    MessageResponse,
    RegisterRequest,
)

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    existing = await session.scalar(select(User).where(User.email == payload.email))

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A user with this email already exists.",
        )

    plain_token = generate_plain_token()
    user = User(
        name=payload.name,
        email=str(payload.email),
        password=hash_password(payload.password),
        api_token=hash_token(plain_token),
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return AuthResponse(token=plain_token, user=user)


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    user = await session.scalar(select(User).where(User.email == payload.email))

    if user is None or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    plain_token = generate_plain_token()
    user.api_token = hash_token(plain_token)

    await session.commit()
    await session.refresh(user)

    return AuthResponse(token=plain_token, user=user)


@router.post("/guest", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def guest_login(session: AsyncSession = Depends(get_db_session)) -> AuthResponse:
    """Create a throwaway guest account so reviewers can try the app in one click.

    Each call provisions its own user row, so guest sessions never share history or
    invalidate each other's token. The password is random and never handed out, which
    keeps /login unusable for guest accounts.
    """
    settings = get_settings()

    if not settings.guest_login_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest access is disabled.",
        )

    suffix = secrets.token_hex(8)
    plain_token = generate_plain_token()
    user = User(
        name="Guest Reviewer",
        email=f"guest-{suffix}@{settings.guest_email_domain}",
        password=hash_password(secrets.token_urlsafe(32)),
        api_token=hash_token(plain_token),
        is_guest=True,
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return AuthResponse(token=plain_token, user=user)


@router.get("/me", response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse(user=current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> MessageResponse:
    current_user.api_token = None
    await session.commit()

    return MessageResponse(message="Logged out successfully.")
