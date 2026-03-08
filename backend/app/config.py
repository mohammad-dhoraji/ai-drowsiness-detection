# backend/app/config.py
import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Configuration settings for the AI Driver Assist backend.
    Uses Pydantic BaseSettings to automatically load environment variables
    from a .env file or the host system environment.
    """

    # Project Metadata
    APP_NAME: str = "AI Driver Assist"
    ENVIRONMENT: str = "development"  # Options: development, production
    DEBUG: bool = True

    # Database Configuration
    # Defaults to a local SQLite database for zero-cost deployment and easy portability for viva.
    # Format: sqlite:///./path_to_file
    DATABASE_URL: str = "sqlite:///./data/driver_logs.db"
    
    # Supabase Configuration (REQUIRED)
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_JWT_SECRET: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Security & CORS
    # Allowed local frontend origins for browser access in development.
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # AI Detection Thresholds (Dlib/MediaPipe Tuning)
    # Eye Aspect Ratio (EAR) below which an eye is considered 'closed'
    DROWSY_EAR_THRESHOLD: float = 0.25
    
    # Duration (in seconds) the EAR must remain below the threshold to trigger an alarm
    DROWSY_TIME_THRESHOLD: float = 2.0

    # Pydantic configuration for environment variable loading
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="forbid"
    )

# Instantiate the settings object for use across the application
settings = Settings()
