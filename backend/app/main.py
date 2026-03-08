# backend/app/main.py
from dotenv import load_dotenv
load_dotenv()

import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Absolute imports from the project structure
from app.config import settings
from app.routes import auth, detection, guardian_links, logs  

# Configure system logging for production-ready observability
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ai_driver_assist")

# Initialize FastAPI App using settings from config.py
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for AI-powered driver drowsiness detection using MediaPipe and EAR analysis.",
    version="1.0.0",
    debug=settings.DEBUG
)

# Setup Cross-Origin Resource Sharing (CORS)
# Necessary for browser-based frontend access (Webcam interface)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handling for production stability
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An internal server error occurred.",
            "detail": str(exc) if settings.DEBUG else "Contact administrator"
        },
    )

# Middleware to log request processing time
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Register API Routers with versioning prefix
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(detection.router, prefix="/api/v1/detection")
app.include_router(logs.router, prefix="/api/v1/logs", tags=["Event Logs"])
app.include_router(guardian_links.router, prefix="/api/v1", tags=["Guardian Linking"])

@app.get("/", tags=["General"])
async def root():
    """
    Root endpoint providing project metadata. 
    Useful for verifying deployment and viva demonstrations.
    """
    return {
        "project": settings.APP_NAME,
        "version": "1.0.0",
        "status": "Online",
        "engine": "MediaPipe EAR Implementation",
        "docs": "/docs"
    }

@app.get("/health", tags=["General"])
async def health_check():
    """
    Health check endpoint for monitoring tools and deployment platforms.
    """
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": settings.ENVIRONMENT
    }

# Entry point for local development (run.py will call the app)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
