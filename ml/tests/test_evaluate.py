"""
Tests for the model-free helpers in src/evaluation/evaluate.py.
"""

import pandas as pd
import pytest

from src.evaluation.evaluate import (
    count_boxes,
    get_dataset_key,
    select_conf_threshold,
    summarize_counts,
)


def test_count_boxes():
    """Only scores >= threshold are counted."""
    assert count_boxes([0.9, 0.5, 0.3, 0.1], threshold=0.3) == 3


def test_select_conf_threshold_picks_lowest_mae():
    """Image a has 2 pills, image b has 1.

    threshold 0.2 -> counts 3, 2 -> MAE 1.0
    threshold 0.4 -> counts 2, 1 -> MAE 0.0   <- best
    threshold 0.8 -> counts 1, 0 -> MAE 1.0
    """
    confidences = {"a.jpg": [0.9, 0.6, 0.3], "b.jpg": [0.7, 0.25]}

    threshold, table = select_conf_threshold(
        confidences, ["a.jpg", "b.jpg"], [2, 1], conf_grid=[0.8, 0.2, 0.4]
    )

    assert threshold == 0.4
    assert list(table["threshold"]) == [0.2, 0.4, 0.8]
    assert list(table["mae"]) == pytest.approx([1.0, 0.0, 1.0])


def test_get_dataset_key():
    """The key is the file prefix."""
    assert get_dataset_key("cp_IMG_1.jpg") == "cp"
    assert get_dataset_key("ul_Frame_0.jpg") == "ul"


def test_summarize_counts_per_dataset():
    """Overall metrics plus one set per dataset prefix."""
    count_table = pd.DataFrame(
        {
            "file": ["cp_a.jpg", "cp_b.jpg", "ul_c.jpg"],
            "true": [2, 0, 10],
            "pred": [2, 1, 7],
        }
    )

    summary = summarize_counts(count_table)

    assert summary["mae"] == pytest.approx((0 + 1 + 3) / 3)
    assert summary["cp_mae"] == pytest.approx(0.5)
    assert summary["ul_mae"] == pytest.approx(3.0)
    assert summary["cp_exact_match"] == pytest.approx(0.5)
