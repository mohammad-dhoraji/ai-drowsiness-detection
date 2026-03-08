from __future__ import annotations

from fastapi import HTTPException, status
from postgrest.exceptions import APIError
from supabase import Client


def create_driver_guardian_link(supabase: Client, *, driver_id: str, guardian_id: str) -> dict:
    existing = (
        supabase.table("driver_guardians")
        .select("id,driver_id,guardian_id,created_at")
        .eq("driver_id", driver_id)
        .eq("guardian_id", guardian_id)
        .limit(1)
        .execute()
    )

    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate guardian link",
        )

    try:
        inserted = (
            supabase.table("driver_guardians")
            .insert(
                {
                    "driver_id": driver_id,
                    "guardian_id": guardian_id,
                }
            )
            .execute()
        )
    except APIError as exc:
        if (exc.code == "23505") or ("duplicate" in (exc.message or "").lower()):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate guardian link",
            ) from exc
        raise

    if not inserted.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create guardian link",
        )

    return inserted.data[0]


def get_guardians_for_driver(supabase: Client, *, driver_id: str) -> list[dict]:
    links_result = (
        supabase.table("driver_guardians")
        .select("guardian_id,created_at")
        .eq("driver_id", driver_id)
        .order("created_at", desc=True)
        .execute()
    )
    links = links_result.data or []
    if not links:
        return []

    guardian_ids = list({row["guardian_id"] for row in links})
    guardians_result = (
        supabase.table("profiles")
        .select("id,name,email")
        .in_("id", guardian_ids)
        .execute()
    )
    guardians = guardians_result.data or []
    guardian_by_id = {guardian["id"]: guardian for guardian in guardians}

    return [
        {
            "id": row["guardian_id"],
            "name": guardian_by_id.get(row["guardian_id"], {}).get("name"),
            "email": guardian_by_id.get(row["guardian_id"], {}).get("email", ""),
            "linked_at": row.get("created_at"),
        }
        for row in links
        if row["guardian_id"] in guardian_by_id
    ]


def get_drivers_for_guardian(supabase: Client, *, guardian_id: str) -> list[dict]:
    links_result = (
        supabase.table("driver_guardians")
        .select("driver_id,created_at")
        .eq("guardian_id", guardian_id)
        .order("created_at", desc=True)
        .execute()
    )
    links = links_result.data or []
    if not links:
        return []

    driver_ids = list({row["driver_id"] for row in links})
    drivers_result = (
        supabase.table("profiles")
        .select("id,name,email")
        .in_("id", driver_ids)
        .execute()
    )
    drivers = drivers_result.data or []
    driver_by_id = {driver["id"]: driver for driver in drivers}

    return [
        {
            "id": row["driver_id"],
            "name": driver_by_id.get(row["driver_id"], {}).get("name"),
            "email": driver_by_id.get(row["driver_id"], {}).get("email", ""),
            "linked_at": row.get("created_at"),
        }
        for row in links
        if row["driver_id"] in driver_by_id
    ]
