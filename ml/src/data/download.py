"""
Dataset download functions.

Used by pipelines/download_pipeline.py.
"""

import shutil
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

import requests
from roboflow import Roboflow

from src.utils.config import DirectDataset, RoboflowDataset
from src.utils.logger import get_logger

logger = get_logger("pilltally.download")


def is_populated(target_dir: Path) -> bool:
    """Check if directory already contains image files."""

    if not target_dir.exists():
        return False

    image_exts = {".jpg", ".jpeg", ".png"}
    for path in target_dir.rglob("*"):
        if path.suffix.lower() in image_exts:
            return True
    return False


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
