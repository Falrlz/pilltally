"""Tests for the endpoints in app/api (through the real FastAPI app)."""

import json
from collections.abc import Iterator
from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.config import settings
from app.main import app
from tests.samples import MODEL_FILES_EXIST, SAMPLE_COUNT, SAMPLE_IMAGE

requires_model = pytest.mark.skipif(
    not MODEL_FILES_EXIST, reason="model or sample image missing"
)


def image_bytes(image_format: str) -> bytes:
    """A small gray image saved in the given format."""

    image = Image.new("RGB", (64, 48), (128, 128, 128))
    buffer = BytesIO()
    image.save(buffer, format=image_format)
    return buffer.getvalue()


@pytest.fixture
def client() -> Iterator[TestClient]:
    """Client for the app with the real model ("with" runs the startup code)."""

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def client_without_model(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Iterator[TestClient]:
    """Client for the app when the model folder is empty."""

    monkeypatch.setattr(settings, "models_dir", tmp_path)
    with TestClient(app) as test_client:
        yield test_client


# --- /health ---


@requires_model
def test_health_ok(client: TestClient):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "model_loaded": True}


def test_health_without_model(client_without_model: TestClient):
    response = client_without_model.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "degraded", "model_loaded": False}


# --- /api/v1/model/info and /api/v1/model/file ---


@requires_model
def test_model_info(client: TestClient):
    response = client.get("/api/v1/model/info")

    assert response.status_code == 200
    body = response.json()
    assert body["imgsz"] == 640
    assert body["conf_threshold"] == 0.65
    assert "mae" in body["test"]


@requires_model
def test_model_file_with_version_is_cached_forever(client: TestClient):
    run_id = client.get("/api/v1/model/info").json()["run_id"]

    response = client.get(f"/api/v1/model/file?v={run_id}")

    assert response.status_code == 200
    assert "immutable" in response.headers["cache-control"]
    assert len(response.content) > 1_000_000


@requires_model
def test_model_file_without_version_must_revalidate(client: TestClient):
    response = client.get("/api/v1/model/file")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-cache"


def test_model_endpoints_without_model(client_without_model: TestClient):
    assert client_without_model.get("/api/v1/model/info").status_code == 503
    assert client_without_model.get("/api/v1/model/file").status_code == 503


# --- /api/v1/predict ---


@requires_model
def test_predict_sample_image(client: TestClient):
    files = {"file": ("pills.jpg", SAMPLE_IMAGE.read_bytes(), "image/jpeg")}

    response = client.post("/api/v1/predict", files=files)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == SAMPLE_COUNT
    assert len(body["boxes"]) == SAMPLE_COUNT
    assert body["conf_threshold"] == 0.65


@requires_model
def test_predict_with_area(client: TestClient):
    image = Image.open(SAMPLE_IMAGE)
    width = image.width
    height = image.height
    whole_image = [[0, 0], [width, 0], [width, height], [0, height]]
    files = {"file": ("pills.jpg", SAMPLE_IMAGE.read_bytes(), "image/jpeg")}

    response = client.post(
        "/api/v1/predict", files=files, data={"area": json.dumps(whole_image)}
    )

    assert response.status_code == 200
    assert response.json()["count"] == SAMPLE_COUNT


@requires_model
@pytest.mark.parametrize("image_format", ["PNG", "WEBP"])
def test_predict_accepts_png_and_webp(client: TestClient, image_format: str):
    files = {"file": ("image", image_bytes(image_format), "application/octet-stream")}

    response = client.post("/api/v1/predict", files=files)

    assert response.status_code == 200


@requires_model
def test_predict_rejects_non_image(client: TestClient):
    files = {"file": ("pills.jpg", b"not an image", "image/jpeg")}

    response = client.post("/api/v1/predict", files=files)

    assert response.status_code == 400


@requires_model
def test_predict_rejects_gif(client: TestClient):
    # The name says .jpg, but the content is a GIF
    files = {"file": ("pills.jpg", image_bytes("GIF"), "image/jpeg")}

    response = client.post("/api/v1/predict", files=files)

    assert response.status_code == 400


@requires_model
@pytest.mark.parametrize(
    "area",
    [
        "not json",
        "[[0, 0], [10, 0], [10, 10]]",
        '[[0, 0], [10, 0], [10, 10], ["a", 10]]',
        "[[500, 500], [600, 500], [600, 600], [500, 600]]",
    ],
)
def test_predict_rejects_bad_area(client: TestClient, area: str):
    files = {"file": ("image.png", image_bytes("PNG"), "image/png")}

    response = client.post("/api/v1/predict", files=files, data={"area": area})

    assert response.status_code == 400


@requires_model
def test_predict_rejects_too_large_file(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
):
    monkeypatch.setattr(settings, "max_upload_mb", 0)
    files = {"file": ("image.png", image_bytes("PNG"), "image/png")}

    response = client.post("/api/v1/predict", files=files)

    assert response.status_code == 413


def test_predict_without_model(client_without_model: TestClient):
    files = {"file": ("image.png", image_bytes("PNG"), "image/png")}

    response = client_without_model.post("/api/v1/predict", files=files)

    assert response.status_code == 503
