"""Shape of the /health response."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Server status and whether the model is ready."""

    status: str
    model_loaded: bool
