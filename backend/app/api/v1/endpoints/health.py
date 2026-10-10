"""GET /health: is the server up and is the model loaded?"""

from fastapi import APIRouter, Request

from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def get_health(request: Request) -> HealthResponse:
    """status is "ok" when the model is loaded, otherwise "degraded"."""

    model_loaded = request.app.state.predictor is not None

    status = "ok" if model_loaded else "degraded"

    return HealthResponse(status=status, model_loaded=model_loaded)
