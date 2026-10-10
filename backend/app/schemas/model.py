"""Shape of model_info.json (written by the ML promote pipeline)."""

from pydantic import BaseModel


class ModelInfo(BaseModel):
    """Information about the promoted model."""

    run_id: str
    run_name: str
    promoted_at: str
    imgsz: int
    conf_threshold: float
    val: dict[str, float]
    test: dict[str, float]
