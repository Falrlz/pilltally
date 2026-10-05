"""
Tests for src/evaluation/counting_metrics.py.

Example used below (4 images):
    image  true  pred  error
    A        5     5     0
    B        3     4     1
    C       10     8     2
    D        0     0     0
"""

import pytest

from src.evaluation.counting_metrics import (
    counting_metrics,
    exact_match_rate,
    mean_absolute_error,
    within_one_rate,
)

TRUE_COUNTS = [5, 3, 10, 0]
PRED_COUNTS = [5, 4, 8, 0]


def test_mean_absolute_error():
    """(0 + 1 + 2 + 0) / 4 = 0.75"""
    assert mean_absolute_error(PRED_COUNTS, TRUE_COUNTS) == pytest.approx(0.75)


def test_exact_match_rate():
    """A and D are exact -> 2 / 4 = 0.5"""
    assert exact_match_rate(PRED_COUNTS, TRUE_COUNTS) == pytest.approx(0.5)


def test_within_one_rate():
    """A, B and D are off by at most 1 -> 3 / 4 = 0.75"""
    assert within_one_rate(PRED_COUNTS, TRUE_COUNTS) == pytest.approx(0.75)


def test_counting_metrics_keys():
    """All three metrics are returned together."""
    metrics = counting_metrics(PRED_COUNTS, TRUE_COUNTS)
    assert set(metrics) == {"mae", "exact_match", "within_1"}


def test_different_lengths_raise():
    """Lists of different length are a mistake."""
    with pytest.raises(ValueError):
        mean_absolute_error([1, 2], [1])


def test_empty_lists_raise():
    """No images means no metric."""
    with pytest.raises(ValueError):
        mean_absolute_error([], [])
