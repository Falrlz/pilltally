"""
Training pipeline: train yolo26n and track the run in MLflow.

Run from the ml/ folder:
    uv run python -m pipelines.train_pipeline
"""

from pathlib import Path

import mlflow
import pandas as pd

from src.models.train import train_yolo
from src.utils.config import TrainConfig, load_config
from src.utils.logger import get_logger
from src.utils.paths import (
    CONFIGS_DIR,
    DATA_YAML_PATH,
    MANIFEST_PATH,
    PRETRAINED_DIR,
    RUNS_DIR,
    SPLITS,
)
from src.utils.tracking import RUN_DIR_TAG, setup_mlflow

logger = get_logger("pilltally.pipeline.train")


def run_train(config_path: Path = CONFIGS_DIR / "train.yaml") -> str:
    """Train one scenario and return its MLflow run id."""

    logger.info("=== Starting Training Pipeline ===")

    # Step 1: Load settings and check the inputs
    logger.info("Step 1: Loading configuration...")
    config = load_config(config_path, TrainConfig)

    if not DATA_YAML_PATH.exists():
        raise FileNotFoundError(
            f"{DATA_YAML_PATH} not found. Run pipelines.data_prep_pipeline first."
        )

    run_dir = RUNS_DIR / config.run_name
    if run_dir.exists():
        raise FileExistsError(
            f"{run_dir} already exists. Use a new 'run_name' in train.yaml."
        )

    # Step 2: Connect to MLflow (outputs/mlflow/)
    logger.info("Step 2: Setting up MLflow...")
    setup_mlflow(config.experiment_name)

    # Step 3: Train inside our own MLflow run. The Ultralytics MLflow callback
    # logs params, per-epoch metrics, weights and plots into this active run.
    with mlflow.start_run(run_name=config.run_name) as run:
        mlflow.set_tags(
            {
                RUN_DIR_TAG: str(run_dir),
                "model": Path(config.model).stem,
                "sanity_run": str(config.sanity_run),
            }
        )

        logger.info(f"Step 3: Training {config.model} ({config.run_name})...")
        best_path = train_yolo(config, DATA_YAML_PATH, RUNS_DIR, PRETRAINED_DIR)
        logger.info(f"Best weights: {best_path}")

        # Step 4: Record which data and settings produced this run
        logger.info("Step 4: Logging dataset info and config files...")
        manifest = pd.read_csv(MANIFEST_PATH, keep_default_na=False)
        for split in SPLITS:
            n_images = len(manifest[manifest["split"] == split])
            mlflow.log_param(f"n_images_{split}", n_images)

        mlflow.log_artifact(str(config_path), artifact_path="config")
        mlflow.log_artifact(str(DATA_YAML_PATH), artifact_path="data")
        mlflow.log_artifact(str(MANIFEST_PATH), artifact_path="data")

        run_id = run.info.run_id

    logger.info(f"MLflow run id: {run_id}")
    logger.info("=== Training Pipeline Completed ===")
    return run_id


if __name__ == "__main__":
    run_train()
