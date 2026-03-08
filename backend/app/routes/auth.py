"""
Authentication routes and JWT verification backed by Supabase Auth.
"""

import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from supabase import create_client

from app.services.profile_service import ensure_current_user_profile
from app.supabase_client import get_supabase_client as get_db_supabase_client

logger = logging.getLogger(__name__)

_supabase_client = None


def get_supabase_client():
    global _supabase_client

    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment")

        _supabase_client = create_client(supabase_url, supabase_key)

    return _supabase_client


security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["Authentication"])


class TokenData(BaseModel):
    user_id: str
    email: str
    role: Optional[str] = None
    name: Optional[str] = None


class UserResponse(BaseModel):
    user_id: str
    email: str
    role: Optional[str]
    name: Optional[str] = None


def _normalized_role(raw_role: Optional[str]) -> Optional[str]:
    if not raw_role or not isinstance(raw_role, str):
        return None

    role = raw_role.strip().lower()
    if role in {"driver", "guardian"}:
        return role
    return None


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> TokenData:
    token = credentials.credentials

    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = user_response.user
        user_metadata = user.user_metadata or {}

        return TokenData(
            user_id=user.id,
            email=user.email or "",
            role=_normalized_role(user_metadata.get("role")),
            name=user_metadata.get("full_name") or user_metadata.get("name"),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Token verification error: %s", str(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


async def get_current_user(
    user: TokenData = Depends(verify_token),
) -> TokenData:
    return user


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    user: TokenData = Depends(verify_token),
):
    db_client = get_db_supabase_client()
    profile = ensure_current_user_profile(
        db_client,
        user_id=user.user_id,
        email=user.email,
        token_role=user.role,
        token_name=user.name,
    )

    return UserResponse(
        user_id=user.user_id,
        email=profile["email"],
        role=profile["role"],
        name=profile.get("name"),
    )


@router.get("/health")
async def auth_health_check():
    return {
        "status": "ok",
        "service": "auth",
    }


@router.get("/protected")
async def protected_route(
    user: TokenData = Depends(verify_token),
):
    return {
        "message": "Access granted",
        "user_id": user.user_id,
        "email": user.email,
    }
