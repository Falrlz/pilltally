"""
Read a finished run folder (outputs/runs/<run_name>/) so it can be recorded
in MLflow again, for example after training on another machine (Kaggle).

These functions only read files and return plain values; the import
pipeline does the MLflow logging.
"""

import json
from pathlib import Path

import pandas as pd
import yaml

# Files every run folder must have
REQUIRED_FILES = ["args.yaml", "results.csv", "weights/best.pt"]

# Files that are logged as top-level artifacts (same as the Ultralytics callback)
ARTIFACT_SUFFIXES = {".png", ".jpg", ".csv", ".yaml"}


def check_run_folder(run_dir: Path) -> None:
    """Raise an error if the run folder misses a required file."""

    if not run_dir.exists():
        raise FileNotFoundError(f"Run folder not found: {run_dir}")

    for name in REQUIRED_FILES:
        if not (run_dir / name).exists():
            raise FileNotFoundError(f"Missing {name} in {run_dir}")


def metric_name(column: str) -> str:
    """MLflow-safe metric name, like Ultralytics: 'metrics/mAP50(B)' -> 'metrics/mAP50B'."""

    return column.replace("(", "").replace(")", "")


def read_train_params(run_dir: Path) -> dict[str, str]:
    """Training settings from args.yaml, as text values for MLflow params."""

    with (run_dir / "args.yaml").open(encoding="utf-8") as file:
        args = yaml.safe_load(file)

    params = {}
    for key, value in args.items():
        params[key] = str(value)
    return params


def read_epoch_metrics(run_dir: Path) -> list[tuple[int, dict[str, float]]]:
    """Loss and metrics of every epoch from results.csv.

    Returns (step, metrics) pairs. The step starts at 0, like the Ultralytics
    MLflow callback, so imported and local runs show the same x-axis.
    """

    results = pd.read_csv(run_dir / "results.csv")

    rows = []
    for _, row in results.iterrows():
        step = int(row["epoch"]) - 1
        metrics = {}
        for column in results.columns:
            if column in ["epoch", "time"]:
                continue
            metrics[metric_name(column)] = float(row[column])
        rows.append((step, metrics))
    return rows


def read_eval_metrics(run_dir: Path) -> dict[str, float]:
    """Metrics from eval/metrics.json as 'val/...' and 'test/...' names.

    Also returns 'conf_threshold'. Empty if the run was not evaluated.
    """

    metrics_path = run_dir / "eval" / "metrics.json"
    if not metrics_path.exists():
        return {}

    with metrics_path.open(encoding="utf-8") as file:
        results = json.load(file)

    metrics = {"conf_threshold": float(results["conf_threshold"])}
    for split in ["val", "test"]:
        for name, value in results[split].items():
            metrics[f"{split}/{name}"] = float(value)
    return metrics


def read_export_metrics(run_dir: Path) -> dict[str, float]:
    """ONNX size, parity mismatches and benchmark speed. Empty if not exported."""

    export_dir = run_dir / "export"
    onnx_path = export_dir / "best.onnx"
    if not onnx_path.exists():
        return {}

    metrics = {"export/onnx_size_mb": onnx_path.stat().st_size / (1024 * 1024)}

    parity_path = export_dir / "parity.csv"
    if parity_path.exists():
        parity = pd.read_csv(parity_path)
        n_mismatch = 0
        for same in parity["same"]:
            if not same:
                n_mismatch += 1
        metrics["export/parity_mismatches"] = float(n_mismatch)

    benchmark_path = export_dir / "benchmark.csv"
    if benchmark_path.exists():
        benchmark = pd.read_csv(benchmark_path)
        for _, row in benchmark.iterrows():
            metrics[f"benchmark/latency_ms_{row['format']}"] = float(row["latency_ms"])
            metrics[f"benchmark/fps_{row['format']}"] = float(row["fps"])

    return metrics


def list_top_level_artifacts(run_dir: Path) -> list[Path]:
    """Plots, results.csv and args.yaml directly inside the run folder."""

    files = []
    for path in sorted(run_dir.iterdir()):
        if path.is_file() and path.suffix in ARTIFACT_SUFFIXES:
            files.append(path)
    return files
