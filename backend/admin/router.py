"""
Admin Router — Administrative Endpoints
=======================================
Endpoints for system-wide metrics, user & role management, and platform settings.
Guarded strictly with require_admin.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.auth.models import User
from backend.auth.utils import require_admin, hash_password
from backend.admin.service import AdminService
from backend.admin.schemas import (
    AdminUserCreate,
    AdminUserUpdate,
    AdminPasswordReset,
    UserAdminView,
    UserListResponse,
    SystemMetricsResponse,
    SettingItem,
    SettingsUpdateRequest,
)

router = APIRouter(prefix="/api/admin", tags=["Administration"])


# ── System Telemetry & Metrics ───────────────────────────────

@router.get(
    "/metrics",
    response_model=SystemMetricsResponse,
    summary="Get system-wide metrics and health telemetry",
)
def get_metrics(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Return active user counts, business records volume, and server health telemetry."""
    return AdminService.get_system_metrics(db)


# ── User & Role Management ───────────────────────────────────

@router.get(
    "/users",
    response_model=UserListResponse,
    summary="List all users with optional filters",
)
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="Filter by username or email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Retrieve users with pagination, role filtering, and search."""
    query = db.query(User)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_pattern)) | (User.email.ilike(search_pattern))
        )

    if role and role != "all":
        query = query.filter(User.role == role)

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    users = query.order_by(User.id.asc()).offset(skip).limit(limit).all()

    return UserListResponse(
        total=total,
        users=[UserAdminView.model_validate(u) for u in users],
    )


@router.post(
    "/users",
    response_model=UserAdminView,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user with specific role",
)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Create a user directly from the admin panel."""
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{payload.username}' is already in use.",
        )

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Email '{payload.email}' is already registered.",
        )

    new_user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserAdminView.model_validate(new_user)


@router.put(
    "/users/{user_id}",
    response_model=UserAdminView,
    summary="Update user role or active status",
)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Update user email, role, or toggle active status."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User #{user_id} not found.",
        )

    # Safeguard against self-lockout
    if target_user.id == admin.id:
        if payload.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own active admin account.",
            )
        if payload.role and payload.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot revoke your own administrator role.",
            )

    if payload.email and payload.email != target_user.email:
        # Check duplicate email
        duplicate = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{payload.email}' is already taken by another user.",
            )
        target_user.email = payload.email

    if payload.role:
        target_user.role = payload.role

    if payload.is_active is not None:
        target_user.is_active = payload.is_active

    db.commit()
    db.refresh(target_user)

    return UserAdminView.model_validate(target_user)


@router.put(
    "/users/{user_id}/reset-password",
    summary="Reset user password",
)
def reset_password(
    user_id: int,
    payload: AdminPasswordReset,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Admin-initiated password reset."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User #{user_id} not found.",
        )

    target_user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {"message": f"Password for user '{target_user.username}' has been updated."}


@router.delete(
    "/users/{user_id}",
    summary="Delete a user account",
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete a user account with safeguard against self-deletion."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User #{user_id} not found.",
        )

    if target_user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own administrator account.",
        )

    db.delete(target_user)
    db.commit()

    return {"message": f"User '{target_user.username}' was deleted.", "id": user_id}


# ── Platform Settings Management ─────────────────────────────

@router.get(
    "/settings",
    response_model=List[SettingItem],
    summary="Get all platform settings",
)
def get_settings_list(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List all configurable platform parameters."""
    return AdminService.get_all_settings(db)


@router.put(
    "/settings",
    response_model=List[SettingItem],
    summary="Update platform settings",
)
def update_settings(
    payload: SettingsUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Batch update platform parameters."""
    return AdminService.update_settings(db, payload.settings)


@router.post(
    "/settings/reset",
    response_model=List[SettingItem],
    summary="Reset platform settings to factory default",
)
def reset_settings(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Reset system settings to hardcoded default values."""
    return AdminService.reset_settings_to_default(db)
