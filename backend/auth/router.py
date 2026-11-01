"""
Auth Router — Registration & Login Endpoints
===============================================
Handles user creation, login (JWT issuance), and profile retrieval.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
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
    
    - **username**: Unique, 3-50 characters
    - **email**: Unique email address
    - **password**: Minimum 6 characters (hashed with bcrypt)
    - **role**: `admin` or `viewer` (defaults to `viewer`)
    """
    # Check for duplicate username
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{payload.username}' is already taken",
        )

    # Check for duplicate email
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{payload.email}' is already registered",
        )

    # Create the user
    user = User(
        username=payload.username,
        email=payload.email,
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
    
    Returns a JWT access token valid for 24 hours.
    """
    user = db.query(User).filter(User.username == payload.username).first()

    if not user or not verify_password(payload.password, user.hashed_password):
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
