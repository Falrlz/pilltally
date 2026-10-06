"""
MLflow setup helpers.

All MLflow data (database and artifacts) is kept in outputs/mlflow/.
"""

import os
from pathlib import Path

import mlflow
from mlflow.tracking import MlflowClient

from src.utils.paths import MLFLOW_ARTIFACTS_DIR, MLFLOW_DB_PATH, MLFLOW_DIR

# Tag that stores the run folder (outputs/runs/<run_name>) on every training run
RUN_DIR_TAG = "run_dir"


def get_tracking_uri() -> str:
    """Return the SQLite tracking URI inside outputs/mlflow/."""

    return f"sqlite:///{MLFLOW_DB_PATH.as_posix()}"


def setup_mlflow(experiment_name: str) -> None:
    """Point MLflow to outputs/mlflow/ and select (or create) the experiment."""

    MLFLOW_DIR.mkdir(parents=True, exist_ok=True)
    tracking_uri = get_tracking_uri()

    # The Ultralytics MLflow callback reads these two variables. Setting them
    # here makes it log into the same database and experiment as we do.
    os.environ["MLFLOW_TRACKING_URI"] = tracking_uri
    os.environ["MLFLOW_EXPERIMENT_NAME"] = experiment_name

    mlflow.set_tracking_uri(tracking_uri)

    # Create the experiment ourselves so its artifacts go to outputs/mlflow/
    experiment = mlflow.get_experiment_by_name(experiment_name)
    if experiment is None:
        mlflow.create_experiment(
            experiment_name,
            artifact_location=MLFLOW_ARTIFACTS_DIR.as_uri(),
        )

    mlflow.set_experiment(experiment_name)


def get_latest_run_id(experiment_name: str) -> str:
    """Return the id of the most recent finished training run."""

    client = MlflowClient()
    experiment = client.get_experiment_by_name(experiment_name)
    if experiment is None:
        raise ValueError(f"MLflow experiment not found: {experiment_name}")

    runs = client.search_runs(
        experiment_ids=[experiment.experiment_id],
        filter_string=f"attributes.status = 'FINISHED' and tags.{RUN_DIR_TAG} != ''",
        order_by=["attributes.start_time DESC"],
        max_results=1,
    )
    if len(runs) == 0:
        raise ValueError(f"No finished training run in experiment: {experiment_name}")

    return runs[0].info.run_id


def get_run_dir(run_id: str) -> Path:
    """Return the outputs/runs/<run_name> folder of a training run."""

    run = MlflowClient().get_run(run_id)
    run_dir = run.data.tags.get(RUN_DIR_TAG)
    if run_dir is None:
        raise ValueError(f"Run {run_id} has no '{RUN_DIR_TAG}' tag")

    return Path(run_dir)


def resolve_run_id(run_id: str | None, experiment_name: str) -> str:
    """Return run_id, or the latest finished training run when it is None."""

    if run_id is not None:
        return run_id
    return get_latest_run_id(experiment_name)
