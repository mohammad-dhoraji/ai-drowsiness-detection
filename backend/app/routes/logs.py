"""
Logs Module
Provides driver event history and analytics APIs.
"""

from datetime import datetime, timedelta
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.routes.auth import TokenData, get_current_user
from app.services.drowsiness_event_service import insert_drowsiness_event, normalize_session_id
from app.services.profile_service import ensure_current_user_profile
from app.supabase_client import get_supabase_client

router = APIRouter(tags=["Logs"])
logger = logging.getLogger(__name__)


class DriverEvent(BaseModel):
    id: int
    ear_value: Optional[float] = None
    duration_seconds: Optional[float] = None
    severity: str
    session_id: Optional[str] = None
    created_at: str


class EventsResponse(BaseModel):
    events: List[DriverEvent]
    total: int
    page: int
    page_size: int


class EventSummary(BaseModel):
    total_events: int = Field(..., description="Total number of drowsiness events")
    high_severity_count: int = Field(..., description="Number of HIGH severity events")
    medium_severity_count: int = Field(..., description="Number of MEDIUM severity events")
    low_severity_count: int = Field(..., description="Number of LOW severity events")
    last_event_time: Optional[str] = Field(None, description="Timestamp of most recent event")
    avg_ear_value: Optional[float] = Field(None, description="Average EAR across all events")
    total_sessions: int = Field(..., description="Number of unique driving sessions")


class SessionInfo(BaseModel):
    session_id: str
    start_time: str
    end_time: Optional[str]
    event_count: int
    highest_severity: str


class DriverEventCreate(BaseModel):
    ear_value: float
    duration_seconds: float
    severity: str = Field(..., pattern="^(LOW|MEDIUM|HIGH)$")
    session_id: Optional[str] = None


class GuardianNotification(BaseModel):
    id: int
    driver_id: str
    guardian_id: str
    session_id: Optional[str] = None
    message: str
    severity: str
    is_read: bool
    created_at: str
    driver_name: Optional[str] = None
    driver_email: Optional[str] = None


class GuardianNotificationsResponse(BaseModel):
    notifications: List[GuardianNotification]
    total: int
    page: int
    page_size: int


def _validate_session_id_for_filter(session_id: Optional[str]) -> Optional[str]:
    normalized = normalize_session_id(session_id)
    if session_id and normalized is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="session_id must be a valid UUID",
        )
    return normalized


def _ensure_guardian_profile(supabase, current_user: TokenData) -> dict:
    profile = ensure_current_user_profile(
        supabase,
        user_id=current_user.user_id,
        email=current_user.email,
        token_role=current_user.role,
        token_name=current_user.name,
    )
    if profile.get("role") != "guardian":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role not allowed",
        )
    return profile


@router.get("/events", response_model=EventsResponse, status_code=status.HTTP_200_OK)
async def get_driver_events(
    current_user: TokenData = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    severity: Optional[str] = Query(None, pattern="^(LOW|MEDIUM|HIGH)$", description="Filter by severity"),
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    days: Optional[int] = Query(None, ge=1, le=365, description="Events from last N days"),
):
    try:
        supabase = get_supabase_client()
        normalized_session_id = _validate_session_id_for_filter(session_id)

        query = (
            supabase.table("drowsiness_events")
            .select("id,session_id,ear_value,duration_seconds,severity,created_at", count="exact")
            .eq("driver_id", current_user.user_id)
        )

        if severity:
            query = query.eq("severity", severity)
        if normalized_session_id:
            query = query.eq("session_id", normalized_session_id)
        if days:
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            query = query.gte("created_at", cutoff_date)

        offset = (page - 1) * page_size
        result = query.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()

        events = [DriverEvent(**event) for event in result.data]
        total = result.count if result.count is not None else len(result.data)

        return EventsResponse(
            events=events,
            total=total,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error fetching events for user %s: %s", current_user.user_id, str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve events",
        )


@router.get("/summary", response_model=EventSummary, status_code=status.HTTP_200_OK)
async def get_event_summary(
    current_user: TokenData = Depends(get_current_user),
    days: Optional[int] = Query(30, ge=1, le=365, description="Summarize last N days"),
):
    try:
        supabase = get_supabase_client()
        cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()

        result = (
            supabase.table("drowsiness_events")
            .select("session_id,ear_value,severity,created_at")
            .eq("driver_id", current_user.user_id)
            .gte("created_at", cutoff_date)
            .order("created_at", desc=True)
            .execute()
        )

        events = result.data or []
        if not events:
            return EventSummary(
                total_events=0,
                high_severity_count=0,
                medium_severity_count=0,
                low_severity_count=0,
                last_event_time=None,
                avg_ear_value=None,
                total_sessions=0,
            )

        high_count = len([e for e in events if e.get("severity") == "HIGH"])
        medium_count = len([e for e in events if e.get("severity") == "MEDIUM"])
        low_count = len([e for e in events if e.get("severity") == "LOW"])

        ear_values = [e["ear_value"] for e in events if e.get("ear_value") is not None]
        avg_ear = (sum(ear_values) / len(ear_values)) if ear_values else None

        unique_sessions = len({e["session_id"] for e in events if e.get("session_id")})
        last_event_time = events[0].get("created_at")

        return EventSummary(
            total_events=len(events),
            high_severity_count=high_count,
            medium_severity_count=medium_count,
            low_severity_count=low_count,
            last_event_time=last_event_time,
            avg_ear_value=round(avg_ear, 3) if avg_ear is not None else None,
            total_sessions=unique_sessions,
        )
    except Exception as e:
        logger.error("Error generating summary for user %s: %s", current_user.user_id, str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate event summary",
        )


@router.get("/sessions", response_model=List[SessionInfo], status_code=status.HTTP_200_OK)
async def get_user_sessions(
    current_user: TokenData = Depends(get_current_user),
    days: Optional[int] = Query(30, ge=1, le=365, description="Sessions from last N days"),
):
    try:
        supabase = get_supabase_client()
        cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()

        sessions_result = (
            supabase.table("sessions")
            .select("id,started_at,ended_at")
            .eq("driver_id", current_user.user_id)
            .gte("started_at", cutoff_date)
            .order("started_at", desc=True)
            .execute()
        )

        sessions_rows = sessions_result.data or []
        if not sessions_rows:
            return []

        session_ids = [row["id"] for row in sessions_rows]
        events_result = (
            supabase.table("drowsiness_events")
            .select("session_id,severity")
            .eq("driver_id", current_user.user_id)
            .in_("session_id", session_ids)
            .execute()
        )

        severity_priority = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
        summary_by_session: dict[str, dict] = {
            session_id: {"event_count": 0, "highest_severity": "LOW"}
            for session_id in session_ids
        }

        for event in events_result.data or []:
            session_key = event.get("session_id")
            if not session_key or session_key not in summary_by_session:
                continue

            summary_by_session[session_key]["event_count"] += 1

            event_severity = event.get("severity", "LOW")
            current_highest = summary_by_session[session_key]["highest_severity"]
            if severity_priority.get(event_severity, 0) > severity_priority.get(current_highest, 0):
                summary_by_session[session_key]["highest_severity"] = event_severity

        return [
            SessionInfo(
                session_id=row["id"],
                start_time=row["started_at"],
                end_time=row.get("ended_at"),
                event_count=summary_by_session[row["id"]]["event_count"],
                highest_severity=summary_by_session[row["id"]]["highest_severity"],
            )
            for row in sessions_rows
        ]
    except Exception as e:
        logger.error("Error fetching sessions for user %s: %s", current_user.user_id, str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sessions",
        )


@router.get(
    "/guardian-notifications",
    response_model=GuardianNotificationsResponse,
    status_code=status.HTTP_200_OK,
)
async def get_guardian_notifications(
    current_user: TokenData = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    unread_only: bool = Query(False, description="Show only unread notifications"),
    days: Optional[int] = Query(None, ge=1, le=365, description="Notifications from last N days"),
):
    try:
        supabase = get_supabase_client()
        guardian_profile = _ensure_guardian_profile(supabase, current_user)

        query = (
            supabase.table("guardian_notifications")
            .select(
                "id,driver_id,guardian_id,session_id,message,severity,is_read,created_at",
                count="exact",
            )
            .eq("guardian_id", guardian_profile["id"])
        )

        if unread_only:
            query = query.eq("is_read", False)
        if days:
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            query = query.gte("created_at", cutoff_date)

        offset = (page - 1) * page_size
        result = query.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
        notifications = result.data or []

        driver_ids = sorted({row.get("driver_id") for row in notifications if row.get("driver_id")})
        drivers_by_id = {}
        if driver_ids:
            profiles_result = (
                supabase.table("profiles")
                .select("id,name,email")
                .in_("id", driver_ids)
                .execute()
            )
            drivers_by_id = {
                row["id"]: row
                for row in (profiles_result.data or [])
                if row.get("id")
            }

        enriched = []
        for row in notifications:
            driver = drivers_by_id.get(row.get("driver_id"), {})
            enriched.append(
                GuardianNotification(
                    **row,
                    driver_name=driver.get("name"),
                    driver_email=driver.get("email"),
                )
            )

        total = result.count if result.count is not None else len(notifications)
        return GuardianNotificationsResponse(
            notifications=enriched,
            total=total,
            page=page,
            page_size=page_size,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Error fetching guardian notifications for user %s: %s",
            current_user.user_id,
            str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve guardian notifications",
        )


@router.patch("/guardian-notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_guardian_notification_read(
    notification_id: int,
    current_user: TokenData = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        guardian_profile = _ensure_guardian_profile(supabase, current_user)

        updated = (
            supabase.table("guardian_notifications")
            .update({"is_read": True})
            .eq("id", notification_id)
            .eq("guardian_id", guardian_profile["id"])
            .execute()
        )
        if not updated.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found or access denied",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Error marking notification %s read for user %s: %s",
            notification_id,
            current_user.user_id,
            str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification",
        )


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    current_user: TokenData = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        result = (
            supabase.table("drowsiness_events")
            .delete()
            .eq("id", event_id)
            .eq("driver_id", current_user.user_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found or access denied",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Error deleting event %s for user %s: %s",
            event_id,
            current_user.user_id,
            str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete event",
        )


@router.post("/events", response_model=DriverEvent, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: DriverEventCreate,
    current_user: TokenData = Depends(get_current_user),
):
    try:
        supabase = get_supabase_client()
        inserted = insert_drowsiness_event(
            supabase,
            driver_id=current_user.user_id,
            ear_value=payload.ear_value,
            duration_seconds=payload.duration_seconds,
            severity=payload.severity,
            session_id=payload.session_id,
        )
        return DriverEvent(**inserted)
    except Exception as e:
        logger.error("Error creating event for user %s: %s", current_user.user_id, str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Insert failed",
        )


# ============================================================================
# DEBUG ENDPOINTS - Remove in production!
# ============================================================================

@router.get("/debug/test-insert", status_code=status.HTTP_200_OK)
async def debug_test_insert(
    current_user: TokenData = Depends(get_current_user),
):
    """
    Debug endpoint to test database insert. 
    REMOVE THIS ENDPOINT IN PRODUCTION!
    """
    try:
        supabase = get_supabase_client()
        
        # Test insert into drowsiness_events
        test_event = {
            "driver_id": current_user.user_id,
            "ear_value": 0.15,
            "duration_seconds": 2.5,
            "severity": "HIGH",
        }
        
        result = supabase.table("drowsiness_events").insert(test_event).execute()
        
        if result.data:
            return {
                "status": "success",
                "inserted_id": result.data[0].get("id"),
                "message": "Test insert successful"
            }
        else:
            return {
                "status": "error",
                "message": "Insert returned no data"
            }
            
    except Exception as e:
        logger.error(f"Debug test insert failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Debug insert failed: {str(e)}",
        )
