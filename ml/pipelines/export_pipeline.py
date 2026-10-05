"""
Export pipeline: ONNX export, PyTorch/ONNX parity check and speed benchmark.

Run from the ml/ folder after the evaluate pipeline (uses the latest run):
    uv run python -m pipelines.export_pipeline
"""

import json
from pathlib import Path

import mlflow
import pandas as pd
from ultralytics import YOLO

from src.evaluation.benchmark import measure_latency
from src.models.export import check_parity, export_onnx
from src.models.train import get_best_weights, load_train_args
from src.utils.config import ExportConfig, TrainConfig, load_config
from src.utils.logger import get_logger
from src.utils.paths import CONFIGS_DIR, MANIFEST_PATH, SPLITS_DIR
from src.utils.tracking import get_run_dir, resolve_run_id, setup_mlflow

logger = get_logger("pilltally.pipeline.export")


def run_export(
    run_id: str | None = None,
    config_path: Path = CONFIGS_DIR / "export.yaml",
    train_config_path: Path = CONFIGS_DIR / "train.yaml",
) -> Path:
    """Export a training run (latest one if run_id is None) and return the ONNX path."""

    logger.info("=== Starting Export Pipeline ===")

    # Step 1: Load settings, find the run and its chosen threshold
    logger.info("Step 1: Loading configuration and run...")
    config = load_config(config_path, ExportConfig)
    train_config = load_config(train_config_path, TrainConfig)
    setup_mlflow(train_config.experiment_name)

    run_id = resolve_run_id(run_id, train_config.experiment_name)
    run_dir = get_run_dir(run_id)
    export_dir = run_dir / "export"
    weights_path = get_best_weights(run_dir)
    imgsz = load_train_args(run_dir)["imgsz"]

    metrics_path = run_dir / "eval" / "metrics.json"
    if not metrics_path.exists():
        raise FileNotFoundError(
            f"{metrics_path} not found. Run pipelines.evaluate_pipeline first."
        )
    with metrics_path.open(encoding="utf-8") as file:
        threshold = json.load(file)["conf_threshold"]
    logger.info(f"Run {run_id} ({run_dir.name}), imgsz={imgsz}, conf={threshold}")

    # Step 2: Export best.pt to ONNX
    logger.info("Step 2: Exporting to ONNX...")
    onnx_path = export_onnx(
        weights_path,
        imgsz=imgsz,
        dynamic=config.dynamic,
        simplify=config.simplify,
        quantize=config.quantize,
        out_dir=export_dir,
    )
    onnx_size_mb = onnx_path.stat().st_size / (1024 * 1024)
    logger.info(f"ONNX model: {onnx_path} ({onnx_size_mb:.2f} MB)")

    # Step 3: Check that PyTorch and ONNX give the same counts
    logger.info("Step 3: Checking PyTorch vs ONNX counts...")
    manifest = pd.read_csv(MANIFEST_PATH, keep_default_na=False)
    val_files = sorted(manifest[manifest["split"] == "val"]["new_file"])
    image_paths = []
    for file_name in val_files[: config.parity_images]:
        image_paths.append(SPLITS_DIR / "images" / "val" / file_name)

    parity = check_parity(weights_path, onnx_path, image_paths, imgsz, threshold)
    parity.to_csv(export_dir / "parity.csv", index=False)
    n_mismatch = int((~parity["same"]).sum())
    if n_mismatch > 0:
        logger.warning(f"{n_mismatch} of {len(parity)} images have different counts")
    else:
        logger.info(f"All {len(parity)} images have the same count")

    # Step 4: Speed benchmark on CPU
    logger.info("Step 4: Benchmarking PyTorch and ONNX on CPU...")
    rows = []
    for name, model in [
        ("pytorch", YOLO(str(weights_path))),
        ("onnx", YOLO(str(onnx_path), task="detect")),
    ]:
        speed = measure_latency(
            model,
            image_paths,
            imgsz,
            warmup=config.benchmark_warmup,
            repeats=config.benchmark_repeats,
        )
        rows.append({"format": name, "device": "cpu", **speed})
        logger.info(
            f"{name}: {speed['latency_ms']:.1f} ms/image, {speed['fps']:.1f} FPS"
        )
    benchmark = pd.DataFrame(rows)
    benchmark.to_csv(export_dir / "benchmark.csv", index=False)

    # Step 5: Add everything to the training run in MLflow
    logger.info("Step 5: Logging to MLflow...")
    with mlflow.start_run(run_id=run_id):
        mlflow.log_metric("export/onnx_size_mb", onnx_size_mb)
        mlflow.log_metric("export/parity_mismatches", n_mismatch)
        for row in rows:
            mlflow.log_metric(
                f"benchmark/latency_ms_{row['format']}", row["latency_ms"]
            )
            mlflow.log_metric(f"benchmark/fps_{row['format']}", row["fps"])
        mlflow.log_artifact(str(config_path), artifact_path="config")
        mlflow.log_artifacts(str(export_dir), artifact_path="export")

    logger.info("=== Export Pipeline Completed ===")
    return onnx_path


if __name__ == "__main__":
    run_export()
