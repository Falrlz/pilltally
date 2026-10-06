"""
Evaluation pipeline: detection and counting metrics for one training run.

Run from the ml/ folder (uses the latest finished run):
    uv run python -m pipelines.evaluate_pipeline
"""

import json
from pathlib import Path

import mlflow
import pandas as pd
from ultralytics import YOLO

from src.evaluation.evaluate import (
    build_count_table,
    detection_metrics,
    predict_confidences,
    save_error_examples,
    select_conf_threshold,
    summarize_counts,
)
from src.models.train import get_best_weights, load_train_args
from src.utils.config import EvaluateConfig, TrainConfig, load_config
from src.utils.logger import get_logger
from src.utils.paths import CONFIGS_DIR, DATA_YAML_PATH, MANIFEST_PATH, SPLITS_DIR
from src.utils.tracking import get_run_dir, resolve_run_id, setup_mlflow

logger = get_logger("pilltally.pipeline.evaluate")

EVAL_SPLITS = ["val", "test"]


def run_evaluate(
    run_id: str | None = None,
    config_path: Path = CONFIGS_DIR / "evaluate.yaml",
    train_config_path: Path = CONFIGS_DIR / "train.yaml",
) -> dict:
    """Evaluate a training run (latest one if run_id is None) and return the metrics."""

    logger.info("=== Starting Evaluation Pipeline ===")

    # Step 1: Load settings and find the run
    logger.info("Step 1: Loading configuration and run...")
    config = load_config(config_path, EvaluateConfig)
    train_config = load_config(train_config_path, TrainConfig)
    setup_mlflow(train_config.experiment_name)

    run_id = resolve_run_id(run_id, train_config.experiment_name)
    run_dir = get_run_dir(run_id)
    eval_dir = run_dir / "eval"
    eval_dir.mkdir(parents=True, exist_ok=True)
    imgsz = load_train_args(run_dir)["imgsz"]
    logger.info(f"Run {run_id} ({run_dir.name}), imgsz={imgsz}")

    model = YOLO(str(get_best_weights(run_dir)))
    manifest = pd.read_csv(MANIFEST_PATH, keep_default_na=False)

    # Step 2: Run the model once per split at the lowest threshold
    logger.info("Step 2: Predicting val and test images...")
    min_conf = min(config.conf_grid)
    confidences = {}
    split_rows = {}
    for split in EVAL_SPLITS:
        split_rows[split] = manifest[manifest["split"] == split]
        image_paths = []
        for file_name in split_rows[split]["new_file"]:
            image_paths.append(SPLITS_DIR / "images" / split / file_name)
        confidences[split] = predict_confidences(model, image_paths, imgsz, min_conf)

    # Step 3: Choose the confidence threshold on val (never on test)
    logger.info("Step 3: Selecting the confidence threshold on val...")
    threshold, threshold_table = select_conf_threshold(
        confidences["val"],
        list(split_rows["val"]["new_file"]),
        list(split_rows["val"]["n_object"]),
        config.conf_grid,
    )
    threshold_table.to_csv(eval_dir / "threshold_search.csv", index=False)
    logger.info(f"Chosen threshold: {threshold}")

    # Step 4: Detection and counting metrics for val and test
    logger.info("Step 4: Computing detection and counting metrics...")
    results: dict = {"run_id": run_id, "conf_threshold": threshold}
    count_tables = {}
    for split in EVAL_SPLITS:
        split_metrics = detection_metrics(
            model, DATA_YAML_PATH, split, imgsz, eval_dir / split
        )

        count_tables[split] = build_count_table(
            split_rows[split], confidences[split], threshold
        )
        count_tables[split].to_csv(eval_dir / f"counts_{split}.csv", index=False)
        split_metrics.update(summarize_counts(count_tables[split]))

        results[split] = split_metrics
        logger.info(
            f"{split}: mAP50-95 {split_metrics['mAP50-95']:.3f}  "
            f"MAE {split_metrics['mae']:.3f}  "
            f"exact {split_metrics['exact_match']:.3f}  "
            f"within_1 {split_metrics['within_1']:.3f}"
        )

    # Step 5: Save the results and example images with the largest errors
    logger.info("Step 5: Saving metrics.json and error examples...")
    with (eval_dir / "metrics.json").open("w", encoding="utf-8") as file:
        json.dump(results, file, indent=2)

    save_error_examples(
        model,
        count_tables["test"],
        SPLITS_DIR / "images" / "test",
        threshold,
        imgsz,
        config.num_error_examples,
        eval_dir / "error_examples",
    )

    # Step 6: Add everything to the training run in MLflow
    logger.info("Step 6: Logging to MLflow...")
    with mlflow.start_run(run_id=run_id):
        # A metric (not a param) so evaluate can be re-run with a new threshold
        mlflow.log_metric("conf_threshold", threshold)
        for split in EVAL_SPLITS:
            for name, value in results[split].items():
                mlflow.log_metric(f"{split}/{name}", value)
        mlflow.log_artifact(str(config_path), artifact_path="config")
        mlflow.log_artifacts(str(eval_dir), artifact_path="eval")

    logger.info("=== Evaluation Pipeline Completed ===")
    return results


if __name__ == "__main__":
    run_evaluate()
