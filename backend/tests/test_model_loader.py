"""Tests for app/services/model_loader.py."""

import json
from pathlib import Path

import pytest

from app.services.model_loader import create_session, load_model_info


def write_model_info(folder: Path) -> None:
    info = {
        "run_id": "abc",
        "run_name": "test_run",
        "promoted_at": "2026-10-07",
        "imgsz": 640,
        "conf_threshold": 0.65,
        "val": {"mae": 0.03},
        "test": {"mae": 0.01},
    }
    (folder / "model_info.json").write_text(json.dumps(info), encoding="utf-8")


def test_load_model_info_reads_values(tmp_path: Path):
    write_model_info(tmp_path)

    info = load_model_info(tmp_path)

    assert info.imgsz == 640
    assert info.conf_threshold == 0.65
    assert info.test["mae"] == 0.01


def test_load_model_info_missing_file(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        load_model_info(tmp_path)


def test_create_session_missing_file(tmp_path: Path):
    with pytest.raises(FileNotFoundError):
        create_session(tmp_path / "missing.onnx")
