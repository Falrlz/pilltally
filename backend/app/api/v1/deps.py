"""
Shared helpers for endpoints: get the loaded model from app.state.

The model is loaded once at startup (see app/main.py). If loading failed,
app.state.predictor is None and these helpers answer 503.
"""

from fastapi import HTTPException, Request, status

from app.services.predictor import Predictor


def get_predictor(request: Request) -> Predictor:
    """The loaded Predictor, or 503 if the model is not loaded."""

    predictor = request.app.state.predictor
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded",
        )
    return predictor
