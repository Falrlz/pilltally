"""
Import pipeline: record a run folder trained elsewhere (e.g. Kaggle) in the
local MLflow database.

1. Extract the downloaded zip to outputs/runs/<run_name>/.
2. Put the folder name in configs/import_run.yaml.
3. Run from the ml/ folder:
    uv run python -m pipelines.import_run_pipeline

The imported run looks like a local run, so evaluate, export and promote
work on it as usual.
"""

from pathlib import Path

import mlflow
from mlflow.tracking import MlflowClient

from src.utils.config import ImportRunConfig, TrainConfig, load_config
from src.utils.logger import get_logger
from src.utils.paths import CONFIGS_DIR, DATA_YAML_PATH, MANIFEST_PATH, RUNS_DIR
from src.utils.run_import import (
    check_run_folder,
    list_top_level_artifacts,
    read_epoch_metrics,
    read_eval_metrics,
    read_export_metrics,
    read_train_params,
)
from src.utils.tracking import RUN_DIR_TAG, setup_mlflow

logger = get_logger("pilltally.pipeline.import_run")


def run_import(
    config_path: Path = CONFIGS_DIR / "import_run.yaml",
    train_config_path: Path = CONFIGS_DIR / "train.yaml",
) -> str:
    """Record outputs/runs/<run_name>/ in MLflow and return the new run id."""

    logger.info("=== Starting Import Pipeline ===")

    # Step 1: Load settings and check the run folder
    logger.info("Step 1: Loading configuration and checking the run folder...")
    config = load_config(config_path, ImportRunConfig)
    train_config = load_config(train_config_path, TrainConfig)
    run_dir = RUNS_DIR / config.run_name
    check_run_folder(run_dir)

    # Step 2: Connect to MLflow and refuse to import the same run twice
    logger.info("Step 2: Setting up MLflow...")
    setup_mlflow(train_config.experiment_name)
    client = MlflowClient()
    experiment = client.get_experiment_by_name(train_config.experiment_name)
    existing = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        filter_string=f"tags.mlflow.runName = '{config.run_name}'",
    )
    if len(existing) > 0:
        raise ValueError(
            f"A run named '{config.run_name}' is already in MLflow "
            f"(run id {existing[0].info.run_id})."
        )

    # Step 3: Read everything from the run folder
    logger.info("Step 3: Reading the run folder...")
    params = read_train_params(run_dir)
    epoch_metrics = read_epoch_metrics(run_dir)
    eval_metrics = read_eval_metrics(run_dir)
    export_metrics = read_export_metrics(run_dir)
    logger.info(
        f"{len(params)} params, {len(epoch_metrics)} epochs, "
        f"{len(eval_metrics)} eval metrics, {len(export_metrics)} export metrics"
    )

    # Step 4: Write one MLflow run with the same content as a local run
    logger.info("Step 4: Logging to MLflow...")
    with mlflow.start_run(run_name=config.run_name) as run:
        mlflow.set_tags(
            {
                RUN_DIR_TAG: str(run_dir),
                "model": Path(params["model"]).stem,
                "sanity_run": "False",
                "source": config.source,
            }
        )
        mlflow.log_params(params)

        for step, metrics in epoch_metrics:
            mlflow.log_metrics(metrics, step=step)
        if len(eval_metrics) > 0:
            mlflow.log_metrics(eval_metrics)
        if len(export_metrics) > 0:
            mlflow.log_metrics(export_metrics)

        mlflow.log_artifacts(str(run_dir / "weights"), artifact_path="weights")
        for path in list_top_level_artifacts(run_dir):
            mlflow.log_artifact(str(path))
        if (run_dir / "eval").exists():
            mlflow.log_artifacts(str(run_dir / "eval"), artifact_path="eval")
        if (run_dir / "export").exists():
            mlflow.log_artifacts(str(run_dir / "export"), artifact_path="export")
        mlflow.log_artifact(str(DATA_YAML_PATH), artifact_path="data")
        mlflow.log_artifact(str(MANIFEST_PATH), artifact_path="data")

        run_id = run.info.run_id

    logger.info(f"Imported {config.run_name} as MLflow run {run_id}")
    logger.info("=== Import Pipeline Completed ===")
    return run_id


if __name__ == "__main__":
    run_import()
