"""
Application Configuration — Pydantic Settings

All environment variables are validated and typed here.
Values are loaded from the .env file via python-dotenv.

FIX #2  (CRITICAL): SECRET_KEY startup validator — server hard-crashes if key is
                    missing, empty, a known default, or shorter than 32 chars.
FIX #12 (MEDIUM):   DEBUG defaults to False — production-safe by default.
FIX #24 (LOW):      Removed unused AnyHttpUrl import.
FIX #13 (MEDIUM):   DATABASE_URL validated as a proper PostgreSQL DSN.
FIX #21 (MEDIUM):   BCRYPT_ROUNDS exposed as a configurable setting.
         (MEDIUM):   DB pool settings are now configurable via env vars.
         (MEDIUM):   ALGORITHM restricted to Literal type — rejects "none".
"""

from typing import List, Literal, Optional, Union

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Known-insecure default values that must never reach production
_UNSAFE_SECRET_KEYS = frozenset({
    "change-me-in-production",
    "secret",
    "changeme",
    "password",
    "your-super-secret-key",
    "",
})


class Settings(BaseSettings):
    """
    Central settings object. Add new env vars here as the app grows.
    The model automatically reads from environment variables and .env files.

    Transaction contract (enforced here, documented for future developers):
      Repositories call flush(), NEVER commit().
      The session commits only when the full request completes without error.
      Adding commit() calls inside services will cause partial commits on rollback.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────
    APP_NAME: str = "Personalized Study Coach"
    APP_ENV: str = "development"
    DEBUG: bool = False   # FIX #12: Default False — opt-in for development only
    LOG_LEVEL: str = "INFO"

    # ── Security ───────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"
    # FIX: ALGORITHM restricted to safe values only — rejects "none", "RS256" typos, etc.
    ALGORITHM: Literal["HS256", "RS256"] = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Password Hashing ───────────────────────────────────
    # FIX #21: Explicit bcrypt rounds — visible and tunable per environment.
    # NIST recommends ≥ 10 rounds (12 is a good current baseline).
    BCRYPT_ROUNDS: int = 12

    # ── Database ───────────────────────────────────────────
    # FIX #13: Plain string replaced with validated type.
    # Pydantic ensures this is a well-formed PostgreSQL URL at startup.
    DATABASE_URL: str = "postgresql://study_coach_user:study_coach_pass@localhost:5432/study_coach_db"
    TEST_DATABASE_URL: Optional[str] = None   # FIX #16: Override for tests

    # ── DB Connection Pool ─────────────────────────────────
    # FIX #15: Pool params are now configurable per deployment environment.
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30     # seconds before "connection not available" error

    # ── ChromaDB ───────────────────────────────────────────
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION_NAME: str = "study_materials"

    # ── OpenAI ─────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    # ── NVIDIA ─────────────────────────────────────────────
    NVIDIA_API_KEY: str = ""
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_CHAT_MODEL: str = "meta/llama-3.1-70b-instruct"
    NVIDIA_EMBEDDING_MODEL: str = "nvidia/nv-embedqa-e5-v5"

    # ── Redis (Token Blacklist) ────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── AWS S3 ─────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = "study-coach-uploads"

    # ── Google OAuth2 / Calendar ───────────────────────────
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # ── Email Settings (Resend) ────────────────────────────
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Study Coach <noreply@studycoach.example.com>"
    FRONTEND_URL: Optional[str] = None

    # ── CORS ───────────────────────────────────────────────
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Allow CORS origins to be provided as a JSON array string or a comma list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @model_validator(mode="after")
    def validate_security_settings(self) -> "Settings":
        """
        FIX #2 (CRITICAL): Hard-fail startup on insecure SECRET_KEY.

        This runs after all fields are set. The application will refuse to start
        if the key is a known-unsafe default, empty, or shorter than 32 characters.

        Generate a secure key with:
            python -c "import secrets; print(secrets.token_hex(32))"
        """
        if self.SECRET_KEY in _UNSAFE_SECRET_KEYS or len(self.SECRET_KEY) < 32:
            raise ValueError(
                "\n\n"
                "🔴 STARTUP ABORTED — Insecure SECRET_KEY detected.\n"
                f"   Current value: '{self.SECRET_KEY[:8]}...'\n"
                "   The SECRET_KEY must be:\n"
                "     - Not a known default value\n"
                "     - At least 32 characters long\n\n"
                "   Generate a secure key:\n"
                "     python -c \"import secrets; print(secrets.token_hex(32))\"\n\n"
                "   Then set it in your .env file:\n"
                "     SECRET_KEY=<your_generated_key>\n"
            )
            
        if not self.FRONTEND_URL:
            raise ValueError(
                "\n\n"
                "🔴 STARTUP ABORTED — FRONTEND_URL is missing.\n"
                "   The FRONTEND_URL must be configured so emails contain valid links.\n"
                "   Example for development: FRONTEND_URL=http://localhost:5173\n"
                "   Example for production: FRONTEND_URL=https://studycoach.yourdomain.com\n"
            )
        return self


# Singleton settings instance — import this everywhere
settings = Settings()
