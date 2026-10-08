"""
Write the parity fixture for the frontend tests.

The TypeScript postprocess (frontend/src/features/counting/lib/postprocess.ts)
must give the same boxes as the Python predictor. This script runs the real
model on a few test images and saves, per image:
- the raw model candidates (score >= MIN_SCORE, enough for any threshold test)
- the letterbox scale/padding
- the boxes and count the Python predictor returns

Run from backend/ (needs ml/models and ml/data/splits):
    uv run python -m scripts.make_parity_fixtures
"""

import json
from pathlib import Path

from PIL import Image

from app.core.config import BACKEND_DIR, settings
from app.services.image_processor import decode_image, letterbox
from app.services.model_loader import create_session, get_model_path, load_model_info
from app.services.predictor import (
    IOU_THRESHOLD,
    MAX_DETECTIONS,
    Predictor,
)

# One correctly counted test image per dataset
TEST_IMAGES_DIR = settings.models_dir.parent / "data" / "splits" / "images" / "test"
IMAGE_NAMES = [
    "cp_no_error_image_20250422_105348_jpg.rf.f32862b1453038e4d8185a65174cd9bd.jpg",
    "kr_K-003544-006563-016548-027993_0_2_0_2_90_000_200_png.rf.8c4e5da81492becc1491fbb45e1e81e4.jpg",
    "ul_Frame_220.jpg",
]

# Candidates below this score are left out to keep the file small.
# They can never pass conf_threshold (0.65), so the result does not change.
MIN_SCORE = 0.25

# Image sizes for the letterbox check, including halfway rounding cases
# (e.g. 1280 x 721 -> 360.5, which Python rounds to 360 and Math.round to 361)
LETTERBOX_SIZES = [
    (1280, 721),
    (1280, 723),
    (1280, 640),
    (320, 640),
    (1920, 1080),
    (1080, 1920),
    (4032, 3024),
    (641, 639),
    (100, 100),
    (5, 1000),
]

OUTPUT_PATH = (
    BACKEND_DIR.parent
    / "frontend"
    / "src"
    / "features"
    / "counting"
    / "lib"
    / "fixtures"
    / "parity.json"
)


def raw_candidates(output, min_score: float) -> list[list[float]]:
    """Candidates [cx, cy, w, h, score] from the raw output [1, 5, N]."""

    rows = output[0]
    candidates = []
    for i in range(rows.shape[1]):
        score = float(rows[4][i])
        if score >= min_score:
            candidates.append(
                [
                    float(rows[0][i]),
                    float(rows[1][i]),
                    float(rows[2][i]),
                    float(rows[3][i]),
                    score,
                ]
            )
    return candidates


def make_image_fixture(predictor: Predictor, image_path: Path) -> dict:
    """Raw candidates + expected Python result for one image."""

    image = decode_image(image_path.read_bytes())
    model_input, info = letterbox(image, predictor.info.imgsz)
    output = predictor.session.run(None, {predictor.input_name: model_input})[0]
    result = predictor.predict(image)

    expected_boxes = []
    for box in result.boxes:
        expected_boxes.append([box.x1, box.y1, box.x2, box.y2, box.score])

    return {
        "name": image_path.name,
        "image_width": image.width,
        "image_height": image.height,
        "letterbox": {
            "scale": info.scale,
            "pad_left": info.pad_left,
            "pad_top": info.pad_top,
        },
        "candidates": raw_candidates(output, MIN_SCORE),
        "expected_count": result.count,
        "expected_boxes": expected_boxes,
    }


def make_letterbox_cases(imgsz: int) -> list[dict]:
    """Scale and padding that the backend letterbox uses for each size."""

    cases = []
    for width, height in LETTERBOX_SIZES:
        image = Image.new("RGB", (width, height))
        _, info = letterbox(image, imgsz)
        cases.append(
            {
                "width": width,
                "height": height,
                "scale": info.scale,
                "pad_left": info.pad_left,
                "pad_top": info.pad_top,
            }
        )
    return cases


def main() -> None:
    info = load_model_info(settings.models_dir)
    session = create_session(get_model_path(settings.models_dir))
    predictor = Predictor(session, info)

    images = []
    for name in IMAGE_NAMES:
        fixture = make_image_fixture(predictor, TEST_IMAGES_DIR / name)
        images.append(fixture)
        print(
            f"{name}: {fixture['expected_count']} pills, "
            f"{len(fixture['candidates'])} candidates"
        )

    data = {
        "run_name": info.run_name,
        "imgsz": info.imgsz,
        "conf_threshold": info.conf_threshold,
        "iou_threshold": IOU_THRESHOLD,
        "max_detections": MAX_DETECTIONS,
        "min_score": MIN_SCORE,
        "letterbox_cases": make_letterbox_cases(info.imgsz),
        "images": images,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(data, indent=1), encoding="utf-8")
    print(f"Saved {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
