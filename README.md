# Pill-Tally

> **Real-Time Pill Detection & Counting Engine powered by YOLO26 Nano (`yolo26n`)**

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Package Manager: uv](https://img.shields.io/badge/uv-Astral-DE5FE9?style=flat&logo=astral&logoColor=white)](https://astral.sh/uv)
[![Deep Learning: YOLO26](https://img.shields.io/badge/Model-YOLO26%20Nano-00FFFF?style=flat)](https://github.com/ultralytics/ultralytics)
[![MLOps: MLflow](https://img.shields.io/badge/MLOps-MLflow-0194E2?style=flat&logo=mlflow&logoColor=white)](https://mlflow.org/)
[![Linter: Ruff](https://img.shields.io/badge/Linter-Ruff-D7FF64?style=flat&logo=ruff&logoColor=black)](https://astral.sh/ruff)
[![Tests: Pytest](https://img.shields.io/badge/Testing-Pytest-0A9EDC?style=flat&logo=pytest&logoColor=white)](https://pytest.org/)

---

## 📌 Project Overview

**Pill-Tally** is an edge-optimized computer vision system designed for ultra-fast and accurate counting of pharmaceutical pills, tablets, and capsules. Built upon a unified multi-source dataset (~21,700 images) and fine-tuned on the modern **YOLO26 Nano (`yolo26n`)** architecture, Pill-Tally delivers low-latency, single-class detection ready for production deployment via **ONNX Runtime**.

---

## Repository Architecture

```text
pill-tally/
├── .github/                  # CI/CD Workflows
├── app/                      # Application Layer (Web / Edge Interface)
├── docs/                     # Documentation & Architecture Roadmaps
│   ├── sumber_dataset.md     # Original dataset sources & references
│   └── rencana_pipeline_ml.md# Comprehensive 8-phase ML roadmap
├── ml/                       # Machine Learning Core Engine
│   ├── configs/
│   │   └── datasets.yaml     # Declarative dataset acquisition config
│   ├── data/
│   │   ├── raw/              # Raw multi-source datasets (~21.7k images)
│   │   └── splits/           # Unified single-class train/val/test splits
│   ├── notebooks/
│   │   └── 01_exploratory_data_analysis.ipynb # Interactive EDA & audit
│   ├── reports/
│   │   ├── eda/              # Visual data distributions & artifacts
│   │   └── eval/             # MAE counting benchmarks & confusion matrices
│   ├── src/
│   │   ├── data/
│   │   │   └── download.py   # Dataset acquisition & verification runner
│   │   ├── models/           # YOLO26 training & ONNX export runners
│   │   ├── evaluation/       # Object detection & MAE counting metrics
│   │   └── utils/            # Rich console logging & helpers
│   ├── tests/                # Automated pytest validation suite
│   ├── .env.example          # Environment variables template
│   └── pyproject.toml        # Dependencies & Ruff linter configuration
├── .gitignore                # Centralized root gitignore
└── README.md                 # Project documentation
```

---

## Dataset Inventory (5 Sources)

Pill-Tally integrates 5 distinct pharmaceutical datasets into a single universal class (`0: pill`):

| No | Dataset Name | Source | Format | Images | Primary Feature |
|:--:|:---|:---|:---:|:---:|:---|
| 1 | **CountingPills** | [Roboflow Universe](https://universe.roboflow.com/countingpills-rbjwo/countingpills) | Polygon (Seg) | ~7,011 | Dense pills on pharmaceutical trays |
| 2 | **Pill Detection (Korea 74)** | [Roboflow Universe](https://universe.roboflow.com/pilldetection-qsfgv/pill-detection-tbmmm) | BBox (74 classes) | ~1,489 | Diverse tablet shapes, imprints & colors |
| 3 | **Tablet Defect Detection** | [Roboflow Universe](https://universe.roboflow.com/fyp-qjwy0/tablet-defect-detection-er87f) | BBox (2 classes) | ~11,832 | Quality inspection & defected tablets |
| 4 | **Pill Detection (Damaged)** | [Roboflow Universe](https://universe.roboflow.com/placement-2023-9jdtv/pill-detection-rfmyx) | BBox (2 classes) | ~1,314 | Broken capsules & foreign objects |
| 5 | **Medical Pills** | [Ultralytics Docs](https://docs.ultralytics.com/datasets/detect/medical-pills/) | BBox | ~115 | Benchmark clinical pill detection |
| **TOTAL** | | | | **~21,761** | **Multi-angle, diverse lighting & textures** |

---

## Quickstart Guide

### 1. Prerequisites & Environment Setup

This project uses [`uv`](https://astral.sh/uv) for fast, isolated Python package management.

```powershell
# Navigate to the ML engine directory
cd ml

# Sync all dependencies into virtual environment (.venv)
uv sync

# Configure your environment secrets
cp .env.example .env
# Edit .env and supply your ROBOFLOW_API_KEY
```

### 2. Verification & Testing

```powershell
# Run the automated pytest suite (validates schemas & credentials)
uv run pytest

# Run pre-flight dry-run check (verifies remote endpoints without downloading)
uv run python -m src.data.download --dry-run
```

### 3. Dataset Acquisition

```powershell
# Option A: Test download on the smallest sample dataset (~8.2 MB)
uv run python -m src.data.download --test

# Option B: Full download of all 5 raw datasets (~21,700 images)
uv run python -m src.data.download
```

### 4. Interactive Exploratory Data Analysis (EDA)

Launch Jupyter or open the notebook directly in your IDE:
* **Notebook Path:** [`ml/notebooks/01_exploratory_data_analysis.ipynb`](ml/notebooks/01_exploratory_data_analysis.ipynb)
* Inspect pill density distributions, polygon-to-box conversions, aspect ratios, and visual samples.

### 5. Code Quality & Standards

Pill-Tally strictly enforces modern Python standards with **Ruff**:

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
[Phase 1: Download & Store] ➔ [Phase 2: EDA & Data Audit] ➔ [Phase 3: Combine & Stratified Splits]
                                                                        │
[Phase 8: Edge Verification] ❮─ [Phase 7: ONNX Export] ❮─ [Phase 6: MAE Counting Eval] ❮─ [Phase 4: YOLO26 Training]
```

* For detailed architectural specifications and design decisions, see [docs/rencana_pipeline_ml.md](docs/rencana_pipeline_ml.md).

---

## License
This project is licensed under the MIT License.
