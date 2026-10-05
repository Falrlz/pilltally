"""
Download pipeline: fetch the raw datasets into data/raw/.

Run from the ml/ folder:
    uv run python -m pipelines.download_pipeline

Options (call the function directly):
    uv run python -c "from pipelines.download_pipeline import run_download; run_download(dry_run=True)"
"""

import os
from pathlib import Path

from dotenv import load_dotenv

from src.data.download import (
    check_direct_dataset,
    check_roboflow_dataset,
    download_and_extract_zip,
    download_roboflow,
    is_populated,
)
from src.utils.config import DatasetsConfig, load_config
from src.utils.logger import get_logger
from src.utils.paths import CONFIGS_DIR, RAW_DIR

logger = get_logger("pilltally.pipeline.download")


def run_download(
    config_path: Path = CONFIGS_DIR / "datasets.yaml",
    dry_run: bool = False,
    sample: bool = False,
    dataset: str | None = None,
) -> dict[str, str]:
    """
    Download the datasets listed in configs/datasets.yaml.

    dry_run: only check that every source is reachable, download nothing.
    sample:  only download the first direct dataset (medical-pills, small).
    dataset: only download the dataset with this name.

    Returns a status per dataset: READY, DOWNLOADED, FAILED, OK or UNREACHABLE.
    """
    logger.info("=== Starting Download Pipeline ===")

    # Step 1: Load settings and the Roboflow API key
    logger.info("Step 1: Loading configuration...")
    config = load_config(config_path, DatasetsConfig)
    load_dotenv()
    api_key = os.getenv("ROBOFLOW_API_KEY", "").strip()

    # Step 2: Choose which datasets to process
    logger.info("Step 2: Selecting datasets...")
    direct_list = config.direct_datasets
    roboflow_list = config.roboflow_datasets

    if sample:
        direct_list = direct_list[:1]
        roboflow_list = []

    if dataset is not None:
        direct_list = [d for d in direct_list if d.name == dataset]
        roboflow_list = [r for r in roboflow_list if r.name == dataset]
        if len(direct_list) == 0 and len(roboflow_list) == 0:
            raise ValueError(f"Dataset '{dataset}' not found in {config_path.name}")

    status: dict[str, str] = {}

    # Step 3 (dry run): only check that every source is reachable
    if dry_run:
        logger.info("Step 3: Checking sources (dry run, nothing is downloaded)...")
        for item in direct_list:
            ok, message = check_direct_dataset(item)
            status[item.name] = "OK" if ok else "UNREACHABLE"
            logger.info(f"{item.name}: {message}")
        for item in roboflow_list:
            ok, message = check_roboflow_dataset(item, api_key)
            status[item.name] = "OK" if ok else "UNREACHABLE"
            logger.info(f"{item.name}: {message}")

        logger.info("=== Download Pipeline (dry run) Completed ===")
        return status

    # Step 3: Download every dataset that is not on disk yet
    logger.info(f"Step 3: Downloading missing datasets into {RAW_DIR}...")
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    for item in direct_list:
        target_dir = RAW_DIR / item.name
        if is_populated(target_dir):
            status[item.name] = "READY"
            continue
        ok = download_and_extract_zip(item.url, target_dir)
        status[item.name] = "DOWNLOADED" if ok else "FAILED"

    for item in roboflow_list:
        target_dir = RAW_DIR / item.name
        if is_populated(target_dir):
            status[item.name] = "READY"
            continue
        ok = download_roboflow(item, target_dir, api_key)
        status[item.name] = "DOWNLOADED" if ok else "FAILED"

    # Step 4: Summary
    logger.info("Step 4: Summary")
    for name, state in status.items():
        logger.info(f"{name}: {state}")

    logger.info("=== Download Pipeline Completed ===")
    return status


if __name__ == "__main__":
    run_download()
