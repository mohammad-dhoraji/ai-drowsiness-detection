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
from app.services.profile_service import ensure_current_user_profile
from app.services.drowsiness_event_service import insert_drowsiness_event
from app.supabase_client import get_supabase_client
from app.routes.auth import TokenData

router = APIRouter(tags=["Detection"])
logger = logging.getLogger(__name__)


# =========================
# Request Models
# =========================

class DetectionRequest(BaseModel):
    frame_data: str = Field(..., description="Base64 encoded image frame")
    timestamp: Optional[float] = Field(None)
    session_id: Optional[str] = Field(None)


# =========================
# Response Models
# =========================

class DetectionResponse(BaseModel):
    eyes_closed: bool
    duration: float
    ear: float
    severity: str
    alert: bool
    timestamp: float


# =========================
# Base64 Decoder
# =========================

def _decode_frame_data(frame_data: str) -> bytes:
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
                detail="Invalid data URL format"
            )
        normalized = parts[1]

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


# =========================
# Detection Endpoint
# =========================

@router.post("/analyze", response_model=DetectionResponse)
async def analyze_frame(
    request: DetectionRequest,
    current_user: TokenData = Depends(get_current_user)
):

    try:

        frame_bytes = _decode_frame_data(request.frame_data)

        detection_result = detect_drowsiness(frame_bytes)

        if not detection_result:
            raise HTTPException(
                status_code=422,
                detail="Face not detected or invalid image"
            )

        eyes_closed = detection_result.get("eyes_closed", False)
        duration = detection_result.get("duration", 0.0)
        ear = detection_result.get("ear", 0.0)
        severity = detection_result.get("severity", "LOW")
        alert = detection_result.get("alert", False)

        logger.info(
            f"DETECTION: user={current_user.user_id}, "
            f"session_id={request.session_id}, "
            f"ear={ear:.3f}, duration={duration:.2f}s, "
            f"severity={severity}, alert={alert}"
        )

        if alert:

            logger.info(
                f"DROWSINESS_ALERT: Logging event "
                f"user={current_user.user_id} session={request.session_id}"
            )

            try:

                await _log_drowsiness_event(
                    current_user=current_user,
                    session_id=request.session_id,
                    ear=ear,
                    duration=duration,
                    severity=severity
                )

                logger.info(
                    f"DROWSINESS_ALERT: logging completed "
                    f"user={current_user.user_id}"
                )

            except Exception as e:
                logger.error(
                    f"DROWSINESS_ALERT FAILED: {str(e)}",
                    exc_info=True
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

        logger.error(
            f"Detection error for user {current_user.user_id}: {str(e)}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail="Detection service encountered an error"
        )


# =========================
# Event Logger
# =========================

async def _log_drowsiness_event(
    current_user: TokenData,
    session_id: Optional[str],
    ear: float,
    duration: float,
    severity: str
):

    logger.info(
        f"_log_drowsiness_event START "
        f"user={current_user.user_id}"
    )

    try:

        if not session_id:
            logger.warning(
                "_log_drowsiness_event SKIPPED: session_id is None"
            )
            return

        supabase = get_supabase_client()

        profile = ensure_current_user_profile(
            supabase,
            user_id=current_user.user_id,
            email=current_user.email,
            token_role=current_user.role,
            token_name=current_user.name
        )

        if profile is None:
            logger.error(
                f"Profile creation failed for {current_user.user_id}"
            )
            return

        profile_id = profile.get("id")
        profile_role = profile.get("role")

        logger.info(
            f"profile_id={profile_id} role={profile_role}"
        )

        if profile_role != "driver":
            logger.warning(
                f"User role '{profile_role}' cannot log drowsiness"
            )
            return

        driver_id_str = str(profile_id)

        ear = float(ear)
        duration = float(duration)
        severity = str(severity)
        session_id = str(session_id)

        inserted_event =  insert_drowsiness_event(
            supabase=supabase,
            driver_id=driver_id_str,
            session_id=session_id,
            ear_value=ear,
            duration_seconds=duration,
            severity=severity
        )

        if inserted_event and isinstance(inserted_event, dict):
            logger.info(
                f"DROWSINESS EVENT INSERTED id={inserted_event.get('id')}"
            )
        else:
            logger.warning("Insert returned None or invalid response")

    except Exception as e:

                logger.error(
                    f"_log_drowsiness_event ERROR: {str(e)}",
                    exc_info=True
                )


# =========================
# Health Check
# =========================

@router.get("/health")
async def detection_health():

    return {
        "service": "detection",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }


# =========================
# Debug Endpoint
# =========================

@router.post("/debug/trigger-alert")
async def debug_trigger_alert(
    request: DetectionRequest,
    current_user: TokenData = Depends(get_current_user)
):

    logger.info(
        f"DEBUG: Trigger alert for {current_user.user_id}"
    )

    try:

        await _log_drowsiness_event(
            current_user=current_user,
            session_id=request.session_id,
            ear=0.15,
            duration=2.5,
            severity="HIGH"
        )

        return {
            "status": "success",
            "message": "Debug alert triggered"
        }

    except Exception as e:

        logger.error(
            f"DEBUG ALERT FAILED: {str(e)}",
            exc_info=True
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )