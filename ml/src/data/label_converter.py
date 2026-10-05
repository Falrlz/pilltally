"""
Turn annotations into YOLO label lines.

The EDA annotation index already stores every object as a normalized bbox
(polygons were converted to their min-max box), so only the class has to
change: every original class becomes class 0 (pill).
"""

import pandas as pd

PILL_CLASS_ID = 0


def make_label_line(cx: float, cy: float, w: float, h: float) -> str:
    """Return one YOLO label line: '0 cx cy w h'."""

    return f"{PILL_CLASS_ID} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}"


def make_label_lines(boxes: pd.DataFrame) -> list[str]:
    """Return the label lines of one image (columns cx, cy, w, h)."""

    lines = []
    for cx, cy, w, h in zip(
        boxes["cx"], boxes["cy"], boxes["w"], boxes["h"], strict=True
    ):
        lines.append(make_label_line(cx, cy, w, h))
    return lines


def build_labels(df_ann: pd.DataFrame, image_paths: list[str]) -> dict[str, list[str]]:
    """Return the label lines of every image.

    Images without annotations get an empty list, so they still receive an
    (empty) label file and stay in the dataset as background images.
    """

    labels: dict[str, list[str]] = {}
    for path in image_paths:
        labels[path] = []

    for path, boxes in df_ann.groupby("path"):
        if path in labels:
            labels[path] = make_label_lines(boxes)

    return labels
