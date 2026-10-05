"""
Checks on the finished data/splits/ folder.

Every check returns a list of problems. An empty list means the check passed.
"""

from pathlib import Path

import pandas as pd

from src.data.dataset_builder import label_name, list_dataset_files
from src.data.label_converter import PILL_CLASS_ID
from src.utils.paths import SPLITS


def check_counts(manifest: pd.DataFrame, splits_dir: Path) -> list[str]:
    """Each split has as many images and label files as the manifest says."""

    problems = []
    for split in SPLITS:
        n_manifest = len(manifest[manifest["split"] == split])
        n_images = len(list_dataset_files(splits_dir / "images" / split))
        n_labels = len(list_dataset_files(splits_dir / "labels" / split))

        if n_images != n_manifest:
            problems.append(f"{split}: {n_images} images, manifest has {n_manifest}")
        if n_labels != n_manifest:
            problems.append(f"{split}: {n_labels} labels, manifest has {n_manifest}")

    return problems


def check_label_line(line: str) -> str | None:
    """Return a problem description, or None if the line is a valid label."""

    values = line.split()
    if len(values) != 5:
        return f"expected 5 values, got {len(values)}"
    if values[0] != str(PILL_CLASS_ID):
        return f"class must be {PILL_CLASS_ID}, got {values[0]}"

    for value in values[1:]:
        number = float(value)
        if number < 0 or number > 1:
            return f"coordinate outside 0..1: {value}"

    return None


def check_labels(
    manifest: pd.DataFrame, splits_dir: Path, expected_objects: int
) -> list[str]:
    """Every label line is valid and the total object count is unchanged."""

    problems = []
    total_objects = 0

    for split, new_file in zip(manifest["split"], manifest["new_file"], strict=True):
        label_path = splits_dir / "labels" / split / label_name(new_file)
        lines = label_path.read_text(encoding="utf-8").splitlines()

        for line in lines:
            problem = check_label_line(line)
            if problem is not None:
                problems.append(f"{label_path.name}: {problem}")
        total_objects += len(lines)

    if total_objects != expected_objects:
        problems.append(f"{total_objects} objects, expected {expected_objects}")

    return problems


def check_no_leakage(manifest: pd.DataFrame) -> list[str]:
    """Grouped images must not leak across splits.

    - A Pill Detection pill code stays in one split.
    - A group that has a test image has only test images.
    """

    problems = []
    grouped = manifest[manifest["group"].fillna("") != ""]

    for (dataset, group), rows in grouped.groupby(["dataset", "group"]):
        splits_of_group = set(rows["split"])

        if dataset == "Pill Detection" and len(splits_of_group) > 1:
            problems.append(f"{dataset} code {group} in {sorted(splits_of_group)}")
        elif "test" in splits_of_group and len(splits_of_group) > 1:
            problems.append(f"{dataset} group {group} in {sorted(splits_of_group)}")

    return problems
