# backend/app/routes/logs.py
"""
Logs Module
Provides driver event history and analytics APIs.
Supports querying past drowsiness events and session summaries.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.routes.auth import get_current_user, TokenData
from app.supabase_client import get_supabase_client


router = APIRouter(tags=["Logs"])
logger = logging.getLogger(__name__)


# Response Models
class DriverEvent(BaseModel):
    """Single driver event record"""
    id: int
    event_type: str
    ear_value: float
    duration_seconds: float
    severity: str
    session_id: Optional[str]
    created_at: str


class EventsResponse(BaseModel):
    """Paginated list of events"""
    events: List[DriverEvent]
    total: int
    page: int
    page_size: int


class EventSummary(BaseModel):
    """Aggregated statistics for user events"""
    total_events: int = Field(..., description="Total number of drowsiness events")
    high_severity_count: int = Field(..., description="Number of HIGH severity events")
    medium_severity_count: int = Field(..., description="Number of MEDIUM severity events")
    low_severity_count: int = Field(..., description="Number of LOW severity events")
    last_event_time: Optional[str] = Field(None, description="Timestamp of most recent event")
    avg_ear_value: Optional[float] = Field(None, description="Average EAR across all events")
    total_sessions: int = Field(..., description="Number of unique driving sessions")


class SessionInfo(BaseModel):
    """Individual session details"""
    session_id: str
    start_time: str
    end_time: Optional[str]
    event_count: int
    highest_severity: str


@router.get("/events", response_model=EventsResponse, status_code=status.HTTP_200_OK)
async def get_driver_events(
    current_user: TokenData = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    severity: Optional[str] = Query(None, pattern="^(LOW|MEDIUM|HIGH)$", description="Filter by severity"),
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    days: Optional[int] = Query(None, ge=1, le=365, description="Events from last N days")
):
    """
    Retrieve paginated driver events for the authenticated user.
    
    Events are sorted by created_at DESC (most recent first).
    Supports filtering by severity, session, and time range.
    
    Protected: Only returns events for the authenticated user.
    """
    try:
        supabase = get_supabase_client()
        user_id = current_user.user_id
        
        # Build query with user isolation
        query = supabase.table("driving_sessions").select("*", count="exact")
        query = query.eq("user_id", user_id)
        
        # Apply filters
        if severity:
            query = query.eq("severity", severity)
        
        if session_id:
            query = query.eq("session_id", session_id)
        
        if days:
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            query = query.gte("created_at", cutoff_date)
        
        # Apply pagination and sorting
        offset = (page - 1) * page_size
        query = query.order("created_at", desc=True)
        query = query.range(offset, offset + page_size - 1)
        
        result = query.execute()
        
        events = [DriverEvent(**event) for event in result.data]
        total = result.count if result.count is not None else len(result.data)
        
        return EventsResponse(
            events=events,
            total=total,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error(f"Error fetching events for user {current_user.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve events"
        )


@router.get("/summary", response_model=EventSummary, status_code=status.HTTP_200_OK)
async def get_event_summary(
    current_user: TokenData = Depends(get_current_user),
    days: Optional[int] = Query(30, ge=1, le=365, description="Summarize last N days")
):
    """
    Get aggregated statistics and analytics for user's drowsiness events.
    
    Calculates:
    - Total event count by severity
    - Average EAR value
    - Last event timestamp
    - Unique session count
    
    Protected: Only analyzes data for the authenticated user.
    """
    try:
        supabase = get_supabase_client()
        user_id = current_user.user_id
        
        # Calculate time range
        cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        
        # Fetch all events for the user within time range
        result = supabase.table("driving_sessions") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("created_at", cutoff_date) \
            .order("created_at", desc=True) \
            .execute()
        
        events = result.data
        
        if not events:
            return EventSummary(
                total_events=0,
                high_severity_count=0,
                medium_severity_count=0,
                low_severity_count=0,
                last_event_time=None,
                avg_ear_value=None,
                total_sessions=0
            )
        
        # Calculate statistics
        high_count = len([e for e in events if e["severity"] == "HIGH"])
        medium_count = len([e for e in events if e["severity"] == "MEDIUM"])
        low_count = len([e for e in events if e["severity"] == "LOW"])
        
        # Calculate average EAR
        ear_values = [e["ear_value"] for e in events if e.get("ear_value") is not None]
        avg_ear = sum(ear_values) / len(ear_values) if ear_values else None
        
        # Count unique sessions
        unique_sessions = len(set(e["session_id"] for e in events if e.get("session_id")))
        
        # Get last event time
        last_event_time = events[0]["created_at"] if events else None
        
        return EventSummary(
            total_events=len(events),
            high_severity_count=high_count,
            medium_severity_count=medium_count,
            low_severity_count=low_count,
            last_event_time=last_event_time,
            avg_ear_value=round(avg_ear, 3) if avg_ear else None,
            total_sessions=unique_sessions
        )
        
    except Exception as e:
        logger.error(f"Error generating summary for user {current_user.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate event summary"
        )


@router.get("/sessions", response_model=List[SessionInfo], status_code=status.HTTP_200_OK)
async def get_user_sessions(
    current_user: TokenData = Depends(get_current_user),
    days: Optional[int] = Query(30, ge=1, le=365, description="Sessions from last N days")
):
    """
    Retrieve all driving sessions for the authenticated user.
    
    Groups events by session_id and provides session-level analytics.
    Useful for reviewing individual driving sessions.
    
    Protected: Only returns sessions for the authenticated user.
    """
    try:
        supabase = get_supabase_client()
        user_id = current_user.user_id
        
        cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        
        # Fetch events grouped by session
        result = supabase.table("driving_sessions") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("created_at", cutoff_date) \
            .order("created_at", desc=True) \
            .execute()
        
        events = result.data
        
        # Group events by session_id
        sessions_dict = {}
        for event in events:
            session_id = event.get("session_id") or "unknown"
            
            if session_id not in sessions_dict:
                sessions_dict[session_id] = {
                    "events": [],
                    "start_time": event["created_at"],
                    "end_time": event["created_at"]
                }
            
            sessions_dict[session_id]["events"].append(event)
            
            # Update time boundaries
            if event["created_at"] < sessions_dict[session_id]["start_time"]:
                sessions_dict[session_id]["start_time"] = event["created_at"]
            if event["created_at"] > sessions_dict[session_id]["end_time"]:
                sessions_dict[session_id]["end_time"] = event["created_at"]
        
        # Build response
        sessions = []
        for session_id, session_data in sessions_dict.items():
            session_events = session_data["events"]
            
            # Determine highest severity in session
            severity_priority = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
            highest_severity = max(
                (e["severity"] for e in session_events),
                key=lambda s: severity_priority.get(s, 0)
            )
            
            sessions.append(SessionInfo(
                session_id=session_id,
                start_time=session_data["start_time"],
                end_time=session_data["end_time"],
                event_count=len(session_events),
                highest_severity=highest_severity
            ))
        
        return sessions
        
    except Exception as e:
        logger.error(f"Error fetching sessions for user {current_user.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve sessions"
        )


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Delete a specific event by ID.
    
    Security: Verifies event belongs to authenticated user before deletion.
    Returns 404 if event doesn't exist or doesn't belong to user.
    """
    try:
        supabase = get_supabase_client()
        user_id = current_user.user_id
        
        # Verify ownership and delete in one query
        result = supabase.table("driving_sessions") \
            .delete() \
            .eq("id", event_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found or access denied"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event {event_id} for user {current_user.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete event"
        )
class DriverEventCreate(BaseModel):
    event_type: str
    ear_value: float
    duration_seconds: float
    severity: str = Field(..., pattern="^(LOW|MEDIUM|HIGH)$")
    session_id: Optional[str] = None


@router.post("/events", status_code=201)
async def create_event(
    payload: DriverEventCreate,
    current_user: TokenData = Depends(get_current_user)
):
    supabase = get_supabase_client()

    data = {
        "user_id": current_user.user_id,
        "event_type": payload.event_type,
        "ear_value": payload.ear_value,
        "duration_seconds": payload.duration_seconds,
        "severity": payload.severity,
        "session_id": payload.session_id,
    }

    result = supabase.table("driving_sessions").insert(data).execute()

    if not result.data:
        raise HTTPException(500, "Insert failed")

    return result.data[0]
