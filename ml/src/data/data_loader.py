"""
Load the EDA outputs that the data preparation step needs.
"""

from pathlib import Path

import pandas as pd


def load_image_index(eda_dir: Path) -> pd.DataFrame:
    """Load image_index.parquet (one row per image)."""

    return pd.read_parquet(eda_dir / "image_index.parquet")


def load_annotation_index(eda_dir: Path) -> pd.DataFrame:
    """Load annotation_index.parquet (one row per object, already as bbox)."""

    return pd.read_parquet(eda_dir / "annotation_index.parquet")


def load_duplicate_pairs(eda_dir: Path) -> pd.DataFrame:
    """Load duplicate_pairs.csv (exact and near-duplicate image pairs)."""

    return pd.read_csv(eda_dir / "duplicate_pairs.csv")
