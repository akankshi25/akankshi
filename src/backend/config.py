"""
Questify AI - Backend Configuration
"""
import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "Questify AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    PORT: int = int(os.environ.get("PORT", "3001"))
    HOST: str = "0.0.0.0"
    
    # Database
    DB_PATH: str = os.environ.get("QUESTIFY_DB_PATH", os.path.join(os.path.dirname(__file__), "questify.db"))
    
    # Security
    SECRET_KEY: str = os.environ.get("QUESTIFY_SECRET", "questify-secret-key-gamified-cleanup-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Gemini AI API
    GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
    AI_MODEL_NAME: str = os.environ.get("AI_MODEL_NAME", "gemini-2.5-flash")
    
    # Google OAuth (Optional - Demo mode works without this)
    GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:3000/oauth/callback")

settings = Settings()
