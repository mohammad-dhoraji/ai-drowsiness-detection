from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from supabase import Client

logger = logging.getLogger(__name__)
REPEATED_DROWSINESS_THRESHOLD = 2
REPEATED_DROWSINESS_MESSAGE = "Driver showing repeated drowsiness"


def normalize_session_id(session_id: Optional[str]) -> Optional[str]:
    if session_id is None:
        return None

    normalized = session_id.strip()
    if not normalized:
        return None

    try:
        return str(UUID(normalized))
    except ValueError:
        logger.warning("Ignoring invalid session_id '%s'; expected UUID format", normalized)
        return None


def ensure_session_for_driver(
    supabase: Client,
    *,
    driver_id: str,
    session_id: Optional[str],
) -> Optional[str]:
    normalized_session_id = normalize_session_id(session_id)
    if normalized_session_id is None:
        return None

    existing = (
        supabase.table("sessions")
        .select("id,driver_id")
        .eq("id", normalized_session_id)
        .limit(1)
        .execute()
    )

    if existing.data:
        session_driver_id = existing.data[0].get("driver_id")
        if session_driver_id != driver_id:
            logger.warning(
                "Ignoring session_id '%s' for driver '%s' because it belongs to '%s'",
                normalized_session_id,
                driver_id,
                session_driver_id,
            )
            return None
        return normalized_session_id

    created = (
        supabase.table("sessions")
        .insert(
            {
                "id": normalized_session_id,
                "driver_id": driver_id,
                "status": "ACTIVE",
            }
        )
        .execute()
    )

    if not created.data:
        logger.error(
            "Failed to create session '%s' for driver '%s'",
            normalized_session_id,
            driver_id,
        )
        return None

    return normalized_session_id


def insert_drowsiness_event(
    supabase: Client,
    *,
    driver_id: str,
    ear_value: float,
    duration_seconds: float,
    severity: str,
    session_id: Optional[str],
) -> dict:
    event_session_id = ensure_session_for_driver(
        supabase,
        driver_id=driver_id,
        session_id=session_id,
    )

    payload = {
        "driver_id": driver_id,
        "ear_value": ear_value,
        "duration_seconds": duration_seconds,
        "severity": severity,
    }
    if event_session_id is not None:
        payload["session_id"] = event_session_id

    inserted = supabase.table("drowsiness_events").insert(payload).execute()
    if not inserted.data:
        raise RuntimeError("Supabase insert returned no rows for drowsiness event")

    inserted_event = inserted.data[0]

    _create_guardian_notifications_for_repeated_events(
        supabase,
        driver_id=driver_id,
        session_id=inserted_event.get("session_id"),
        severity=inserted_event.get("severity") or severity,
    )

    return inserted_event


def _create_guardian_notifications_for_repeated_events(
    supabase: Client,
    *,
    driver_id: str,
    session_id: Optional[str],
    severity: str,
) -> None:
    normalized_session_id = normalize_session_id(session_id)
    if normalized_session_id is None:
        return

    count_result = (
        supabase.table("drowsiness_events")
        .select("id", count="exact")
        .eq("driver_id", driver_id)
        .eq("session_id", normalized_session_id)
        .execute()
    )
    event_count = count_result.count if count_result.count is not None else len(count_result.data or [])
    if event_count < REPEATED_DROWSINESS_THRESHOLD:
        return

    guardian_links = (
        supabase.table("driver_guardians")
        .select("guardian_id")
        .eq("driver_id", driver_id)
        .execute()
    )
    guardian_ids = sorted({row.get("guardian_id") for row in (guardian_links.data or []) if row.get("guardian_id")})
    if not guardian_ids:
        return

    existing_notifications = (
        supabase.table("guardian_notifications")
        .select("guardian_id")
        .eq("driver_id", driver_id)
        .eq("session_id", normalized_session_id)
        .eq("message", REPEATED_DROWSINESS_MESSAGE)
        .execute()
    )
    already_notified = {
        row.get("guardian_id")
        for row in (existing_notifications.data or [])
        if row.get("guardian_id")
    }

    to_insert = [
        {
            "driver_id": driver_id,
            "guardian_id": guardian_id,
            "session_id": normalized_session_id,
            "message": REPEATED_DROWSINESS_MESSAGE,
            "severity": severity,
            "is_read": False,
        }
        for guardian_id in guardian_ids
        if guardian_id not in already_notified
    ]
    if not to_insert:
        return

    supabase.table("guardian_notifications").insert(to_insert).execute()
