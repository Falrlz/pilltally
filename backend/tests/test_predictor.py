"""Tests for app/services/predictor.py."""

import numpy as np
import pytest

from app.core.config import settings
from app.schemas.predict import Box
from app.services.image_processor import LetterboxInfo, decode_image
from app.services.model_loader import (
    create_session,
    get_model_path,
    load_model_info,
)
from app.services.predictor import (
    Predictor,
    box_center_inside,
    box_iou,
    decode_output,
    nms,
    point_in_polygon,
    to_original,
)
from tests.samples import MODEL_FILES_EXIST, SAMPLE_COUNT, SAMPLE_IMAGE


def make_box(x1: float, y1: float, x2: float, y2: float, score: float = 0.9) -> Box:
    return Box(x1=x1, y1=y1, x2=x2, y2=y2, score=score)


# --- decode_output ---


def test_decode_output_converts_center_to_corners():
    # One candidate: center (50, 40), width 20, height 10, score 0.9
    output = np.array([[[50.0], [40.0], [20.0], [10.0], [0.9]]], dtype=np.float32)

    boxes = decode_output(output, conf_threshold=0.65)

    assert len(boxes) == 1
    assert boxes[0].x1 == pytest.approx(40)
    assert boxes[0].y1 == pytest.approx(35)
    assert boxes[0].x2 == pytest.approx(60)
    assert boxes[0].y2 == pytest.approx(45)


def test_decode_output_keeps_score_equal_to_threshold():
    # Scores 0.25, 0.5, 0.75 -> keep 0.5 and 0.75 (rule: score >= threshold)
    centers = [10.0, 20.0, 30.0]
    sizes = [5.0, 5.0, 5.0]
    scores = [0.25, 0.5, 0.75]
    output = np.array([[centers, centers, sizes, sizes, scores]], dtype=np.float32)

    boxes = decode_output(output, conf_threshold=0.5)

    assert len(boxes) == 2


# --- box_iou ---


def test_box_iou_same_box_is_one():
    box = make_box(0, 0, 10, 10)
    assert box_iou(box, box) == pytest.approx(1.0)


def test_box_iou_no_overlap_is_zero():
    a = make_box(0, 0, 10, 10)
    b = make_box(20, 20, 30, 30)
    assert box_iou(a, b) == 0.0


def test_box_iou_half_overlap():
    # Overlap 5 x 10 = 50, union 100 + 100 - 50 = 150
    a = make_box(0, 0, 10, 10)
    b = make_box(5, 0, 15, 10)
    assert box_iou(a, b) == pytest.approx(50 / 150)


# --- nms ---


def test_nms_removes_overlapping_lower_score_box():
    best = make_box(0, 0, 10, 10, score=0.9)
    almost_same = make_box(0, 0, 10, 11, score=0.8)
    other_pill = make_box(50, 50, 60, 60, score=0.7)

    kept = nms([almost_same, other_pill, best], iou_threshold=0.7, max_detections=300)

    assert kept == [best, other_pill]


def test_nms_keeps_boxes_with_small_overlap():
    a = make_box(0, 0, 10, 10, score=0.9)
    b = make_box(5, 0, 15, 10, score=0.8)  # IoU 0.33

    kept = nms([a, b], iou_threshold=0.7, max_detections=300)

    assert len(kept) == 2


def test_nms_stops_at_max_detections():
    boxes = []
    for i in range(5):
        boxes.append(make_box(i * 20, 0, i * 20 + 10, 10))

    kept = nms(boxes, iou_threshold=0.7, max_detections=3)

    assert len(kept) == 3


# --- to_original ---


def test_to_original_undoes_letterbox_and_area_offset():
    # Region was scaled by 0.5 and padded 160 px on top; region starts at (100, 50)
    info = LetterboxInfo(scale=0.5, pad_left=0, pad_top=160)
    box = make_box(10, 170, 20, 180)

    result = to_original(
        box, info, offset_x=100, offset_y=50, region_width=1280, region_height=640
    )

    assert result.x1 == pytest.approx(20 + 100)
    assert result.y1 == pytest.approx(20 + 50)
    assert result.x2 == pytest.approx(40 + 100)
    assert result.y2 == pytest.approx(40 + 50)


def test_to_original_clips_box_to_region():
    info = LetterboxInfo(scale=1.0, pad_left=0, pad_top=0)
    box = make_box(-5, -5, 120, 120)

    result = to_original(
        box, info, offset_x=0, offset_y=0, region_width=100, region_height=100
    )

    assert (result.x1, result.y1, result.x2, result.y2) == (0, 0, 100, 100)


# --- point_in_polygon / box_center_inside ---

SQUARE = [(0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0)]
DIAMOND = [(5.0, 0.0), (10.0, 5.0), (5.0, 10.0), (0.0, 5.0)]


def test_point_in_polygon_square():
    assert point_in_polygon(5, 5, SQUARE)
    assert not point_in_polygon(15, 5, SQUARE)


def test_point_in_polygon_diamond_corner_is_outside():
    # (1, 1) is inside the bounding square but outside the diamond
    assert point_in_polygon(5, 5, DIAMOND)
    assert not point_in_polygon(1, 1, DIAMOND)


def test_box_center_inside_uses_center():
    # Box sticks out of the square, but its center (9, 5) is inside
    box = make_box(7, 4, 11, 6)
    assert box_center_inside(box, SQUARE)


# --- Predictor with the real model ---


@pytest.fixture(scope="module")
def predictor() -> Predictor:
    info = load_model_info(settings.models_dir)
    session = create_session(get_model_path(settings.models_dir))
    return Predictor(session, info)


@pytest.mark.skipif(not MODEL_FILES_EXIST, reason="model or sample image missing")
def test_predictor_counts_sample_image(predictor: Predictor):
    image = decode_image(SAMPLE_IMAGE.read_bytes())

    result = predictor.predict(image)

    assert result.count == SAMPLE_COUNT
    assert len(result.boxes) == SAMPLE_COUNT
    assert result.image_width == image.width
    assert result.image_height == image.height


@pytest.mark.skipif(not MODEL_FILES_EXIST, reason="model or sample image missing")
def test_predictor_whole_image_area_gives_same_count(predictor: Predictor):
    image = decode_image(SAMPLE_IMAGE.read_bytes())
    whole_image = [
        (0.0, 0.0),
        (float(image.width), 0.0),
        (float(image.width), float(image.height)),
        (0.0, float(image.height)),
    ]

    result = predictor.predict(image, area=whole_image)

    assert result.count == SAMPLE_COUNT


@pytest.mark.skipif(not MODEL_FILES_EXIST, reason="model or sample image missing")
def test_predictor_boxes_are_inside_area(predictor: Predictor):
    image = decode_image(SAMPLE_IMAGE.read_bytes())
    # Left half of the image
    half = image.width / 2
    left_half = [
        (0.0, 0.0),
        (half, 0.0),
        (half, float(image.height)),
        (0.0, float(image.height)),
    ]

    result = predictor.predict(image, area=left_half)

    assert result.count <= SAMPLE_COUNT
    for box in result.boxes:
        assert box_center_inside(box, left_half)
