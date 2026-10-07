"""Shape of a prediction result."""

from pydantic import BaseModel


class Box(BaseModel):
    """One detected pill, in pixels of the original image."""

    x1: float
    y1: float
    x2: float
    y2: float
    score: float


class PredictResponse(BaseModel):
    """Pill count of one image."""

    count: int
    boxes: list[Box]
    image_width: int
    image_height: int
    conf_threshold: float
    inference_ms: float
