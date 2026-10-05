"""
Full pipeline: data preparation -> training -> evaluation -> export.

Promote is not included: choosing the final model is a manual decision.

Run from the ml/ folder:
    uv run python -m pipelines.full_pipeline
"""

from pipelines.data_prep_pipeline import run_data_prep
from pipelines.evaluate_pipeline import run_evaluate
from pipelines.export_pipeline import run_export
from pipelines.train_pipeline import run_train
from src.data.dataset_builder import has_existing_files
from src.utils.config import PreprocessConfig, load_config
from src.utils.logger import get_logger
from src.utils.paths import CONFIGS_DIR, SPLITS_DIR

logger = get_logger("pilltally.pipeline.full")


def run_full_pipeline() -> str:
    """Run every stage in order and return the MLflow run id."""

    logger.info("=== RUNNING FULL PIPELINE ===")

    # Step 1: Data preparation (skipped when data/splits/ is already built,
    # unless preprocess.yaml says overwrite: true)
    logger.info("Step 1/4: Data preparation")
    preprocess_config = load_config(CONFIGS_DIR / "preprocess.yaml", PreprocessConfig)
    if has_existing_files(SPLITS_DIR) and not preprocess_config.overwrite:
        logger.info("data/splits/ already built, skipping data preparation")
    else:
        run_data_prep()

    # Step 2: Training (creates the MLflow run)
    logger.info("Step 2/4: Training")
    run_id = run_train()

    # Step 3: Evaluation (same MLflow run)
    logger.info("Step 3/4: Evaluation")
    run_evaluate(run_id)

    # Step 4: Export and benchmark (same MLflow run)
    logger.info("Step 4/4: Export")
    run_export(run_id)

    logger.info(f"=== FULL PIPELINE COMPLETED (run id {run_id}) ===")
    return run_id


if __name__ == "__main__":
    run_full_pipeline()
