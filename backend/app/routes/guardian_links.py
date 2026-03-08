from fastapi import APIRouter, Depends, HTTPException, status

from app.routes.auth import TokenData, get_current_user
from app.schemas import (
    LinkGuardianRequest,
    LinkGuardianResponse,
    MyDriversResponse,
    MyGuardiansResponse,
)
from app.services.guardian_link_service import (
    create_driver_guardian_link,
    get_drivers_for_guardian,
    get_guardians_for_driver,
)
from app.services.profile_service import (
    ensure_current_user_profile,
    find_or_create_profile_by_email,
)
from app.supabase_client import get_supabase_client

router = APIRouter(tags=["Guardian Linking"])


@router.post("/link-guardian", response_model=LinkGuardianResponse, status_code=status.HTTP_201_CREATED)
async def link_guardian(
    payload: LinkGuardianRequest,
    current_user: TokenData = Depends(get_current_user),
):
    supabase = get_supabase_client()
    driver_profile = ensure_current_user_profile(
        supabase,
        user_id=current_user.user_id,
        email=current_user.email,
        token_role=current_user.role,
        token_name=current_user.name,
    )

    if driver_profile["role"] != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role not allowed",
        )

    if driver_profile["email"].lower() == payload.guardian_email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User trying to link themselves",
        )

    guardian_profile = find_or_create_profile_by_email(
        supabase,
        email=payload.guardian_email,
        expected_role="guardian",
    )
    if guardian_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guardian email not found",
        )

    if guardian_profile["id"] == driver_profile["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User trying to link themselves",
        )

    link = create_driver_guardian_link(
        supabase,
        driver_id=driver_profile["id"],
        guardian_id=guardian_profile["id"],
    )

    return LinkGuardianResponse(
        message="Guardian linked successfully",
        link_id=link["id"],
        guardian={
            "id": guardian_profile["id"],
            "name": guardian_profile.get("name"),
            "email": guardian_profile["email"],
            "linked_at": link.get("created_at"),
        },
    )


@router.get("/my-guardians", response_model=MyGuardiansResponse, status_code=status.HTTP_200_OK)
async def my_guardians(
    current_user: TokenData = Depends(get_current_user),
):
    supabase = get_supabase_client()
    driver_profile = ensure_current_user_profile(
        supabase,
        user_id=current_user.user_id,
        email=current_user.email,
        token_role=current_user.role,
        token_name=current_user.name,
    )

    if driver_profile["role"] != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role not allowed",
        )

    guardians = get_guardians_for_driver(supabase, driver_id=driver_profile["id"])
    return MyGuardiansResponse(guardians=guardians)


@router.get("/my-drivers", response_model=MyDriversResponse, status_code=status.HTTP_200_OK)
async def my_drivers(
    current_user: TokenData = Depends(get_current_user),
):
    supabase = get_supabase_client()
    guardian_profile = ensure_current_user_profile(
        supabase,
        user_id=current_user.user_id,
        email=current_user.email,
        token_role=current_user.role,
        token_name=current_user.name,
    )

    if guardian_profile["role"] != "guardian":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role not allowed",
        )

    drivers = get_drivers_for_guardian(supabase, guardian_id=guardian_profile["id"])
    return MyDriversResponse(drivers=drivers)
