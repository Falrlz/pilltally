"""
Data preparation pipeline: combine the 3 datasets into data/splits/.

Run from the ml/ folder:
    uv run python -m pipelines.data_prep_pipeline
"""

from pathlib import Path

import pandas as pd

from src.data.data_loader import (
    load_annotation_index,
    load_duplicate_pairs,
    load_image_index,
)
from src.data.data_splitter import assign_splits
from src.data.data_validator import check_counts, check_labels, check_no_leakage
from src.data.dataset_builder import (
    add_new_file_names,
    clear_split_folders,
    copy_images,
    has_existing_files,
    write_data_yaml,
    write_labels,
    write_manifest,
)
from src.data.label_converter import build_labels
from src.utils.config import PreprocessConfig, load_config
from src.utils.logger import get_logger
from src.utils.paths import (
    BASE_DIR,
    CONFIGS_DIR,
    EDA_DIR,
    MANIFEST_PATH,
    SPLITS,
    SPLITS_DIR,
)

logger = get_logger("pilltally.pipeline.data_prep")


def run_data_prep(config_path: Path = CONFIGS_DIR / "preprocess.yaml") -> pd.DataFrame:
    """Build data/splits/ from the raw datasets and return the split manifest."""

    logger.info("=== Starting Data Preparation Pipeline ===")

    # Step 1: Load settings and make sure old files are not mixed in
    logger.info("Step 1: Loading configuration...")
    config = load_config(config_path, PreprocessConfig)

    if has_existing_files(SPLITS_DIR):
        if not config.overwrite:
            raise FileExistsError(
                f"{SPLITS_DIR} already has files. "
                "Set 'overwrite: true' in preprocess.yaml to rebuild it."
            )
        logger.info("Removing the old files in data/splits/...")
        clear_split_folders(SPLITS_DIR)

    # Step 2: Load the EDA outputs
    logger.info("Step 2: Loading EDA outputs...")
    df_img = load_image_index(EDA_DIR)
    df_ann = load_annotation_index(EDA_DIR)
    df_pairs = load_duplicate_pairs(EDA_DIR)
    logger.info(f"{len(df_img)} images, {len(df_ann)} objects")

    # Step 3: Decide the final split of every image
    logger.info("Step 3: Assigning final splits...")
    df_split = assign_splits(
        df_img,
        df_pairs,
        split_ratio=config.split_ratio,
        test_fraction=config.medical_pills_test_fraction,
        seed=config.seed,
    )
    df_split = add_new_file_names(df_split, config.prefixes)
    log_split_table(df_split)

    # Step 4: Build the YOLO label lines (all classes -> 0)
    logger.info("Step 4: Converting labels...")
    labels = build_labels(df_ann, list(df_split["path"]))

    # Step 5: Copy images and write label files
    logger.info("Step 5: Writing images and labels...")
    copy_images(df_split, BASE_DIR, SPLITS_DIR)
    write_labels(df_split, labels, SPLITS_DIR)

    # Step 6: Write data.yaml and the split manifest
    logger.info("Step 6: Writing data.yaml and split_manifest.csv...")
    write_data_yaml(SPLITS_DIR, config.class_name)
    write_manifest(df_split, MANIFEST_PATH)

    # Step 7: Validate the result
    logger.info("Step 7: Validating data/splits/...")
    manifest = pd.read_csv(MANIFEST_PATH, keep_default_na=False)
    problems = []
    problems += check_counts(manifest, SPLITS_DIR)
    problems += check_labels(manifest, SPLITS_DIR, expected_objects=len(df_ann))
    problems += check_no_leakage(manifest)

    if len(problems) > 0:
        for problem in problems[:20]:
            logger.error(problem)
        raise ValueError(f"Validation failed with {len(problems)} problem(s)")

    logger.info("All checks passed")
    logger.info("=== Data Preparation Completed ===")
    return manifest


def log_split_table(df_split: pd.DataFrame) -> None:
    """Log the number of images per dataset and split."""

    table = pd.crosstab(df_split["dataset"], df_split["split"])
    table = table.reindex(columns=SPLITS, fill_value=0)
    table.loc["Total"] = table.sum()
    for name, row in table.iterrows():
        logger.info(
            f"{name:<15} train {row['train']:>5}  val {row['val']:>4}  test {row['test']:>4}"
        )


if __name__ == "__main__":
    run_data_prep()
