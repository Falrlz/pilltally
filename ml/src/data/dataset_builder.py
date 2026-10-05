"""
Write the combined dataset into data/splits/.

Layout:
    data/splits/images/{train,val,test}/<prefix><file>.jpg
    data/splits/labels/{train,val,test}/<prefix><file>.txt
    data/splits/data.yaml
    data/splits/split_manifest.csv
"""

import shutil
from pathlib import Path

import pandas as pd
import yaml
from tqdm import tqdm

from src.data.label_converter import PILL_CLASS_ID
from src.utils.paths import SPLITS

# Files that belong to the folder structure, not to the dataset
KEEP_FILES = {".gitkeep"}

MANIFEST_COLUMNS = [
    "new_file",
    "dataset",
    "orig_path",
    "orig_split",
    "split",
    "group",
    "n_object",
]


def list_dataset_files(folder: Path) -> list[Path]:
    """Return the files in a folder, ignoring .gitkeep."""

    if not folder.exists():
        return []

    files = []
    for path in folder.iterdir():
        if path.is_file() and path.name not in KEEP_FILES:
            files.append(path)
    return files


def has_existing_files(splits_dir: Path) -> bool:
    """Return True if any images/ or labels/ split folder already has files."""

    for kind in ["images", "labels"]:
        for split in SPLITS:
            if len(list_dataset_files(splits_dir / kind / split)) > 0:
                return True
    return False


def clear_split_folders(splits_dir: Path) -> None:
    """Delete old dataset files (and Ultralytics .cache files), keep .gitkeep."""

    for kind in ["images", "labels"]:
        for path in list_dataset_files(splits_dir / kind):
            path.unlink()
        for split in SPLITS:
            for path in list_dataset_files(splits_dir / kind / split):
                path.unlink()


def add_new_file_names(df: pd.DataFrame, prefixes: dict[str, str]) -> pd.DataFrame:
    """Add a 'new_file' column: dataset prefix + original file name."""

    for name in df["dataset"].unique():
        if name not in prefixes:
            raise ValueError(f"No prefix configured for dataset: {name}")

    new_files = []
    for name, file_name in zip(df["dataset"], df["file"], strict=True):
        new_files.append(prefixes[name] + file_name)

    result = df.copy()
    result["new_file"] = new_files

    duplicated = result[result.duplicated(subset=["split", "new_file"], keep=False)]
    if len(duplicated) > 0:
        raise ValueError(f"Duplicate file names after prefixing: {len(duplicated)}")

    return result


def label_name(image_name: str) -> str:
    """Return the label file name of an image: 'a.jpg' -> 'a.txt'."""

    return Path(image_name).stem + ".txt"


def copy_images(df: pd.DataFrame, base_dir: Path, splits_dir: Path) -> None:
    """Copy every image unchanged to images/<split>/<new_file>."""

    for split in SPLITS:
        (splits_dir / "images" / split).mkdir(parents=True, exist_ok=True)

    rows = zip(df["path"], df["split"], df["new_file"], strict=True)
    for source, split, new_file in tqdm(rows, total=len(df), desc="Copying images"):
        shutil.copy2(base_dir / source, splits_dir / "images" / split / new_file)


def write_labels(
    df: pd.DataFrame, labels: dict[str, list[str]], splits_dir: Path
) -> None:
    """Write labels/<split>/<name>.txt for every image (empty file if no object)."""

    for split in SPLITS:
        (splits_dir / "labels" / split).mkdir(parents=True, exist_ok=True)

    rows = zip(df["path"], df["split"], df["new_file"], strict=True)
    for source, split, new_file in rows:
        lines = labels[source]
        text = ""
        if len(lines) > 0:
            text = "\n".join(lines) + "\n"
        label_path = splits_dir / "labels" / split / label_name(new_file)
        label_path.write_text(text, encoding="utf-8")


def write_data_yaml(splits_dir: Path, class_name: str) -> Path:
    """Write the Ultralytics data.yaml with an absolute dataset path."""

    data = {
        "path": splits_dir.resolve().as_posix(),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "names": {PILL_CLASS_ID: class_name},
    }

    yaml_path = splits_dir / "data.yaml"
    with yaml_path.open("w", encoding="utf-8") as file:
        yaml.safe_dump(data, file, sort_keys=False)
    return yaml_path


def write_manifest(df: pd.DataFrame, manifest_path: Path) -> None:
    """Write split_manifest.csv: where every image came from and where it went."""

    manifest = df.rename(columns={"path": "orig_path"})[MANIFEST_COLUMNS]
    manifest.to_csv(manifest_path, index=False)
