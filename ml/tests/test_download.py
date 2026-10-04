"""
Unit and integration tests for dataset download configuration and connectivity.
"""

import os

import pytest
from dotenv import load_dotenv
from pydantic import ValidationError

from src.data.download import (
    CONFIG_FILE,
    DirectDataset,
    check_direct_dataset,
    check_roboflow_dataset,
    load_config,
)

load_dotenv()


def test_config_file_exists():
    """Verify that configs/datasets.yaml exists."""
    assert CONFIG_FILE.exists(), f"Config file not found at {CONFIG_FILE}"


def test_config_pydantic_schema_validation():
    """Verify that datasets.yaml validates against DatasetsConfig Pydantic schema."""
    config = load_config(CONFIG_FILE)
    assert len(config.direct_datasets) == 1, "Expected 1 direct dataset"
    assert len(config.roboflow_datasets) == 2, "Expected 2 Roboflow datasets"
    assert config.direct_datasets[0].name == "medical-pills"
    assert config.raw_dir == "data/raw"


def test_pydantic_schema_rejection_on_invalid_data():
    """Verify that invalid schema raises Pydantic ValidationError."""
    with pytest.raises(ValidationError):
        # Missing required fields like url
        DirectDataset(name="invalid_item")


def test_roboflow_api_key_loaded():
    """Verify that ROBOFLOW_API_KEY is present in environment."""
    api_key = os.getenv("ROBOFLOW_API_KEY", "").strip()
    assert api_key, "ROBOFLOW_API_KEY is empty or not found in .env"


def test_direct_dataset_url_accessibility():
    """Verify that the medical-pills zip URL returns HTTP 200."""
    config = load_config(CONFIG_FILE)
    dataset = config.direct_datasets[0]
    ok, message = check_direct_dataset(dataset)
    assert ok is True, f"Direct download check failed: {message}"
    assert "HTTP 200 OK" in message


def test_roboflow_connectivity():
    """Verify that Roboflow projects are accessible using the configured API key."""
    api_key = os.getenv("ROBOFLOW_API_KEY", "").strip()
    config = load_config(CONFIG_FILE)

    # Test the first Roboflow dataset for fast connectivity verification
    first_rf = config.roboflow_datasets[0]
    ok, message = check_roboflow_dataset(first_rf, api_key)
    assert ok is True, f"Roboflow connectivity failed for {first_rf.name}: {message}"
