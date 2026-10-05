"""
Export a trained model to ONNX and check that it gives the same counts.
"""

import shutil
from pathlib import Path

import pandas as pd
from ultralytics import YOLO

from src.evaluation.evaluate import count_boxes


def export_onnx(
    weights_path: Path,
    imgsz: int,
    dynamic: bool,
    simplify: bool,
    quantize: int | None,
    out_dir: Path,
) -> Path:
    """Export best.pt to ONNX and move the file to out_dir/best.onnx."""

    model = YOLO(str(weights_path))
    exported = model.export(
        format="onnx",
        imgsz=imgsz,
        dynamic=dynamic,
        simplify=simplify,
        quantize=quantize,
    )

    out_dir.mkdir(parents=True, exist_ok=True)
    onnx_path = out_dir / "best.onnx"
    shutil.move(str(exported), str(onnx_path))
    return onnx_path


def count_per_image(
    model: YOLO, image_paths: list[Path], imgsz: int, threshold: float
) -> list[int]:
    """Predicted pill count of every image."""

    counts = []
    for path in image_paths:
        result = model.predict(
            source=str(path), imgsz=imgsz, conf=threshold, verbose=False
        )[0]
        counts.append(count_boxes(result.boxes.conf.tolist(), threshold))
    return counts


def check_parity(
    weights_path: Path,
    onnx_path: Path,
    image_paths: list[Path],
    imgsz: int,
    threshold: float,
) -> pd.DataFrame:
    """Compare PyTorch and ONNX counts on the same images.

    Returns one row per image: file, pt_count, onnx_count, same.
    """

    pt_model = YOLO(str(weights_path))
    onnx_model = YOLO(str(onnx_path), task="detect")

    pt_counts = count_per_image(pt_model, image_paths, imgsz, threshold)
    onnx_counts = count_per_image(onnx_model, image_paths, imgsz, threshold)

    files = []
    same = []
    for path, pt_count, onnx_count in zip(
        image_paths, pt_counts, onnx_counts, strict=True
    ):
        files.append(path.name)
        same.append(pt_count == onnx_count)

    return pd.DataFrame(
        {
            "file": files,
            "pt_count": pt_counts,
            "onnx_count": onnx_counts,
            "same": same,
        }
    )
