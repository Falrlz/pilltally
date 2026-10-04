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
| 1. Download & Store | ✅ Done (`ml/src/data/download.py`) |
| 2. EDA | ✅ Done (`ml/notebooks/01_exploratory_data_analysis.ipynb`) |
| 3. Combine & Split | 📝 Planned |
| 4–8. Augmentation, Training, Evaluation, Export, Verification | ⏳ Not started |

---

## Repository Architecture

```text
pilltally/
├── .github/                       # CI/CD Workflows
├── app/                           # Application Layer (Web / Edge Interface)
├── docs/                          # Documentation & Roadmaps
│   ├── configs/
│   │   └── datasets.yaml          # Declarative dataset acquisition config
│   ├── data/
│   │   ├── raw/                   # Raw datasets (3 sources, 8,615 images)
│   │   └── splits/                # Unified single-class train/val/test (planned)
│   ├── notebooks/
│   │   └── 01_exploratory_data_analysis.ipynb  # EDA & data audit
│   ├── reports/
│   │   ├── eda/                   # EDA metadata, duplicate pairs & figures
│   │   └── eval/                  # Counting benchmarks (planned)
│   ├── src/
│   │   ├── data/
│   │   │   └── download.py        # Dataset acquisition & verification runner
│   │   ├── models/                # YOLO26 training & ONNX export runners
│   │   ├── evaluation/            # Detection & MAE counting metrics
│   │   └── utils/                 # Rich console logging & helpers
│   ├── tests/                     # Pytest suite
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
# Run the pytest suite (validates schemas & credentials)
uv run pytest

# Pre-flight dry run (verifies remote endpoints without downloading)
uv run python -m src.data.download --dry-run
```

### 3. Dataset Acquisition

```powershell
# Option A: Test download of the smallest dataset (medical-pills, ~8.2 MB)
uv run python -m src.data.download --test

# Option B: Download all 3 datasets (8,615 images)
uv run python -m src.data.download

# Option C: Download a single dataset by name
uv run python -m src.data.download --dataset "medical-pills"
```

### 4. Exploratory Data Analysis (EDA)

Open [`ml/notebooks/01_exploratory_data_analysis.ipynb`](ml/notebooks/01_exploratory_data_analysis.ipynb) and run all cells. It covers label audit, completeness, density, object geometry, spatial distribution, duplicates/leakage, splits, and a combined-dataset simulation, ending with key findings and decisions (Section 14).

Outputs in `ml/reports/eda/` (overwritten on every run):

| File | Content |
| ---- | ------- |
| `image_index.parquet` | One row per image (split, size, object count, hashes) |
| `annotation_index.parquet` | One row per object (original class, format, normalized bbox) |
| `duplicate_pairs.csv` | Exact and near-duplicate image pairs |
| `figures/` | EDA plots and sample grids |

Key findings: labels are clean (no missing or invalid rows); 95% of CountingPills objects are polygons and must be converted to bboxes; objects average 50–144 px at 640, so `imgsz=640` is sufficient. See [docs/rencana_eda.md](docs/rencana_eda.md) and [docs/rencana_preprocessing.md](docs/rencana_preprocessing.md).

### 5. Code Quality & Standards

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
[1. Download & Store] ➔ [2. EDA] ➔ [3. Combine & Split] ➔ [4. Augmentation Strategy]
                                                                     │
[8. Test & Verification] ❮─ [7. ONNX Export] ❮─ [6. Counting Eval] ❮─ [5. Train + Val (yolo26n)]
```

* Split plan: original splits are kept; train-only Pill Detection is split 8 : 1 : 1 by pill code; medical-pills test is taken from train.
* Augmentation: no offline augmentation; YOLO default online augmentation.
* Details: [docs/rencana_pipeline_ml.md](docs/rencana_pipeline_ml.md).

---

## License
This project is licensed under the MIT License.
