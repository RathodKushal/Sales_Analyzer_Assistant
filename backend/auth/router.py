"""
Auth Router — Registration & Login Endpoints
===============================================
Handles user creation, login (JWT issuance), and profile retrieval.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.auth.models import User
from backend.auth.schemas import UserRegister, UserLogin, UserResponse, TokenResponse
from backend.auth.utils import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Create a new user account.
    """
    uname_clean = payload.username.strip()
    email_clean = payload.email.strip().lower()

    # Check for duplicate username
    if db.query(User).filter(func.lower(User.username) == uname_clean.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{uname_clean}' is already taken",
        )

    # Check for duplicate email
    if db.query(User).filter(func.lower(User.email) == email_clean).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{email_clean}' is already registered",
        )

    # Create the user
    user = User(
        username=uname_clean,
        email=email_clean,
        hashed_password=hash_password(payload.password),
        role=payload.role or "viewer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive JWT token",
)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with username and password.
    Supports case-insensitive matching for username or email.
    Returns a JWT access token valid for 24 hours.
    """
    uname_lower = payload.username.strip().lower()
    user = db.query(User).filter(
        (func.lower(User.username) == uname_lower) |
        (func.lower(User.email) == uname_lower)
    ).first()

    is_valid = False
    if user:
        if verify_password(payload.password, user.hashed_password):
            is_valid = True
        elif verify_password(payload.password.lower(), user.hashed_password):
            is_valid = True

    if not user or not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not getattr(user, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact an administrator.",
        )

    # Update last login timestamp
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    # Issue JWT
    token = create_access_token(data={"sub": user.username, "role": user.role})

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_profile(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return current_user
