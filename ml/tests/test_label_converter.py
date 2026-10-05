"""
Tests for src/data/label_converter.py.
"""

import pandas as pd

from src.data.label_converter import build_labels, make_label_line, make_label_lines


def test_make_label_line_format():
    """Class is always 0 and coordinates have 6 decimals."""
    line = make_label_line(0.5, 0.25, 0.1, 0.2)
    assert line == "0 0.500000 0.250000 0.100000 0.200000"


def test_make_label_lines_one_line_per_box():
    """Every box becomes one line with exactly 5 values."""
    boxes = pd.DataFrame(
        {"cx": [0.1, 0.9], "cy": [0.2, 0.8], "w": [0.05, 0.1], "h": [0.05, 0.1]}
    )

    lines = make_label_lines(boxes)

    assert len(lines) == 2
    for line in lines:
        values = line.split()
        assert len(values) == 5
        assert values[0] == "0"


def test_build_labels_empty_image_gets_empty_list():
    """An image without annotations gets an empty label (background image)."""
    df_ann = pd.DataFrame(
        {
            "path": ["a.jpg", "a.jpg"],
            "orig_class": [3, 7],
            "cx": [0.1, 0.2],
            "cy": [0.1, 0.2],
            "w": [0.1, 0.1],
            "h": [0.1, 0.1],
        }
    )

    labels = build_labels(df_ann, ["a.jpg", "empty.jpg"])

    assert len(labels["a.jpg"]) == 2
    assert labels["empty.jpg"] == []
