"""
Configuration schemas and loader.

Each YAML file in configs/ has one Pydantic class here. Loading a YAML file
through its class checks the types right away, so a typo such as
`epochs: "fifty"` fails before any work starts.
"""

from pathlib import Path
from typing import TypeVar

import yaml
from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    """Base class that rejects unknown keys (catches misspelled settings)."""

    model_config = ConfigDict(extra="forbid")


# ---------------------------------------------------------------------------
# configs/datasets.yaml
# ---------------------------------------------------------------------------
class DirectDataset(StrictModel):
    """Dataset downloaded as a zip archive from a URL."""

    name: str = Field(description="Target directory name in data/raw")
    url: str = Field(description="Download URL of the zip file")
    format: str = Field(default="yolo26", description="Annotation format")


class RoboflowDataset(StrictModel):
    """Dataset downloaded from Roboflow Universe."""

    name: str = Field(description="Target directory name in data/raw")
    workspace: str = Field(description="Roboflow workspace slug")
    project: str = Field(description="Roboflow project slug")
    version: int = Field(description="Dataset version number")
    format: str = Field(default="yolo26", description="Target export format")


class DatasetsConfig(StrictModel):
    """Settings for the download pipeline."""

    direct_datasets: list[DirectDataset] = Field(default_factory=list)
    roboflow_datasets: list[RoboflowDataset] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# configs/preprocess.yaml
# ---------------------------------------------------------------------------
class PreprocessConfig(StrictModel):
    """Settings for the data preparation pipeline."""

    seed: int
    split_ratio: tuple[int, int, int] = Field(
        description="train:val:test ratio for Pill Detection"
    )
    medical_pills_test_fraction: float = Field(gt=0, lt=1)
    class_name: str
    overwrite: bool
    prefixes: dict[str, str] = Field(description="Dataset name -> file prefix")


# ---------------------------------------------------------------------------
# configs/train.yaml
# ---------------------------------------------------------------------------
class TrainConfig(StrictModel):
    """Settings for the training pipeline."""

    experiment_name: str
    run_name: str
    model: str
    epochs: int = Field(gt=0)
    patience: int = Field(ge=0)
    freeze: int | None = Field(default=None, ge=0)
    imgsz: int = Field(gt=0)
    batch: int
    seed: int
    deterministic: bool
    device: str | int | None = None
    sanity_run: bool


# ---------------------------------------------------------------------------
# configs/evaluate.yaml
# ---------------------------------------------------------------------------
class EvaluateConfig(StrictModel):
    """Settings for the evaluation pipeline."""

    conf_grid: list[float] = Field(min_length=1)
    num_error_examples: int = Field(ge=0)


# ---------------------------------------------------------------------------
# configs/export.yaml
# ---------------------------------------------------------------------------
class ExportConfig(StrictModel):
    """Settings for the export pipeline."""

    dynamic: bool
    simplify: bool
    quantize: int | None = Field(default=None, description="None=FP32, 16=FP16")
    parity_images: int = Field(gt=0)
    benchmark_warmup: int = Field(ge=0)
    benchmark_repeats: int = Field(gt=0)


# ---------------------------------------------------------------------------
# configs/promote.yaml
# ---------------------------------------------------------------------------
class PromoteConfig(StrictModel):
    """Settings for the promote pipeline."""

    run_id: str = Field(min_length=1)


# ---------------------------------------------------------------------------
# configs/import_run.yaml
# ---------------------------------------------------------------------------
class ImportRunConfig(StrictModel):
    """Settings for the import_run pipeline."""

    run_name: str = Field(min_length=1)
    source: str


# ---------------------------------------------------------------------------
# Loader
# ---------------------------------------------------------------------------
ConfigT = TypeVar("ConfigT", bound=BaseModel)


def load_config(config_path: Path, schema: type[ConfigT]) -> ConfigT:
    """Read a YAML file and validate it against a schema class."""

    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")

    with config_path.open(encoding="utf-8") as file:
        data = yaml.safe_load(file)

    return schema.model_validate(data)
