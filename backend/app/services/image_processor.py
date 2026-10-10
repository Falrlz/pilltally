"""
Prepare an image for the model.

Steps (same as the browser, see docs/web_app.md section 3):
1. decode_image: bytes -> RGB image, rotated upright (EXIF)
2. apply_area (optional): crop to the counting area, gray outside it
3. letterbox: resize to imgsz x imgsz, keep aspect ratio, pad with gray
"""

from dataclasses import dataclass
from io import BytesIO

import numpy as np
from PIL import Image, ImageDraw, ImageOps, UnidentifiedImageError

# Ultralytics letterbox gray
PAD_COLOR = (114, 114, 114)

# Image formats we accept (names as Pillow reports them)
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

# A point is (x, y) in pixels of the original image
Point = tuple[float, float]


class InvalidImageError(ValueError):
    """The uploaded file is not a readable image."""


class InvalidAreaError(ValueError):
    """The counting area is not 4 points inside the image."""


@dataclass
class AreaCrop:
    """The cropped region and where it starts in the original image."""

    image: Image.Image
    offset_x: int
    offset_y: int


@dataclass
class LetterboxInfo:
    """How the region was resized and padded (needed to map boxes back)."""

    scale: float
    pad_left: int
    pad_top: int


def decode_image(data: bytes) -> Image.Image:
    """Read JPEG/PNG/WebP bytes into an upright RGB image."""

    try:
        image = Image.open(BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError) as error:
        raise InvalidImageError("File is not a readable image") from error

    # Checked from the file content, not from the file name
    if image.format not in ALLOWED_FORMATS:
        raise InvalidImageError(f"Image format {image.format} is not supported")

    # Phone photos are often stored sideways with an EXIF rotation tag
    image = ImageOps.exif_transpose(image)
    return image.convert("RGB")


def apply_area(image: Image.Image, points: list[Point]) -> AreaCrop:
    """
    Crop the image to the counting area.

    The crop is the smallest rectangle around the 4 points.
    Inside that rectangle, everything outside the quadrilateral becomes gray.
    """

    if len(points) != 4:
        raise InvalidAreaError("Counting area needs exactly 4 points")

    xs = []
    ys = []
    for x, y in points:
        xs.append(x)
        ys.append(y)

    # Bounding rectangle, kept inside the image
    left = max(0, int(min(xs)))
    top = max(0, int(min(ys)))
    right = min(image.width, int(np.ceil(max(xs))))
    bottom = min(image.height, int(np.ceil(max(ys))))

    if right - left < 1 or bottom - top < 1:
        raise InvalidAreaError("Counting area is outside the image")

    cropped = image.crop((left, top, right, bottom))

    # Mask: white inside the quadrilateral, black outside
    shifted_points = []
    for x, y in points:
        shifted_points.append((x - left, y - top))
    mask = Image.new("L", cropped.size, 0)
    ImageDraw.Draw(mask).polygon(shifted_points, fill=255)

    # Keep the image where the mask is white, gray elsewhere
    gray = Image.new("RGB", cropped.size, PAD_COLOR)
    result = Image.composite(cropped, gray, mask)

    return AreaCrop(image=result, offset_x=left, offset_y=top)


def letterbox(image: Image.Image, imgsz: int) -> tuple[np.ndarray, LetterboxInfo]:
    """
    Resize to imgsz x imgsz like Ultralytics LetterBox.

    Returns the model input (float32, shape [1, 3, imgsz, imgsz], values 0-1)
    and the scale/padding used.
    """

    # Same rounding rules as Ultralytics LetterBox
    scale = min(imgsz / image.width, imgsz / image.height)
    new_width = round(image.width * scale)
    new_height = round(image.height * scale)
    pad_left = round((imgsz - new_width) / 2 - 0.1)
    pad_top = round((imgsz - new_height) / 2 - 0.1)

    resized = image.resize((new_width, new_height), Image.Resampling.BILINEAR)
    canvas = Image.new("RGB", (imgsz, imgsz), PAD_COLOR)
    canvas.paste(resized, (pad_left, pad_top))

    # [height, width, 3] with values 0-255
    pixels = np.asarray(canvas, dtype=np.float32)
    # values 0-1
    pixels = pixels / 255.0
    # [3, height, width]: the model wants color channels first
    pixels = pixels.transpose(2, 0, 1)
    # [1, 3, height, width]: a batch of one image
    model_input = np.expand_dims(pixels, axis=0)

    info = LetterboxInfo(scale=scale, pad_left=pad_left, pad_top=pad_top)
    return model_input, info
