"""
Questify AI - Backend Server Runner
Runs Uvicorn server on configured port (default 3001).
"""
import uvicorn
from backend.config import settings

if __name__ == "__main__":
    print(f"Starting {settings.APP_NAME} Backend on http://{settings.HOST}:{settings.PORT}")
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=False)
