# backend/app/routes/detection.py
"""
Detection Module
Handles real-time drowsiness detection requests.
Processes video frames, detects eye closure, and logs critical events.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import base64
import binascii
import logging

from app.routes.auth import get_current_user
from app.services.eye_detection import detect_drowsiness
from app.supabase_client import get_supabase_client
from app.routes.auth import TokenData

router = APIRouter(tags=["Detection"])
logger = logging.getLogger(__name__)


# Request Models
class DetectionRequest(BaseModel):
    """Frame data for drowsiness detection"""
    frame_data: str = Field(..., description="Base64 encoded image frame")
    timestamp: Optional[float] = Field(None, description="Client timestamp")
    session_id: Optional[str] = Field(None, description="Session identifier")


# Response Models
class DetectionResponse(BaseModel):
    """AI detection result"""
    eyes_closed: bool = Field(..., description="Whether eyes are detected as closed")
    duration: float = Field(..., description="Duration of eye closure in seconds")
    ear: float = Field(..., description="Eye Aspect Ratio value")
    severity: str = Field(..., description="Alert severity: LOW, MEDIUM, HIGH")
    alert: bool = Field(..., description="Whether alert should be triggered")
    timestamp: float = Field(..., description="Server processing timestamp")


def _decode_frame_data(frame_data: str) -> bytes:
    """
    Accept both raw base64 and data URL payloads.
    """
    if not frame_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="frame_data is required"
        )

    normalized = frame_data.strip()
    if normalized.startswith("data:image"):
        parts = normalized.split(",", 1)
        if len(parts) != 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid data URL format for frame_data"
            )
        normalized = parts[1]

    # Handle clients that trim base64 padding.
    padding = len(normalized) % 4
    if padding:
        normalized += "=" * (4 - padding)

    try:
        return base64.b64decode(normalized, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid frame data: {str(exc)}"
        )


@router.post("/analyze", response_model=DetectionResponse, status_code=status.HTTP_200_OK)
async def analyze_frame(
    request: DetectionRequest,
    current_user: TokenData = Depends(get_current_user)
):
    """
    Analyze a single video frame for drowsiness detection.
    
    Flow:
    1. Decode base64 frame data
    2. Run AI detection using MediaPipe + OpenCV
    3. Calculate Eye Aspect Ratio (EAR)
    4. Determine severity based on EAR and duration
    5. If alert triggered, log event to database
    6. Return detection results
    
    Protected: Requires valid JWT token
    """
    try:
        # Decode base64 frame
        frame_bytes = _decode_frame_data(request.frame_data)
        
        # Call AI detection service
        # This function uses MediaPipe Face Mesh to detect facial landmarks
        # and calculates Eye Aspect Ratio (EAR) for drowsiness detection
        detection_result = detect_drowsiness(frame_bytes)
        
        if not detection_result:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not process frame. Face not detected or invalid image"
            )
        
        # Extract detection metrics
        eyes_closed = detection_result.get("eyes_closed", False)
        duration = detection_result.get("duration", 0.0)
        ear = detection_result.get("ear", 0.0)
        severity = detection_result.get("severity", "LOW")
        alert = detection_result.get("alert", False)
        
        # Log critical events to database
        if alert:
            await _log_drowsiness_event(
                user_id=current_user.user_id,
                session_id=request.session_id,
                ear=ear,
                duration=duration,
                severity=severity
            )
        
        return DetectionResponse(
            eyes_closed=eyes_closed,
            duration=duration,
            ear=ear,
            severity=severity,
            alert=alert,
            timestamp=datetime.utcnow().timestamp()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection error for user {current_user.user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Detection service encountered an error"
        )


async def _log_drowsiness_event(
    user_id: str,
    session_id: Optional[str],
    ear: float,
    duration: float,
    severity: str
):
    """
    Internal helper to log drowsiness events to Supabase.
    Runs asynchronously to avoid blocking the detection response.
    """
    try:
        supabase = get_supabase_client()
        
        event_data = {
            "user_id": user_id,
            "session_id": session_id,
            "event_type": "DROWSINESS_DETECTED",
            "ear_value": ear,
            "duration_seconds": duration,
            "severity": severity,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("driving_sessions").insert(event_data).execute()
        
        if not result.data:
            logger.error(f"Failed to log event for user {user_id}")
            
    except Exception as e:
        # Non-critical: log error but don't fail the request
        logger.error(f"Error logging event to database: {str(e)}")


@router.get("/health", status_code=status.HTTP_200_OK)
async def detection_health():
    """
    Health check endpoint for detection service.
    Used for monitoring and load balancer health checks.
    """
    return {
        "service": "detection",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }
