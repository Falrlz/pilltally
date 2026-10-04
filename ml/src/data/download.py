"""
Dataset Downloader.
"""

import argparse
import os
import shutil
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

import requests
import yaml
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from roboflow import Roboflow

from src.utils.logger import get_logger

# Load environment variables
load_dotenv()
logger = get_logger("pilltally.download")

# Base directory paths
BASE_DIR = Path(__file__).resolve().parents[2]
CONFIG_FILE = BASE_DIR / "configs" / "datasets.yaml"


# ---------------------------------------------------------------------------
# Pydantic Schemas for YAML Configuration
# ---------------------------------------------------------------------------
class DirectDataset(BaseModel):
    """Schema for direct archive download."""

    name: str = Field(description="Target directory name in data/raw")
    url: str = Field(description="Download URL of the zip file")
    format: str = Field(default="yolo26", description="Annotation format")


class RoboflowDataset(BaseModel):
    """Schema for Roboflow Universe dataset."""

    name: str = Field(description="Target directory name in data/raw")
    workspace: str = Field(description="Roboflow workspace slug")
    project: str = Field(description="Roboflow project slug")
    version: int = Field(description="Dataset version number")
    format: str = Field(default="yolo26", description="Target export format")


class DatasetsConfig(BaseModel):
    """Root configuration schema for configs/datasets.yaml."""

    raw_dir: str = Field(default="data/raw", description="Relative raw data directory")
    direct_datasets: list[DirectDataset] = Field(default_factory=list)
    roboflow_datasets: list[RoboflowDataset] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------
def load_config(config_path: Path) -> DatasetsConfig:
    """Load and validate dataset configuration from YAML file."""

    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")

    with config_path.open(encoding="utf-8") as f:
        data = yaml.safe_load(f)

    return DatasetsConfig.model_validate(data)


def is_populated(target_dir: Path) -> bool:
    """Check if directory already contains image files."""

    if not target_dir.exists():
        return False
    return any(
        target_dir.glob(f"**/{ext}")
        for ext in ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.PNG")
    )


def check_direct_dataset(item: DirectDataset) -> tuple[bool, str]:
    """Test accessibility of a direct download URL without downloading full content."""

    try:
        resp = requests.head(item.url, allow_redirects=True, timeout=10)
        if resp.status_code == 200:
            size_bytes = int(resp.headers.get("content-length", 0))
            size_mb = size_bytes / (1024 * 1024)
            return True, f"HTTP 200 OK (~{size_mb:.2f} MB)"
        return False, f"HTTP Status {resp.status_code}"
    except requests.RequestException as err:
        return False, str(err)


def check_roboflow_dataset(item: RoboflowDataset, api_key: str) -> tuple[bool, str]:
    """Test Roboflow workspace, project, and version availability."""

    if not api_key:
        return False, "ROBOFLOW_API_KEY missing in .env"
    try:
        rf = Roboflow(api_key=api_key)
        proj = rf.workspace(item.workspace).project(item.project)
        ver = proj.version(item.version)
        images_count = getattr(ver, "images", "unknown")
        return True, f"Accessible: {proj.name} v{ver.version} ({images_count} images)"
    except Exception as err:  # noqa: BLE001 - Roboflow SDK can raise arbitrary exceptions
        return False, str(err)


def download_and_extract_zip(url: str, dest_dir: Path) -> bool:
    """Download a remote zip file and extract to destination folder."""

    dest_dir.mkdir(parents=True, exist_ok=True)
    temp_zip = dest_dir.parent / f"{dest_dir.name}_temp.zip"

    try:
        logger.info(f"Downloading from [cyan]{url}[/cyan]...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp, temp_zip.open("wb") as f:
            shutil.copyfileobj(resp, f)

        logger.info(f"Extracting to [green]{dest_dir.name}[/green]...")
        with zipfile.ZipFile(temp_zip, "r") as archive:
            archive.extractall(dest_dir)

        temp_zip.unlink(missing_ok=True)
        return True
    except (urllib.error.URLError, zipfile.BadZipFile, OSError) as err:
        logger.error(f"Failed direct download for {dest_dir.name}: {err}")
        return False


def download_roboflow(item: RoboflowDataset, dest_dir: Path, api_key: str) -> bool:
    """Download a dataset from Roboflow Universe using official SDK."""

    if not api_key:
        logger.error(f"ROBOFLOW_API_KEY is not set in .env. Skipping {item.name}.")
        return False

    logger.info(
        f"Downloading [cyan]{item.name}[/cyan] ({item.workspace}/{item.project} v{item.version})..."
    )
    try:
        rf = Roboflow(api_key=api_key)
        project = rf.workspace(item.workspace).project(item.project)
        version = project.version(item.version)

        dest_dir.parent.mkdir(parents=True, exist_ok=True)
        version.download(item.format, location=str(dest_dir), overwrite=True)
        return True
    except Exception as err:  # noqa: BLE001 - Roboflow SDK can raise arbitrary exceptions
        logger.error(f"Roboflow download failed for {item.name}: {err}")
        return False


# ---------------------------------------------------------------------------
# Test & Dry-Run Runners
# ---------------------------------------------------------------------------
def run_dry_run(config: DatasetsConfig, api_key: str) -> bool:
    """Validate all endpoints and credentials without downloading large files."""

    logger.info("=" * 60)
    logger.info("PillTally: Pre-flight Verification (Dry Run)")
    logger.info("=" * 60)

    all_passed = True

    # 1. Direct datasets check
    logger.info("\nChecking direct download URLs:")
    for d in config.direct_datasets:
        ok, msg = check_direct_dataset(d)
        color = "green" if ok else "red"
        logger.info(f"• {d.name:<32} : [{color}]{msg}[/{color}]")
        if not ok:
            all_passed = False

    # 2. Roboflow datasets check
    logger.info("\nChecking Roboflow Universe projects:")
    for r in config.roboflow_datasets:
        ok, msg = check_roboflow_dataset(r, api_key)
        color = "green" if ok else "red"
        logger.info(f"• {r.name:<32} : [{color}]{msg}[/{color}]")
        if not ok:
            all_passed = False

    logger.info("\n" + "=" * 60)
    if all_passed:
        logger.info(
            "[green]Pre-flight check passed! All sources are accessible.[/green]"
        )
    else:
        logger.error(
            "[red]Pre-flight check detected issues with one or more sources.[/red]"
        )
    logger.info("=" * 60)
    return all_passed


def run_sample_test(config: DatasetsConfig, raw_dir: Path, api_key: str):
    """Run pre-flight check, then download the smallest sample dataset for end-to-end verification."""

    logger.info("=" * 60)
    logger.info("PillTally: End-to-End Sample Test Mode")
    logger.info("=" * 60)

    if not run_dry_run(config, api_key):
        logger.error("Pre-flight check failed. Aborting sample test.")
        return

    # Select the smallest direct dataset (medical-pills, ~8.2 MB)
    sample_dataset = config.direct_datasets[0] if config.direct_datasets else None
    if not sample_dataset:
        logger.error("No sample direct dataset found for testing.")
        return

    logger.info(
        f"\n[bold yellow]Downloading sample test dataset: {sample_dataset.name}[/bold yellow]"
    )
    target = raw_dir / sample_dataset.name

    if is_populated(target):
        logger.info(f"[green]READY[/green] {sample_dataset.name} already exists.")
    else:
        ok = download_and_extract_zip(sample_dataset.url, target)
        if not ok:
            logger.error("Sample download failed.")
            return

    # Verify extracted structure
    images = list(target.glob("**/*.jpg")) + list(target.glob("**/*.png"))
    labels = list(target.glob("**/*.txt"))
    logger.info("\n" + "=" * 60)
    logger.info("Sample Verification Report:")
    logger.info(f"• Folder Location : {target}")
    logger.info(f"• Total Images    : {len(images)} found")
    logger.info(f"• Total Labels    : {len(labels)} found")
    logger.info(
        "[green]Sample test completed successfully! Pipeline is ready for full download.[/green]"
    )
    logger.info("=" * 60)


# ---------------------------------------------------------------------------
# CLI Argument Parser & Main
# ---------------------------------------------------------------------------
def parse_args():
    parser = argparse.ArgumentParser(
        description="PillTally Dataset Acquisition Pipeline"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate configs, credentials, and endpoints without downloading.",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run pre-flight check and download only the smallest sample dataset (medical-pills).",
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default=None,
        help="Download only a specific dataset by name.",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    config = load_config(CONFIG_FILE)
    raw_dir = BASE_DIR / config.raw_dir
    raw_dir.mkdir(parents=True, exist_ok=True)
    api_key = os.getenv("ROBOFLOW_API_KEY", "").strip()

    # Route based on flags
    if args.dry_run:
        run_dry_run(config, api_key)
        return

    if args.test:
        run_sample_test(config, raw_dir, api_key)
        return

    # Filter by specific dataset name if requested
    direct_list = config.direct_datasets
    roboflow_list = config.roboflow_datasets

    if args.dataset:
        direct_list = [d for d in direct_list if d.name.lower() == args.dataset.lower()]
        roboflow_list = [
            r for r in roboflow_list if r.name.lower() == args.dataset.lower()
        ]
        if not direct_list and not roboflow_list:
            logger.error(
                f"Dataset '{args.dataset}' not found in configs/datasets.yaml."
            )
            return

    logger.info("=" * 60)
    logger.info("PillTally: Dataset Acquisition Pipeline")
    logger.info("=" * 60)

    status: dict[str, str] = {}

    # 1. Process Direct Datasets
    for d in direct_list:
        target = raw_dir / d.name
        if is_populated(target):
            logger.info(f"[green]READY[/green] {d.name} (already exists)")
            status[d.name] = "READY"
        else:
            ok = download_and_extract_zip(d.url, target)
            status[d.name] = "DOWNLOADED" if ok else "FAILED"

    # 2. Process Roboflow Datasets
    for r in roboflow_list:
        target = raw_dir / r.name
        if is_populated(target):
            logger.info(f"[green]READY[/green] {r.name} (already exists)")
            status[r.name] = "READY"
        else:
            ok = download_roboflow(r, target, api_key)
            status[r.name] = "DOWNLOADED" if ok else "FAILED"

    # Print Summary Table
    logger.info("\n" + "=" * 60)
    logger.info("Acquisition Summary:")
    logger.info("=" * 60)
    for name, st in status.items():
        color = "green" if st in ("READY", "DOWNLOADED") else "red"
        logger.info(f"• {name:<36} : [{color}]{st}[/{color}]")

    ready_count = sum(1 for st in status.values() if st in ("READY", "DOWNLOADED"))
    logger.info(f"\nCompleted: {ready_count}/{len(status)} datasets ready in {raw_dir}")


if __name__ == "__main__":
    main()
