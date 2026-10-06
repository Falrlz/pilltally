"""
Tests for src/utils/run_import.py (a small fake run folder in tmp_path).
"""

import json
from pathlib import Path

import pytest

from src.utils.run_import import (
    check_run_folder,
    metric_name,
    read_epoch_metrics,
    read_eval_metrics,
    read_export_metrics,
    read_train_params,
)


def make_run_folder(run_dir: Path) -> None:
    """Write the minimum files of a run folder."""
    (run_dir / "weights").mkdir(parents=True)
    (run_dir / "weights" / "best.pt").write_bytes(b"fake")
    (run_dir / "args.yaml").write_text("model: yolo26n.pt\nimgsz: 640\n")
    (run_dir / "results.csv").write_text(
        "epoch,time,train/box_loss,metrics/mAP50(B)\n1,80.0,0.8,0.90\n2,160.0,0.7,0.95\n"
    )


def test_check_run_folder_missing_file(tmp_path):
    """A folder without best.pt is rejected."""
    (tmp_path / "args.yaml").write_text("imgsz: 640\n")
    with pytest.raises(FileNotFoundError):
        check_run_folder(tmp_path)


def test_metric_name_removes_brackets():
    """Same naming as the Ultralytics MLflow callback."""
    assert metric_name("metrics/mAP50-95(B)") == "metrics/mAP50-95B"


def test_read_train_params_as_text(tmp_path):
    """Every value becomes text."""
    make_run_folder(tmp_path)
    params = read_train_params(tmp_path)
    assert params == {"model": "yolo26n.pt", "imgsz": "640"}


def test_read_epoch_metrics_steps_start_at_zero(tmp_path):
    """Epoch 1 -> step 0; 'epoch' and 'time' are not metrics."""
    make_run_folder(tmp_path)

    rows = read_epoch_metrics(tmp_path)

    assert len(rows) == 2
    step, metrics = rows[0]
    assert step == 0
    assert metrics == {"train/box_loss": 0.8, "metrics/mAP50B": 0.9}


def test_read_eval_metrics(tmp_path):
    """metrics.json -> conf_threshold + val/... + test/..."""
    (tmp_path / "eval").mkdir()
    results = {"conf_threshold": 0.5, "val": {"mae": 0.04}, "test": {"mae": 0.01}}
    (tmp_path / "eval" / "metrics.json").write_text(json.dumps(results))

    metrics = read_eval_metrics(tmp_path)

    assert metrics == {"conf_threshold": 0.5, "val/mae": 0.04, "test/mae": 0.01}


def test_read_eval_and_export_metrics_empty_when_missing(tmp_path):
    """A run that was not evaluated or exported gives no metrics."""
    assert read_eval_metrics(tmp_path) == {}
    assert read_export_metrics(tmp_path) == {}


def test_read_export_metrics(tmp_path):
    """Parity mismatches are counted and benchmark rows become metrics."""
    export_dir = tmp_path / "export"
    export_dir.mkdir()
    (export_dir / "best.onnx").write_bytes(b"x" * 1024)
    (export_dir / "parity.csv").write_text(
        "file,pt_count,onnx_count,same\na.jpg,3,3,True\nb.jpg,2,3,False\n"
    )
    (export_dir / "benchmark.csv").write_text(
        "format,device,latency_ms,fps\nonnx,cpu,50.0,20.0\n"
    )

    metrics = read_export_metrics(tmp_path)

    assert metrics["export/parity_mismatches"] == 1
    assert metrics["benchmark/latency_ms_onnx"] == 50.0
    assert metrics["benchmark/fps_onnx"] == 20.0
