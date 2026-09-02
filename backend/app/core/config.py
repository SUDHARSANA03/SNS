from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-powered Log Analyzer"
    API_V1_STR: str = "/api"
    NVIDIA_API_KEY: Optional[str] = None
    NVIDIA_MODEL: str = "nvidia/nemotron-3-ultra-550b-a55b"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
