# PillTally

> **Real-Time Pill Detection & Counting Engine powered by YOLO26 Nano (`yolo26n`)**

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Package Manager: uv](https://img.shields.io/badge/uv-Astral-DE5FE9?style=flat&logo=astral&logoColor=white)](https://astral.sh/uv)
[![Deep Learning: YOLO26](https://img.shields.io/badge/Model-YOLO26%20Nano-00FFFF?style=flat)](https://github.com/ultralytics/ultralytics)
[![MLOps: MLflow](https://img.shields.io/badge/MLOps-MLflow-0194E2?style=flat&logo=mlflow&logoColor=white)](https://mlflow.org/)
[![Linter: Ruff](https://img.shields.io/badge/Linter-Ruff-D7FF64?style=flat&logo=ruff&logoColor=black)](https://astral.sh/ruff)
[![Tests: Pytest](https://img.shields.io/badge/Testing-Pytest-0A9EDC?style=flat&logo=pytest&logoColor=white)](https://pytest.org/)

---

## Project Overview

**PillTally** is an edge-optimized computer vision system for fast and accurate counting of pharmaceutical pills, tablets, and capsules. It combines three public datasets (8,615 images, 33,319 labeled pills) into a single `pill` class and fine-tunes **YOLO26 Nano (`yolo26n`)** for low-latency detection, deployed via **ONNX Runtime**.

---

## Project Status

| Phase | Status |
| ----- | ------ |
| 1. Download | ✅ Done (`pipelines/download_pipeline.py`) |
| 2. EDA | ✅ Done (`notebooks/01_exploratory_data_analysis.ipynb`) |
| 3. Data preparation (combine & split) | ✅ Done (`pipelines/data_prep_pipeline.py`) |
| 4. Training (yolo26n + MLflow) | 🛠️ Code ready, sanity run done; full training pending (needs GPU) |
| 5. Evaluation (detection + counting) | 🛠️ Code ready (`pipelines/evaluate_pipeline.py`) |
| 6. ONNX export + benchmark | 🛠️ Code ready (`pipelines/export_pipeline.py`) |
| 7. Promote final model | 🛠️ Code ready (`pipelines/promote_pipeline.py`) |

---

## Repository Architecture

```text
pilltally/
├── .github/                       # CI/CD Workflows
├── app/                           # Application Layer (Web / Edge Interface)
├── docs/                          # Plans (Indonesian, not tracked)
├── ml/                            # Machine learning engine
│   ├── configs/                   # One YAML per stage (validated with Pydantic)
│   ├── src/                       # Logic: small testable functions (no MLflow)
│   │   ├── data/                  # download, split, labels, build, validate
│   │   ├── models/                # train, export, promote
│   │   ├── evaluation/            # counting metrics, evaluation, benchmark
│   │   └── utils/                 # logger, config, paths, tracking
│   ├── pipelines/                 # Flow: run_xxx() per stage, numbered steps
│   ├── tests/                     # Pytest suite (tests src/ only)
│   ├── notebooks/                 # 01_exploratory_data_analysis.ipynb
│   ├── data/
│   │   ├── raw/                   # Raw datasets (3 sources, 8,615 images)
│   │   └── splits/                # Combined single-class train/val/test
│   ├── outputs/                   # All generated results (not tracked)
│   │   ├── eda/                   # EDA metadata, duplicate pairs & figures
│   │   ├── runs/<run_name>/       # One folder per training scenario (+ eval/, export/)
│   │   ├── pretrained/            # Downloaded COCO weights
│   │   └── mlflow/                # MLflow database & artifacts
│   ├── models/                    # Final model for the app + model_info.json
│   ├── .env.example               # Environment variables template
│   └── pyproject.toml             # Dependencies & Ruff configuration
├── .gitignore
└── README.md
```

---

## Dataset Inventory

Three datasets, all mapped to a single class (`0: pill`):

| No | Dataset | Source | Format | Images | Objects | Characteristics |
|:--:|:---|:---|:---:|---:|---:|:---|
| 1 | **CountingPills** | [Roboflow Universe](https://universe.roboflow.com/countingpills-rbjwo/countingpills) | Polygon + BBox | 7,011 | 25,635 | Loose pills shot from below a transparent container; 0–39 per image; 3 augmented copies per source photo |
| 2 | **Pill Detection (Korea 74)** | [Roboflow Universe](https://universe.roboflow.com/pilldetection-qsfgv/pill-detection-tbmmm) | BBox (74 classes) | 1,489 | 5,662 | Studio shots; 3–4 pills per image; 74 pill types |
| 3 | **Medical Pills** | [Ultralytics Docs](https://docs.ultralytics.com/datasets/detect/medical-pills/) | BBox | 115 | 2,022 | Blister packs (video frames); 14–21 pills per image |
| | **Total** | | | **8,615** | **33,319** | |

---

## Quickstart Guide

### 1. Environment Setup

This project uses [`uv`](https://astral.sh/uv) for Python package management.

```powershell
# Navigate to the ML engine directory
cd ml

# Sync all dependencies into the virtual environment (.venv)
uv sync

# Configure your environment secrets
cp .env.example .env
# Edit .env and supply your ROBOFLOW_API_KEY
```

### 2. Verification & Testing

```powershell
# Run the pytest suite (`uv run pytest` fails on Windows because of the uv trampoline)
uv run python -m pytest

# Dry run: check dataset sources and the API key without downloading
uv run python -c "from pipelines.download_pipeline import run_download; run_download(dry_run=True)"
```

### 3. Dataset Acquisition

```powershell
# Download all 3 datasets (8,615 images) into data/raw/
uv run python -m pipelines.download_pipeline

# Only the smallest dataset (medical-pills), or one dataset by name
uv run python -c "from pipelines.download_pipeline import run_download; run_download(sample=True)"
uv run python -c "from pipelines.download_pipeline import run_download; run_download(dataset='medical-pills')"
```

### 4. Exploratory Data Analysis (EDA)

Open [`ml/notebooks/01_exploratory_data_analysis.ipynb`](ml/notebooks/01_exploratory_data_analysis.ipynb) and run all cells. It covers label audit, completeness, density, object geometry, spatial distribution, duplicates/leakage, splits, and a combined-dataset simulation, ending with key findings and decisions (Section 14).

Outputs in `ml/outputs/eda/` (overwritten on every run):

| File | Content |
| ---- | ------- |
| `image_index.parquet` | One row per image (split, size, object count, hashes) |
| `annotation_index.parquet` | One row per object (original class, format, normalized bbox) |
| `duplicate_pairs.csv` | Exact and near-duplicate image pairs |
| `figures/` | EDA plots and sample grids |

Key findings: labels are clean (no missing or invalid rows); 95% of CountingPills objects are polygons and must be converted to bboxes; objects average 50–144 px at 640, so `imgsz=640` is sufficient. See [docs/rencana_eda.md](docs/rencana_eda.md) and [docs/rencana_preprocessing.md](docs/rencana_preprocessing.md).

### 5. Training Pipeline

All settings live in `ml/configs/*.yaml`. Run from `ml/`:

```powershell
# Combine the datasets into data/splits/ (7,721 / 559 / 335 images)
uv run python -m pipelines.data_prep_pipeline

# Train -> evaluate -> export (one MLflow run, results in outputs/runs/<run_name>/)
uv run python -m pipelines.full_pipeline

# Compare scenarios (sort by val/mae), then put the chosen run id in configs/promote.yaml
uv run mlflow ui --backend-store-uri sqlite:///outputs/mlflow/mlflow.db
uv run python -m pipelines.promote_pipeline
```

Set `sanity_run: true` in `configs/train.yaml` for a quick 1-epoch check, and use a new `run_name` for every scenario.

### 6. Code Quality & Standards

PillTally enforces modern Python standards with **Ruff** (configured in `ml/pyproject.toml`):

```powershell
# Lint check
uv run ruff check .

# Auto-fix linting issues
uv run ruff check . --fix

# Auto-format codebase
uv run ruff format .
```

---

## Machine Learning Roadmap

```
[Download] ➔ [EDA] ➔ [Data prep] ➔ [Train yolo26n] ➔ [Evaluate] ➔ [Export ONNX] ➔ [Promote]
                                          └──────────── one MLflow run ────────────┘
```

* Split: original splits are kept; train-only Pill Detection is split 8 : 1 : 1 by pill code; medical-pills test is taken from train per near-duplicate frame group.
* Augmentation: no offline augmentation; YOLO default online augmentation.
* Metrics: precision, recall, F1, mAP50, mAP50-95; counting MAE, exact match, within ±1 (overall and per dataset); latency/FPS.
* The scenario is chosen by `val/mae`; test metrics are only reported.
* Details: [docs/rencana_pipeline_ml.md](docs/rencana_pipeline_ml.md).

---

## License
This project is licensed under the MIT License.
