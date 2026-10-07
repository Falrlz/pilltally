"""
Count pills in one image with the ONNX model.

Flow (same as the ML evaluation, see docs/web_app.md section 3):
image -> (area) -> letterbox -> ONNX -> score filter -> NMS -> boxes back to
the original image -> (keep boxes with center inside the area) -> count
"""

import time

import numpy as np
import onnxruntime as ort
from PIL import Image

from app.schemas.model import ModelInfo
from app.schemas.predict import Box, PredictResponse
from app.services.image_processor import (
    LetterboxInfo,
    Point,
    apply_area,
    letterbox,
)

# Same values as Ultralytics predict (used during evaluation)
IOU_THRESHOLD = 0.7
MAX_DETECTIONS = 300


def decode_output(output: np.ndarray, conf_threshold: float) -> list[Box]:
    """
    Turn the raw model output into boxes with score >= conf_threshold.

    output has shape [1, 5, N]: for each of the N candidates the rows are
    cx, cy, w, h (center, width, height in letterbox pixels) and score.
    """

    rows = output[0]
    centers_x = rows[0]
    centers_y = rows[1]
    widths = rows[2]
    heights = rows[3]
    scores = rows[4]

    boxes = []
    for i in range(len(scores)):
        score = float(scores[i])
        # Same rule as ml/src/evaluation/evaluate.py count_boxes
        if score < conf_threshold:
            continue

        half_w = float(widths[i]) / 2
        half_h = float(heights[i]) / 2
        boxes.append(
            Box(
                x1=float(centers_x[i]) - half_w,
                y1=float(centers_y[i]) - half_h,
                x2=float(centers_x[i]) + half_w,
                y2=float(centers_y[i]) + half_h,
                score=score,
            )
        )
    return boxes


def box_iou(a: Box, b: Box) -> float:
    """Intersection over union of two boxes (0 = no overlap, 1 = same box)."""

    inter_w = min(a.x2, b.x2) - max(a.x1, b.x1)
    inter_h = min(a.y2, b.y2) - max(a.y1, b.y1)
    if inter_w <= 0 or inter_h <= 0:
        return 0.0

    intersection = inter_w * inter_h
    area_a = (a.x2 - a.x1) * (a.y2 - a.y1)
    area_b = (b.x2 - b.x1) * (b.y2 - b.y1)
    union = area_a + area_b - intersection
    return intersection / union


def nms(boxes: list[Box], iou_threshold: float, max_detections: int) -> list[Box]:
    """
    Non-maximum suppression: when boxes overlap too much, keep the best one.

    Boxes are checked from the highest score down. A box is kept only if its
    IoU with every already kept box is <= iou_threshold.
    """

    sorted_boxes = sorted(boxes, key=lambda box: box.score, reverse=True)

    kept: list[Box] = []
    for box in sorted_boxes:
        overlaps = False
        for kept_box in kept:
            if box_iou(box, kept_box) > iou_threshold:
                overlaps = True
                break

        if not overlaps:
            kept.append(box)
        if len(kept) == max_detections:
            break
    return kept


def to_original(
    box: Box,
    info: LetterboxInfo,
    offset_x: int,
    offset_y: int,
    region_width: int,
    region_height: int,
) -> Box:
    """Map a box from letterbox pixels back to the original image."""

    # Undo the padding and the resize -> pixels of the region
    x1 = (box.x1 - info.pad_left) / info.scale
    y1 = (box.y1 - info.pad_top) / info.scale
    x2 = (box.x2 - info.pad_left) / info.scale
    y2 = (box.y2 - info.pad_top) / info.scale

    # Keep the box inside the region (like Ultralytics)
    x1 = min(max(x1, 0), region_width)
    y1 = min(max(y1, 0), region_height)
    x2 = min(max(x2, 0), region_width)
    y2 = min(max(y2, 0), region_height)

    # Region pixels -> original image pixels
    return Box(
        x1=x1 + offset_x,
        y1=y1 + offset_y,
        x2=x2 + offset_x,
        y2=y2 + offset_y,
        score=box.score,
    )


def point_in_polygon(x: float, y: float, polygon: list[Point]) -> bool:
    """
    True if point (x, y) is inside the polygon.

    Ray casting: draw a line from the point to the right and count how many
    polygon edges it crosses. Odd = inside, even = outside.
    """

    inside = False
    count = len(polygon)
    for i in range(count):
        x_a, y_a = polygon[i]
        x_b, y_b = polygon[(i + 1) % count]

        # Does the edge cross the horizontal line through y?
        if (y_a > y) != (y_b > y):
            # x where the edge crosses that line
            x_cross = x_a + (y - y_a) * (x_b - x_a) / (y_b - y_a)
            if x < x_cross:
                inside = not inside
    return inside


def box_center_inside(box: Box, polygon: list[Point]) -> bool:
    """True if the center of the box is inside the polygon."""

    center_x = (box.x1 + box.x2) / 2
    center_y = (box.y1 + box.y2) / 2
    return point_in_polygon(center_x, center_y, polygon)


class Predictor:
    """Holds the loaded model and counts pills in images."""

    def __init__(self, session: ort.InferenceSession, info: ModelInfo) -> None:
        self.session = session
        self.info = info
        self.input_name = session.get_inputs()[0].name

    def predict(
        self, image: Image.Image, area: list[Point] | None = None
    ) -> PredictResponse:
        """Count pills in an RGB image, optionally only inside the area."""

        start = time.perf_counter()

        # 1. Counting area (optional)
        if area is None:
            region = image
            offset_x = 0
            offset_y = 0
        else:
            crop = apply_area(image, area)
            region = crop.image
            offset_x = crop.offset_x
            offset_y = crop.offset_y

        # 2. Letterbox
        model_input, letterbox_info = letterbox(region, self.info.imgsz)

        # 3. Model
        output = self.session.run(None, {self.input_name: model_input})[0]

        # 4. Score filter + NMS
        boxes = decode_output(output, self.info.conf_threshold)
        boxes = nms(boxes, IOU_THRESHOLD, MAX_DETECTIONS)

        # 5. Back to original image pixels
        original_boxes = []
        for box in boxes:
            original_box = to_original(
                box,
                letterbox_info,
                offset_x,
                offset_y,
                region.width,
                region.height,
            )
            original_boxes.append(original_box)

        # 6. Only boxes with their center inside the area
        if area is not None:
            inside_boxes = []
            for box in original_boxes:
                if box_center_inside(box, area):
                    inside_boxes.append(box)
            original_boxes = inside_boxes

        inference_ms = (time.perf_counter() - start) * 1000

        return PredictResponse(
            count=len(original_boxes),
            boxes=original_boxes,
            image_width=image.width,
            image_height=image.height,
            conf_threshold=self.info.conf_threshold,
            inference_ms=round(inference_ms, 1),
        )
