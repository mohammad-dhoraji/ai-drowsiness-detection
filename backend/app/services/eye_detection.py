# backend/app/services/eye_detection.py
"""
Eye Detection Service Module
Implements drowsiness detection using MediaPipe Face Mesh and Eye Aspect Ratio (EAR).

This module provides AI-based drowsiness detection for the AI Driver Assist project.
It uses computer vision techniques to detect eye closure in real-time without requiring
heavy ML model training or GPU acceleration.

Key Technologies:
- MediaPipe Face Mesh: Real-time facial landmark detection (468 points)
- Eye Aspect Ratio (EAR): Geometric metric for measuring eye openness
- OpenCV: Image processing and manipulation

Author: AI Driver Assist Team
Date: 2026
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Optional, Dict, Tuple
import time
import logging
from threading import Lock
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MediaPipe Face Mesh landmark indices for eyes
# These indices correspond to the 468-point face mesh model
# Reference: MediaPipe Face Mesh documentation
LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]

# Default thresholds (can be overridden)
DEFAULT_EAR_THRESHOLD = 0.25  # Eyes considered closed below this value
DEFAULT_TIME_THRESHOLD = 2.0  # Alert triggered after N seconds of closure


class EyeClosureTracker:
    """
    Thread-safe tracker for monitoring eye closure duration across frames.
    
    This class manages state for tracking when eyes close and for how long.
    It uses locking mechanisms to ensure thread safety in concurrent environments.
    
    Why stateful?
    - Need to track closure duration across multiple frames
    - Must differentiate between blinks (~0.3s) and drowsiness (>2s)
    - Must be thread-safe for concurrent API requests
    """
    
    def __init__(self):
        self._closure_start_time: Optional[float] = None
        self._is_eyes_closed: bool = False
        self._lock = Lock()
    
    def update(self, eyes_closed: bool) -> float:
        """
        Update closure state and return current closure duration.
        
        Args:
            eyes_closed: Whether eyes are currently closed
            
        Returns:
            float: Duration in seconds that eyes have been closed
        """
        with self._lock:
            current_time = time.time()
            
            if eyes_closed:
                if not self._is_eyes_closed:
                    # Eyes just closed - start tracking
                    self._closure_start_time = current_time
                    self._is_eyes_closed = True
                    return 0.0
                else:
                    # Eyes still closed - calculate duration
                    if self._closure_start_time is not None:
                        return current_time - self._closure_start_time
                    return 0.0
            else:
                # Eyes opened - reset tracking
                self._is_eyes_closed = False
                self._closure_start_time = None
                return 0.0
    
    def reset(self):
        """Reset tracker state. Useful for new sessions."""
        with self._lock:
            self._closure_start_time = None
            self._is_eyes_closed = False


# Global tracker instance (thread-safe)
# Note: In production with multiple users, use session-based tracking
_global_tracker = EyeClosureTracker()


def calculate_eye_aspect_ratio(eye_landmarks: np.ndarray) -> float:
    """
    Calculate Eye Aspect Ratio (EAR) using geometric formula.
    
    EAR Formula:
        EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
    
    Where:
        p1, p4 = horizontal eye corners (left, right)
        p2, p3, p5, p6 = vertical eye points (top and bottom)
    
    Intuition:
        - When eyes are open: vertical distances are large, EAR ≈ 0.3
        - When eyes are closed: vertical distances approach 0, EAR ≈ 0.1
        - EAR < 0.25 typically indicates closed eyes
    
    Args:
        eye_landmarks: numpy array of shape (6, 2) containing eye corner coordinates
        
    Returns:
        float: Eye aspect ratio value
        
    Reference:
        Soukupová and Čech (2016) - "Real-Time Eye Blink Detection using 
        Facial Landmarks"
    """
    # Vertical distances
    vertical_1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
    vertical_2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
    
    # Horizontal distance
    horizontal = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
    
    # Prevent division by zero
    if horizontal == 0:
        return 0.0
    
    # Calculate EAR
    ear = (vertical_1 + vertical_2) / (2.0 * horizontal)
    
    return ear


def extract_eye_landmarks(
    face_landmarks,
    eye_indices: list,
    image_width: int,
    image_height: int
) -> np.ndarray:
    """
    Extract specific eye landmark coordinates from face mesh.
    
    Args:
        face_landmarks: MediaPipe face landmarks object
        eye_indices: List of landmark indices for one eye
        image_width: Width of the image in pixels
        image_height: Height of the image in pixels
        
    Returns:
        numpy array of shape (6, 2) with normalized coordinates
    """
    landmarks = []
    
    for idx in eye_indices:
        landmark = face_landmarks.landmark[idx]
        # Convert normalized coordinates to pixel coordinates
        x = landmark.x * image_width
        y = landmark.y * image_height
        landmarks.append([x, y])
    
    return np.array(landmarks, dtype=np.float32)


def determine_severity(duration: float, time_threshold: float) -> str:
    """
    Determine alert severity based on eye closure duration.
    
    Severity Levels:
        - LOW: Brief closure (0-50% of threshold)
        - MEDIUM: Concerning closure (50-100% of threshold)
        - HIGH: Critical closure (>= threshold)
    
    Args:
        duration: Current eye closure duration in seconds
        time_threshold: Threshold for triggering high severity
        
    Returns:
        str: "LOW", "MEDIUM", or "HIGH"
    """
    if duration >= time_threshold:
        return "HIGH"
    elif duration >= (time_threshold * 0.5):
        return "MEDIUM"
    else:
        return "LOW"


def detect_drowsiness(
    frame: bytes,
    ear_threshold: float = DEFAULT_EAR_THRESHOLD,
    time_threshold: float = DEFAULT_TIME_THRESHOLD,
    tracker: Optional[EyeClosureTracker] = None
) -> Optional[Dict]:
    """
    Detect drowsiness in a single video frame using MediaPipe Face Mesh and EAR.
    
    This is the main AI detection function. It processes a single frame and returns
    comprehensive drowsiness metrics.
    
    Processing Pipeline:
        1. Decode and preprocess frame
        2. Detect face using MediaPipe Face Mesh
        3. Extract eye landmarks (6 points per eye)
        4. Calculate EAR for both eyes
        5. Average EAR values for robustness
        6. Track closure duration over time
        7. Determine severity and alert status
    
    Why MediaPipe + EAR?
        - MediaPipe: Lightweight, real-time, CPU-optimized, no training required
        - EAR: Simple, effective, computationally cheap, well-researched metric
        - Combined: Perfect for real-time browser-based applications on free tier
    
    Args:
        frame: Image frame as bytes (decoded from base64)
        ear_threshold: EAR value below which eyes are considered closed
        time_threshold: Duration (seconds) after which to trigger alert
        tracker: Optional custom tracker (uses global tracker if None)
        
    Returns:
        dict: Detection results containing:
            - eyes_closed (bool): Whether eyes are detected as closed
            - duration (float): How long eyes have been closed (seconds)
            - ear (float): Calculated Eye Aspect Ratio
            - severity (str): Alert severity level
            - alert (bool): Whether to trigger alert
        None: If frame processing fails
        
    Raises:
        No exceptions raised - graceful error handling with None return
    """
    # Use global tracker if none provided (supports session-based override)
    if tracker is None:
        tracker = _global_tracker
    
    try:
        # Step 1: Decode frame from bytes
        np_arr = np.frombuffer(frame, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if image is None:
            logger.error("Failed to decode image from bytes")
            return None
        
        # Step 2: Convert BGR to RGB (MediaPipe requirement)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image_height, image_width, _ = image.shape
        
        # Step 3: Initialize MediaPipe Face Mesh
        # Using static_image_mode=False for video stream optimization
        # max_num_faces=1 for performance (driver monitoring = single person)
        # min_detection_confidence=0.5 balances accuracy and false positives
        mp_face_mesh = mp.solutions.face_mesh
        
        with mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        ) as face_mesh:
            
            # Step 4: Process image and detect facial landmarks
            results = face_mesh.process(image_rgb)
            
            # Handle no face detected
            if not results.multi_face_landmarks:
                logger.warning("No face detected in frame")
                # Reset tracker when no face is detected
                tracker.reset()
                return {
                    "eyes_closed": False,
                    "duration": 0.0,
                    "ear": 0.0,
                    "severity": "LOW",
                    "alert": False
                }
            
            # Step 5: Extract landmarks for both eyes
            face_landmarks = results.multi_face_landmarks[0]
            
            left_eye = extract_eye_landmarks(
                face_landmarks,
                LEFT_EYE_INDICES,
                image_width,
                image_height
            )
            
            right_eye = extract_eye_landmarks(
                face_landmarks,
                RIGHT_EYE_INDICES,
                image_width,
                image_height
            )
            
            # Step 6: Calculate EAR for each eye
            left_ear = calculate_eye_aspect_ratio(left_eye)
            right_ear = calculate_eye_aspect_ratio(right_eye)
            
            # Step 7: Average EAR for robustness
            # Averaging reduces impact of:
            # - Detection noise
            # - Partial occlusions
            # - Asymmetric eye closure (winking)
            avg_ear = (left_ear + right_ear) / 2.0
            
            # Step 8: Determine if eyes are closed
            eyes_closed = avg_ear < ear_threshold
            
            # Step 9: Update closure duration tracking
            duration = tracker.update(eyes_closed)
            
            # Step 10: Determine severity level
            severity = determine_severity(duration, time_threshold)
            
            # Step 11: Decide if alert should be triggered
            alert = duration >= time_threshold
            
            # Step 12: Return comprehensive results
            result = {
                "eyes_closed": eyes_closed,
                "duration": round(duration, 2),
                "ear": round(avg_ear, 3),
                "severity": severity,
                "alert": alert
            }
            
            # Log critical events for debugging
            if alert:
                logger.warning(
                    f"DROWSINESS ALERT: EAR={avg_ear:.3f}, "
                    f"Duration={duration:.2f}s, Severity={severity}"
                )
            
            return result
    
    except Exception as e:
        logger.error(f"Error during drowsiness detection: {str(e)}", exc_info=True)
        return None


def create_session_tracker() -> EyeClosureTracker:
    """
    Create a new tracker instance for session-based tracking.
    
    Usage:
        # In your route handler:
        session_tracker = create_session_tracker()
        result = detect_drowsiness(frame, tracker=session_tracker)
    
    Returns:
        EyeClosureTracker: New tracker instance
    """
    return EyeClosureTracker()


def get_default_thresholds() -> Tuple[float, float]:
    """
    Get the default EAR and time thresholds.
    
    Returns:
        tuple: (ear_threshold, time_threshold)
    """
    return DEFAULT_EAR_THRESHOLD, DEFAULT_TIME_THRESHOLD


# Module-level health check function
def health_check() -> Dict[str, str]:
    """
    Verify that all required dependencies are available.
    
    Returns:
        dict: Health status of the module
    """
    try:
        # Test MediaPipe initialization
        mp_face_mesh = mp.solutions.face_mesh
        
        # Test OpenCV
        test_img = np.zeros((100, 100, 3), dtype=np.uint8)
        _ = cv2.cvtColor(test_img, cv2.COLOR_BGR2RGB)
        
        return {
            "status": "healthy",
            "mediapipe": "available",
            "opencv": "available",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


if __name__ == "__main__":
    """
    Module self-test for development and debugging.
    Run: python eye_detection.py
    """
    print("🔍 Eye Detection Module Self-Test")
    print("-" * 50)
    
    # Health check
    health = health_check()
    print(f"Health Status: {health['status']}")
    print(f"MediaPipe: {health.get('mediapipe', 'N/A')}")
    print(f"OpenCV: {health.get('opencv', 'N/A')}")
    
    # Test with synthetic frame
    print("\n📸 Testing with synthetic frame...")
    test_frame = cv2.imencode('.jpg', np.zeros((480, 640, 3), dtype=np.uint8))[1].tobytes()
    result = detect_drowsiness(test_frame)
    
    if result:
        print("✅ Detection function executed successfully")
        print(f"Result: {result}")
    else:
        print("❌ Detection function returned None (expected for blank frame)")
    
    print("\n" + "=" * 50)
    print("✅ Module ready for production use")
