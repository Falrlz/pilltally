"""Tests for app/services/image_processor.py."""

from io import BytesIO

import numpy as np
import pytest
from PIL import Image

from app.services.image_processor import (
    InvalidAreaError,
    InvalidImageError,
    apply_area,
    decode_image,
    letterbox,
)

GRAY = (114, 114, 114)
RED = (255, 0, 0)


def make_png_bytes(width: int, height: int) -> bytes:
    """A small red PNG image as bytes."""

    image = Image.new("RGB", (width, height), RED)
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


# --- decode_image ---


def test_decode_image_reads_png():
    image = decode_image(make_png_bytes(30, 20))

    assert image.size == (30, 20)
    assert image.mode == "RGB"


def test_decode_image_converts_to_rgb():
    gray_image = Image.new("L", (10, 10), 50)
    buffer = BytesIO()
    gray_image.save(buffer, format="PNG")

    image = decode_image(buffer.getvalue())

    assert image.mode == "RGB"


def test_decode_image_rejects_gif():
    buffer = BytesIO()
    Image.new("RGB", (10, 10), RED).save(buffer, format="GIF")

    with pytest.raises(InvalidImageError):
        decode_image(buffer.getvalue())


def test_decode_image_rejects_non_image():
    with pytest.raises(InvalidImageError):
        decode_image(b"this is not an image")


# --- letterbox ---


def test_letterbox_output_shape_and_type():
    image = Image.new("RGB", (1280, 640), RED)

    model_input, _ = letterbox(image, 640)

    assert model_input.shape == (1, 3, 640, 640)
    assert model_input.dtype == np.float32


def test_letterbox_wide_image_is_padded_top_and_bottom():
    # 1280 x 640 -> scale 0.5 -> 640 x 320, so 160 gray rows above and below
    image = Image.new("RGB", (1280, 640), RED)

    model_input, info = letterbox(image, 640)

    assert info.scale == 0.5
    assert info.pad_left == 0
    assert info.pad_top == 160

    red_channel = model_input[0, 0]
    # Top padding is gray (114 / 255)
    assert red_channel[0, 320] == pytest.approx(114 / 255)
    # Middle is the red image (255 / 255)
    assert red_channel[320, 320] == pytest.approx(1.0)


def test_letterbox_tall_image_is_padded_left_and_right():
    image = Image.new("RGB", (320, 640), RED)

    _, info = letterbox(image, 640)

    assert info.scale == 1.0
    assert info.pad_left == 160
    assert info.pad_top == 0


# --- apply_area ---


def test_apply_area_crops_to_bounding_rectangle():
    image = Image.new("RGB", (100, 100), RED)
    points = [(10, 20), (60, 20), (60, 70), (10, 70)]

    crop = apply_area(image, points)

    assert crop.offset_x == 10
    assert crop.offset_y == 20
    assert crop.image.size == (50, 50)


def test_apply_area_makes_outside_of_quad_gray():
    # A diamond: the corners of its bounding rectangle are outside it
    image = Image.new("RGB", (100, 100), RED)
    points = [(50, 0), (100, 50), (50, 100), (0, 50)]

    crop = apply_area(image, points)

    assert crop.image.getpixel((2, 2)) == GRAY
    assert crop.image.getpixel((50, 50)) == RED


def test_apply_area_needs_four_points():
    image = Image.new("RGB", (100, 100), RED)

    with pytest.raises(InvalidAreaError):
        apply_area(image, [(0, 0), (50, 0), (50, 50)])


def test_apply_area_outside_image():
    image = Image.new("RGB", (100, 100), RED)
    points = [(200, 200), (300, 200), (300, 300), (200, 300)]

    with pytest.raises(InvalidAreaError):
        apply_area(image, points)
