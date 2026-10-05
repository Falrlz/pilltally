"""
Copy the chosen model into models/ together with model_info.json.

models/ always holds exactly one model: the one used by the application.
"""

import json
import shutil
from datetime import date
from pathlib import Path

MODEL_INFO_NAME = "model_info.json"
MODEL_SUFFIXES = {".pt", ".onnx"}


def remove_old_model(models_dir: Path) -> None:
    """Delete the previous model files and model_info.json (keep .gitkeep)."""

    if not models_dir.exists():
        return

    for path in models_dir.iterdir():
        if path.suffix in MODEL_SUFFIXES or path.name == MODEL_INFO_NAME:
            path.unlink()


def copy_model_files(
    weights_path: Path, onnx_path: Path, models_dir: Path, base_name: str
) -> tuple[Path, Path]:
    """Copy best.pt and best.onnx to models/<base_name>.pt and .onnx."""

    models_dir.mkdir(parents=True, exist_ok=True)
    pt_target = models_dir / f"{base_name}.pt"
    onnx_target = models_dir / f"{base_name}.onnx"
    shutil.copy2(weights_path, pt_target)
    shutil.copy2(onnx_path, onnx_target)
    return pt_target, onnx_target


def build_model_info(
    run_id: str, run_name: str, imgsz: int, eval_results: dict
) -> dict:
    """Collect what the application needs to know about the model."""

    return {
        "run_id": run_id,
        "run_name": run_name,
        "promoted_at": date.today().isoformat(),
        "imgsz": imgsz,
        "conf_threshold": eval_results["conf_threshold"],
        "val": eval_results["val"],
        "test": eval_results["test"],
    }


def write_model_info(model_info: dict, models_dir: Path) -> Path:
    """Write models/model_info.json."""

    info_path = models_dir / MODEL_INFO_NAME
    with info_path.open("w", encoding="utf-8") as file:
        json.dump(model_info, file, indent=2)
    return info_path
