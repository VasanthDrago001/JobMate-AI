from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    PROJECT_NAME: str = "JobMate AI Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Server configuration
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS configuration - supports JSON list or comma-separated strings
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[List[str], str]) -> List[str]:
        if isinstance(v, str):
            # Support comma-separated origins in .env
            if v.startswith("[") and v.endswith("]"):
                # Handled by standard pydantic JSON parsing
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # File and Payload Constraints
    MAX_FILE_SIZE_MB: int = 5
    MAX_RESUME_PAGES: int = 5
    MIN_JD_LENGTH: int = 50
    MAX_JD_LENGTH: int = 10000
    PDF_PARSE_TIMEOUT_SECONDS: int = 10

    # Minimum alphanumeric characters to qualify as digital text (vs scanned image)
    MIN_ALPHANUMERIC_CHARS: int = 50

    # Database & AI configuration
    DATABASE_URL: str = ""
    GEMINI_API_KEY: str = ""
    AI_MODEL: str = "gemini-1.5-flash"
    AI_ENABLED: bool = True
    AI_DAILY_BUDGET_CALLS: int = 50
    AI_MAX_BULLETS_PER_REQUEST: int = 3
    AI_MAX_BULLET_CHARS: int = 400
    AI_MAX_OUTPUT_TOKENS: int = 800
    AI_REQUEST_TIMEOUT_SECONDS: float = 8.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
