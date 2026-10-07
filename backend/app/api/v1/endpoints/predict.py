"""POST /api/v1/predict: count pills in one uploaded image."""

import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.v1.deps import get_predictor
from app.core.config import settings
from app.schemas.predict import PredictResponse
from app.services.image_processor import (
    InvalidAreaError,
    InvalidImageError,
    Point,
    decode_image,
)
from app.services.predictor import Predictor

router = APIRouter()


def parse_area(text: str) -> list[Point]:
    """
    Turn the area form field into 4 points.

    Expected: JSON like [[10, 20], [300, 20], [300, 400], [10, 400]]
    """

    try:
        data = json.loads(text)
    except json.JSONDecodeError as error:
        raise InvalidAreaError("Area is not valid JSON") from error

    if not isinstance(data, list) or len(data) != 4:
        raise InvalidAreaError("Area must be a list of 4 points")

    points = []
    for item in data:
        if not isinstance(item, list) or len(item) != 2:
            raise InvalidAreaError("Each point must be [x, y]")

        x, y = item
        # bool is a subclass of int, so it is excluded on purpose
        for value in (x, y):
            if isinstance(value, bool) or not isinstance(value, int | float):
                raise InvalidAreaError("Point values must be numbers")

        points.append((float(x), float(y)))
    return points


def read_upload(file: UploadFile, max_bytes: int) -> bytes:
    """Read the uploaded file, or 413 if it is larger than max_bytes."""

    # Read one byte more than allowed: if we get it, the file is too large
    data = file.file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File is larger than {settings.max_upload_mb} MB",
        )
    return data


# A normal "def" (not "async def"): FastAPI runs it in a thread pool, so the
# server stays responsive while the model is running.
@router.post("/predict", response_model=PredictResponse)
def predict(
    file: UploadFile = File(...),
    area: str | None = Form(None),
    predictor: Predictor = Depends(get_predictor),
) -> PredictResponse:
    """
    Count pills in a JPEG/PNG/WebP image.

    area (optional): 4 points [[x, y], ...] in pixels of the uploaded image.
    Only pills whose box center is inside the area are counted.
    """

    max_bytes = settings.max_upload_mb * 1024 * 1024
    data = read_upload(file, max_bytes)

    try:
        image = decode_image(data)

        points = None
        if area is not None:
            points = parse_area(area)

        return predictor.predict(image, points)
    except (InvalidImageError, InvalidAreaError) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)
        ) from error
