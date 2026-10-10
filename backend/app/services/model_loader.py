"""Load the ONNX model and its model_info.json."""

from pathlib import Path

import onnxruntime as ort

from app.core.config import MODEL_FILE_NAME, MODEL_INFO_FILE_NAME
from app.schemas.model import ModelInfo


def get_model_path(models_dir: Path) -> Path:
    """Path of the ONNX model file."""

    return models_dir / MODEL_FILE_NAME


def load_model_info(models_dir: Path) -> ModelInfo:
    """Read and validate model_info.json."""

    info_path = models_dir / MODEL_INFO_FILE_NAME
    if not info_path.exists():
        raise FileNotFoundError(f"model_info.json not found: {info_path}")

    text = info_path.read_text(encoding="utf-8")
    return ModelInfo.model_validate_json(text)


def create_session(model_path: Path) -> ort.InferenceSession:
    """Open the ONNX model on the CPU."""

    if not model_path.exists():
        raise FileNotFoundError(f"ONNX model not found: {model_path}")

    return ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
