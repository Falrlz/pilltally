"""
Measure inference speed (latency and FPS).
"""

import time
from pathlib import Path

from ultralytics import YOLO


def measure_latency(
    model: YOLO,
    image_paths: list[Path],
    imgsz: int,
    warmup: int,
    repeats: int,
    device: str = "cpu",
) -> dict[str, float]:
    """Average time per image in ms (including pre- and post-processing) and FPS.

    The first `warmup` predictions are not timed, because the first calls are
    always slower (memory allocation, graph setup).
    """

    n_images = len(image_paths)
    if n_images == 0:
        raise ValueError("At least one image is needed")

    for index in range(warmup):
        path = image_paths[index % n_images]
        model.predict(source=str(path), imgsz=imgsz, device=device, verbose=False)

    total_seconds = 0.0
    for index in range(repeats):
        path = image_paths[index % n_images]
        start = time.perf_counter()
        model.predict(source=str(path), imgsz=imgsz, device=device, verbose=False)
        total_seconds += time.perf_counter() - start

    latency_ms = 1000 * total_seconds / repeats
    return {"latency_ms": latency_ms, "fps": 1000 / latency_ms}
