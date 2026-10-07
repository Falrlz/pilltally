"""
Backend settings, read from environment variables with the PILLTALLY_ prefix.

Example: PILLTALLY_MAX_UPLOAD_MB=20 changes max_upload_mb to 20.
Model settings (imgsz, conf_threshold) are NOT here: they come from
model_info.json so they always match the model.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ folder (this file is backend/app/core/config.py)
BACKEND_DIR = Path(__file__).resolve().parents[2]

# Promoted model from the ML pipeline
DEFAULT_MODELS_DIR = BACKEND_DIR.parent / "ml" / "models"

# File names inside models_dir
MODEL_FILE_NAME = "pilltally_yolo26n.onnx"
MODEL_INFO_FILE_NAME = "model_info.json"


class Settings(BaseSettings):
    """Settings that can be changed without changing code."""

    model_config = SettingsConfigDict(
        env_prefix="PILLTALLY_", env_file=BACKEND_DIR / ".env"
    )

    models_dir: Path = DEFAULT_MODELS_DIR
    cors_origins: list[str] = ["http://localhost:5173"]
    max_upload_mb: int = 10


settings = Settings()
