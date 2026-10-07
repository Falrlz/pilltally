"""Sample data shared by the tests that use the real model."""

from app.core.config import settings
from app.services.model_loader import get_model_path

# A test image from the ML split with 7 pills (the model counts it correctly)
SAMPLE_IMAGE = (
    settings.models_dir.parent
    / "data"
    / "splits"
    / "images"
    / "test"
    / "cp_no_error_image_20250422_100910_jpg.rf.06d0b876c5069c19a4a5810e951a407f.jpg"
)
SAMPLE_COUNT = 7

# Tests with the real model are skipped when these files are missing (e.g. CI)
MODEL_FILES_EXIST = (
    get_model_path(settings.models_dir).exists() and SAMPLE_IMAGE.exists()
)
