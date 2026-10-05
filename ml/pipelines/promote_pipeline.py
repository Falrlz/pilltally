"""
Promote pipeline: copy the chosen run's model to models/.

1. Pick the best run in the MLflow UI (lowest val/mae).
2. Put its run id in configs/promote.yaml.
3. Run from the ml/ folder:
    uv run python -m pipelines.promote_pipeline
"""

import json
from pathlib import Path

from mlflow.tracking import MlflowClient

from src.models.promote import (
    build_model_info,
    copy_model_files,
    remove_old_model,
    write_model_info,
)
from src.models.train import get_best_weights, load_train_args
from src.utils.config import PromoteConfig, TrainConfig, load_config
from src.utils.logger import get_logger
from src.utils.paths import CONFIGS_DIR, MODELS_DIR
from src.utils.tracking import get_run_dir, setup_mlflow

logger = get_logger("pilltally.pipeline.promote")

PROMOTED_TAG = "promoted"


def run_promote(
    config_path: Path = CONFIGS_DIR / "promote.yaml",
    train_config_path: Path = CONFIGS_DIR / "train.yaml",
    models_dir: Path = MODELS_DIR,
) -> Path:
    """Copy the run from promote.yaml to models/ and return model_info.json."""

    logger.info("=== Starting Promote Pipeline ===")

    # Step 1: Load settings and check that the run is complete
    logger.info("Step 1: Loading configuration and run...")
    config = load_config(config_path, PromoteConfig)
    train_config = load_config(train_config_path, TrainConfig)
    setup_mlflow(train_config.experiment_name)

    run_id = config.run_id
    run_dir = get_run_dir(run_id)
    weights_path = get_best_weights(run_dir)
    onnx_path = run_dir / "export" / "best.onnx"
    metrics_path = run_dir / "eval" / "metrics.json"

    if not metrics_path.exists():
        raise FileNotFoundError(f"{metrics_path} not found. Run evaluate first.")
    if not onnx_path.exists():
        raise FileNotFoundError(f"{onnx_path} not found. Run export first.")

    with metrics_path.open(encoding="utf-8") as file:
        eval_results = json.load(file)
    train_args = load_train_args(run_dir)

    # Step 2: Replace the model in models/
    logger.info(f"Step 2: Copying {run_dir.name} to {models_dir}...")
    remove_old_model(models_dir)
    base_name = "pilltally_" + Path(train_args["model"]).stem
    copy_model_files(weights_path, onnx_path, models_dir, base_name)

    # Step 3: Write model_info.json (includes the confidence threshold)
    logger.info("Step 3: Writing model_info.json...")
    model_info = build_model_info(
        run_id, run_dir.name, train_args["imgsz"], eval_results
    )
    info_path = write_model_info(model_info, models_dir)

    # Step 4: Mark this run as the promoted one in MLflow
    logger.info("Step 4: Updating the 'promoted' tag in MLflow...")
    client = MlflowClient()
    experiment = client.get_experiment_by_name(train_config.experiment_name)
    previous_runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        filter_string=f"tags.{PROMOTED_TAG} = 'true'",
    )
    for previous in previous_runs:
        client.set_tag(previous.info.run_id, PROMOTED_TAG, "false")
    client.set_tag(run_id, PROMOTED_TAG, "true")

    logger.info(
        f"Promoted {run_dir.name} (conf_threshold {model_info['conf_threshold']})"
    )
    logger.info("=== Promote Pipeline Completed ===")
    return info_path


if __name__ == "__main__":
    run_promote()
