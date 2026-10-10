# Pilltally - Backend

The REST API for **Pilltally**, an automated pill counter. It counts pills in uploaded photos and serves the ONNX model and its metrics to the web app.

The service is built on **FastAPI** and **onnxruntime**. It does not import PyTorch or the training code: it loads only the promoted files in `ml/models/` (`pilltally_yolo26n.onnx` and `model_info.json`). Live camera and video counting do **not** use this server; they run in the browser (see [`frontend/README.md`](../frontend/README.md)).

---

## Tech Stack

- **Web Framework**: [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/)
- **Validation & Settings**: [Pydantic v2](https://docs.pydantic.dev/) + `pydantic-settings`
- **Inference Runtime**: [onnxruntime](https://onnxruntime.ai/) (CPU)
- **Image Processing**: [Pillow](https://python-pillow.org/), [NumPy](https://numpy.org/)
- **Tooling**: [uv](https://docs.astral.sh/uv/), [Ruff](https://docs.astral.sh/ruff/), [pytest](https://pytest.org/) + `httpx2`

---

## Directory Structure

```text
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── health.py          # GET /health
│   │       │   ├── model.py           # GET /api/v1/model/info, GET /api/v1/model/file
│   │       │   └── predict.py         # POST /api/v1/predict
│   │       ├── api.py                 # Collects the /api/v1 routers
│   │       └── deps.py                # get_predictor: 503 when the model is not loaded
│   ├── core/
│   │   ├── config.py                  # Settings from PILLTALLY_* environment variables
│   │   └── logging.py                 # Logger setup
│   ├── schemas/
│   │   ├── health.py                  # HealthResponse
│   │   ├── model.py                   # ModelInfo (shape of model_info.json)
│   │   └── predict.py                 # Box, PredictResponse
│   ├── services/
│   │   ├── model_loader.py            # Reads model_info.json, creates the ONNX session
│   │   ├── image_processor.py         # Decode, counting area crop, letterbox
│   │   └── predictor.py               # Model run, threshold, NMS, boxes back to the photo
│   └── main.py                        # App, lifespan (loads the model once), CORS
├── scripts/
│   └── make_parity_fixtures.py        # Reference outputs for the frontend parity tests
├── tests/                             # pytest suite (48 tests)
├── main.py                            # Development entry point (uvicorn with reload)
└── pyproject.toml                     # Dependencies and Ruff rules
```

---

## How a Photo Is Counted

```text
uploaded bytes (JPEG / PNG / WebP, ≤ 10 MB)
        │
        ▼
1. decode_image ─────── format checked from the content, EXIF rotation applied, RGB
        │
        ▼
2. apply_area ───────── optional: crop to the box around the 4 area points,
        │               paint everything outside the quadrilateral gray
        ▼
3. letterbox ────────── resize to 640 × 640, keep aspect ratio, pad with gray (114)
        │
        ▼
4. YOLO26n (ONNX) ───── output [1, 5, 8400]: cx, cy, w, h, score per candidate
        │
        ▼
5. score ≥ conf_threshold (0.65) → NMS (IoU 0.7, max 300) → boxes back to photo pixels
        │
        ▼
6. area filter ──────── keep boxes whose center is inside the quadrilateral
        │
        ▼
count + boxes + image size + inference time
```

- **Same rules as the evaluation and the browser.** The threshold rule (`score >= conf_threshold`) and NMS settings match `ml/src/evaluation/evaluate.py` and the TypeScript code in the frontend.
- **In memory only.** The upload is read into RAM, counted, and dropped. Nothing is written to disk.
- **Threshold from the model.** `imgsz` and `conf_threshold` come from `model_info.json`, never from settings, so they always match the promoted model.

---

## API Reference

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/health` | Server status: `ok` when the model is loaded, otherwise `degraded` |
| `GET` | `/api/v1/model/info` | Contents of `model_info.json` (run, threshold, val/test metrics) |
| `GET` | `/api/v1/model/file?v=<run_id>` | The ONNX file for the browser |
| `POST` | `/api/v1/predict` | Count pills in one photo |

### `POST /api/v1/predict`

Form data:

- `file`: the image (JPEG, PNG, or WebP)
- `area` (optional): 4 points in pixels of the uploaded image, as JSON, e.g. `[[10, 20], [300, 20], [300, 400], [10, 400]]`

Response:

```json
{
  "count": 12,
  "boxes": [{ "x1": 41.2, "y1": 88.0, "x2": 97.5, "y2": 140.3, "score": 0.93 }],
  "image_width": 1280,
  "image_height": 960,
  "conf_threshold": 0.65,
  "inference_ms": 61.4
}
```

Errors: `400` for an unreadable image or invalid area, `413` for a file larger than the upload limit, `503` when the model is not loaded. Error messages are in English; the frontend maps status codes to its own bilingual messages.

### Model file caching

The frontend asks for `/api/v1/model/file?v=<run_id>`, using the run id from `/model/info`. When `v` matches the loaded model, the response is cached for one year (`immutable`). A new promoted model has a new run id, so browsers download it once again. Without a matching `v`, the response is `no-cache`.

### Startup behavior

The model is loaded once at startup and kept in `app.state.predictor`. If the files are missing or broken, the server still starts: `/health` reports `degraded` and the model endpoints return `503`.

---

## Settings

Read from environment variables with the `PILLTALLY_` prefix, or from `backend/.env`:

| Variable | Default | Meaning |
| :--- | :--- | :--- |
| `PILLTALLY_MODELS_DIR` | `../ml/models` | Folder with `pilltally_yolo26n.onnx` and `model_info.json` |
| `PILLTALLY_CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed frontend origins (JSON list) |
| `PILLTALLY_MAX_UPLOAD_MB` | `10` | Largest accepted upload |

---

## Getting Started

### 1. Prerequisites
- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- The promoted model in `ml/models/`

### 2. Install
From `backend/`:
```bash
uv sync
```

### 3. Run the Server
```bash
# Option A: uvicorn with reload
uv run uvicorn app.main:app --reload --port 8000

# Option B: the entry point script (same settings)
uv run python main.py
```

Interactive docs:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

---

## Parity Fixtures

The browser repeats the letterbox, threshold, and NMS steps in TypeScript. To prove both sides agree, this script runs the real model on a few test images and saves the raw candidates, letterbox values, and final boxes to `frontend/src/features/counting/lib/fixtures/parity.json`:

```bash
uv run python -m scripts.make_parity_fixtures
```

Run it again whenever a new model is promoted, then run `npm test` in `frontend/`. It needs `ml/models/` and `ml/data/splits/`.

---

## Quality Assurance & Testing

```bash
# Unit and API tests (48 tests)
uv run python -m pytest

# Lint and format checks
uv run ruff check .
uv run ruff format --check .
```

On Windows, use `uv run python -m pytest`; plain `uv run pytest` can fail because of the uv launcher.
