from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status
from supabase import Client


VALID_ROLES = {"driver", "guardian"}


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_role(role: Optional[str]) -> Optional[str]:
    if not role or not isinstance(role, str):
        return None

    normalized = role.strip().lower()
    if normalized in VALID_ROLES:
        return normalized
    return None


def _fallback_name(email: str) -> str:
    return normalize_email(email).split("@", 1)[0]


def get_profile_by_id(supabase: Client, profile_id: str) -> Optional[dict]:
    response = (
        supabase.table("profiles")
        .select("id,name,email,role,created_at")
        .eq("id", profile_id)
        .limit(1)
        .execute()
    )

    if not response.data:
        return None
    return response.data[0]


def get_profile_by_email(supabase: Client, email: str) -> Optional[dict]:
    response = (
        supabase.table("profiles")
        .select("id,name,email,role,created_at")
        .eq("email", normalize_email(email))
        .limit(1)
        .execute()
    )

    if not response.data:
        return None
    return response.data[0]


def _insert_profile(
    supabase: Client,
    *,
    user_id: str,
    email: str,
    role: str,
    name: Optional[str] = None,
) -> dict:
    payload = {
        "id": user_id,
        "name": (name or "").strip() or _fallback_name(email),
        "email": normalize_email(email),
        "role": role,
    }

    insert_response = supabase.table("profiles").insert(payload).execute()
    if insert_response.data:
        return insert_response.data[0]

    profile = get_profile_by_id(supabase, user_id)
    if profile:
        return profile

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to create profile",
    )


def ensure_current_user_profile(
    supabase: Client,
    *,
    user_id: str,
    email: str,
    token_role: Optional[str],
    token_name: Optional[str] = None,
) -> dict:
    profile = get_profile_by_id(supabase, user_id)
    if profile:
        return profile

    role = normalize_role(token_role)
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role not allowed",
        )

    return _insert_profile(
        supabase,
        user_id=user_id,
        email=email,
        role=role,
        name=token_name,
    )


def find_or_create_profile_by_email(
    supabase: Client,
    *,
    email: str,
    expected_role: Optional[str] = None,
) -> Optional[dict]:
    normalized_email = normalize_email(email)
    expected = normalize_role(expected_role) if expected_role else None

    profile = get_profile_by_email(supabase, normalized_email)
    if profile:
        if expected and profile["role"] != expected:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User is not registered as {expected}",
            )
        return profile

    auth_user = _find_auth_user_by_email(supabase, normalized_email)
    if auth_user is None:
        return None

    auth_role = normalize_role((auth_user.user_metadata or {}).get("role"))
    if expected and auth_role != expected:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User is not registered as {expected}",
        )
    if auth_role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target user has no valid role",
        )

    auth_name = (auth_user.user_metadata or {}).get("full_name") or (auth_user.user_metadata or {}).get("name")
    return _insert_profile(
        supabase,
        user_id=auth_user.id,
        email=auth_user.email or normalized_email,
        role=auth_role,
        name=auth_name if isinstance(auth_name, str) else None,
    )


def _find_auth_user_by_email(supabase: Client, email: str):
    page = 1
    per_page = 200

    while True:
        users = supabase.auth.admin.list_users(page=page, per_page=per_page)
        if not users:
            return None

        for user in users:
            if (user.email or "").strip().lower() == email:
                return user

        if len(users) < per_page:
            return None

        page += 1
