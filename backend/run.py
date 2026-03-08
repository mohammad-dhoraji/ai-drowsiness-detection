# backend/run.py
import uvicorn

if __name__ == "__main__":
    # Runs the app using the settings defined in main.py
    uvicorn.run(
        "app.main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=True,
        log_level="info"
    )
