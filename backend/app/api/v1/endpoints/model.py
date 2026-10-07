"""
GET /api/v1/model/info: model_info.json (threshold, metrics)
GET /api/v1/model/file: the ONNX file for the browser
"""

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from app.api.v1.deps import get_predictor
from app.core.config import settings
from app.schemas.model import ModelInfo
from app.services.model_loader import get_model_path
from app.services.predictor import Predictor

router = APIRouter()

# Cache rules for the model file:
# - with ?v=<run_id>: the file for that run never changes -> keep for 1 year
# - without ?v: the browser must ask the server each time if it changed
CACHE_FOREVER = "public, max-age=31536000, immutable"
CACHE_REVALIDATE = "no-cache"


@router.get("/model/info", response_model=ModelInfo)
def get_model_info(predictor: Predictor = Depends(get_predictor)) -> ModelInfo:
    """Information about the loaded model."""

    return predictor.info


@router.get("/model/file")
def get_model_file(
    v: str | None = None,
    predictor: Predictor = Depends(get_predictor),
) -> FileResponse:
    """
    Download the ONNX model.

    The frontend calls /model/file?v=<run_id> (run_id from /model/info).
    A new model has a new run_id, so the browser downloads it again.
    """

    is_current_version = v == predictor.info.run_id
    cache_control = CACHE_FOREVER if is_current_version else CACHE_REVALIDATE

    return FileResponse(
        get_model_path(settings.models_dir),
        media_type="application/octet-stream",
        headers={"Cache-Control": cache_control},
    )
