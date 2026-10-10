# Pilltally - Machine Learning

The training pipeline for **Pilltally**, an automated pill counter. It turns three public datasets into one single-class (`pill`) dataset, fine-tunes **YOLO26n**, picks a confidence threshold for counting, exports the model to **ONNX**, and promotes the chosen run to `ml/models/` for the backend and the browser.

Counting is treated as detection: **the count is the number of boxes with a score of at least `conf_threshold`**. The model is therefore judged on counting metrics (MAE, exact count, within ±1) as well as the usual detection metrics.

---

## Tech Stack

- **Model & Training**: [Ultralytics](https://docs.ultralytics.com/) YOLO26n (COCO-pretrained)
- **Experiment Tracking**: [MLflow](https://mlflow.org/) (SQLite backend, local artifact store)
- **Export**: [ONNX](https://onnx.ai/), [onnxruntime](https://onnxruntime.ai/), onnxslim
- **Data**: [Roboflow](https://roboflow.com/) API, [pandas](https://pandas.pydata.org/), [OpenCV](https://opencv.org/), [Pillow](https://python-pillow.org/)
- **Config**: YAML validated with [Pydantic v2](https://docs.pydantic.dev/)
- **Visualization**: Matplotlib, Seaborn (EDA notebook)
- **Tooling**: [uv](https://docs.astral.sh/uv/), [Ruff](https://docs.astral.sh/ruff/), [pytest](https://pytest.org/)

---

## Directory Structure

```text
ml/
├── configs/                     # One YAML per stage, validated with Pydantic
│   ├── datasets.yaml            # Dataset sources
│   ├── preprocess.yaml          # Seed, split ratio, prefixes
│   ├── train.yaml               # Run name, epochs, imgsz, batch, freeze, ...
│   ├── evaluate.yaml            # Threshold grid, number of saved error examples
│   ├── export.yaml              # ONNX options, parity and benchmark settings
│   ├── promote.yaml             # Run id of the chosen model
│   └── import_run.yaml          # Run folder trained on another machine
├── notebooks/
│   └── 01_exploratory_data_analysis.ipynb
├── pipelines/                   # Flow: one run_xxx() per stage, numbered steps
│   ├── download_pipeline.py
│   ├── data_prep_pipeline.py
│   ├── train_pipeline.py
│   ├── evaluate_pipeline.py
│   ├── export_pipeline.py
│   ├── promote_pipeline.py
│   ├── import_run_pipeline.py
│   └── full_pipeline.py         # data_prep → train → evaluate → export
├── src/                         # Logic: small pure functions, no YAML and no MLflow
│   ├── data/                    # download, loader, splitter, label converter, builder, validator
│   ├── models/                  # train, export (+ PyTorch/ONNX parity), promote
│   ├── evaluation/              # counting metrics, evaluation, latency benchmark
│   └── utils/                   # config, paths, logger, MLflow tracking, run import
├── tests/                       # pytest suite (35 tests, covers src/)
├── data/                        # raw/ and splits/ (not tracked)
├── outputs/                     # EDA files, runs, pretrained weights, MLflow (not tracked)
├── models/                      # Promoted model: .onnx, .pt, model_info.json
├── .env.example                 # ROBOFLOW_API_KEY
└── pyproject.toml
```

### Design rules
1. **`src/` is logic.** Functions take values as arguments and return results. They never read YAML or touch MLflow, so they are easy to test.
2. **`pipelines/` is flow.** Each file has one `run_xxx()` function with numbered, logged steps that call `src/` in order. There is no argparse: to change a parameter, edit the YAML or call the function.
3. **Values live in YAML.** Unknown keys (typos) are rejected by Pydantic.
4. **Stages talk through files on disk**, so every pipeline can run on its own.
5. **Each fact is written once**: paths in `src/utils/paths.py`, config loading in `src/utils/config.py`, MLflow setup in `src/utils/tracking.py`.

---

## Datasets

All original classes are mapped to one class, `0: pill`.

| Dataset | Source | Original labels | Images | Pills | Role |
| :--- | :--- | :--- | ---: | ---: | :--- |
| CountingPills (`cp_`) | [Roboflow Universe](https://universe.roboflow.com/countingpills-rbjwo/countingpills), v36 | Polygon (95%) + bbox | 7,011 | 25,635 | Dense loose pills on a counting tray |
| Pill Detection (`kr_`) | [Roboflow Universe](https://universe.roboflow.com/pilldetection-qsfgv/pill-detection-tbmmm), v22 | Bbox, 74 classes | 1,489 | 5,662 | Many shapes, colors, and imprints |
| medical-pills (`ul_`) | [Ultralytics](https://docs.ultralytics.com/datasets/detect/medical-pills/) | Bbox | 115 | 2,022 | Extra variety (blister pack frames) |
| **Total** | | | **8,615** | **33,319** | |

Two other datasets were reviewed and dropped: *Pill Detection v6* (intact pills were not labeled) and *Tablet Defect v3* (73% empty images, single close-up pills).

### Preprocessing decisions
Taken from the EDA notebook:

| Topic | Decision |
| :--- | :--- |
| Labels | Polygons converted to min–max boxes; every class becomes `0` |
| Image size | `imgsz=640` (pills average 50–144 px at that size) |
| Empty images | All 1,049 kept, so the model learns not to see pills in the background |
| Augmentation | No offline augmentation; YOLO's default online augmentation only |
| Resizing | Images are copied as they are; YOLO letterboxes them during training |

### Leakage-aware splits

| Dataset | Rule |
| :--- | :--- |
| CountingPills | Original folders kept. Train holds 2,150 source photos × 3 Roboflow augmented copies; val and test hold only original photos |
| Pill Detection | Train only, so it is split **8 : 1 : 1 by pill-combination code** (498 codes); repeated photos of the same combination never cross splits |
| medical-pills | Train and val kept. Near-duplicate frames are grouped; test (10%) is drawn from groups that exist only in train |

Result:

| Dataset | Train | Val | Test | Total |
| :--- | ---: | ---: | ---: | ---: |
| CountingPills | 6,450 | 386 | 175 | 7,011 |
| Pill Detection | 1,191 | 150 | 148 | 1,489 |
| medical-pills | 80 | 23 | 12 | 115 |
| **Total** | **7,721** | **559** | **335** | **8,615** |

`data_validator` checks that image and label counts match, every label line has 5 values with class `0`, the total stays 33,319 pills, and no pill code or frame group appears in more than one split.

---

## Pipeline

```text
[Download] → [EDA] → [Data prep] → [Train] → [Evaluate] → [Export ONNX] → [Promote]
                                    └──────── one MLflow run ────────┘      (manual choice)
```

| Stage | Function | What it does |
| :--- | :--- | :--- |
| Download | `run_download()` | Fetches the 3 datasets into `data/raw/` (`dry_run=True` only checks sources and the API key) |
| Data prep | `run_data_prep()` | Assigns splits, converts labels, writes `data/splits/` with `data.yaml` and `split_manifest.csv`, then validates |
| Train | `run_train()` | Fine-tunes `yolo26n.pt` and opens an MLflow run |
| Evaluate | `run_evaluate(run_id)` | Picks `conf_threshold` on val, then logs counting and detection metrics for val and test |
| Export | `run_export(run_id)` | Exports ONNX, compares PyTorch and ONNX counts on 50 val images, measures latency |
| Promote | `run_promote()` | Copies the run in `promote.yaml` to `models/` and writes `model_info.json` |
| Import | `run_import()` | Registers a run trained elsewhere (e.g. Kaggle) in the local MLflow store |

### Choosing the model
1. Run one or more scenarios, each with its own `run_name` in `train.yaml`.
2. In the MLflow UI, sort runs by **`val/mae`** (lowest wins).
3. Put the run id in `promote.yaml` and run the promote pipeline.

The **test set is never used to choose** a model or a threshold. It is only reported.

### Training without a local GPU
Train on Kaggle (or any GPU machine), copy the run folder to `outputs/runs/<run_name>/`, set `import_run.yaml`, and run `import_run_pipeline`. Evaluate, export, and promote then work as for a local run.

---

## Active Model

| Item | Value |
| :--- | :--- |
| Run | `yolo26n_baseline_gpu` (Kaggle T4, about 1 hour) |
| Base weights | `yolo26n.pt` (COCO), all layers trained |
| Training | 50 epochs, `imgsz=640`, `batch=16`, `seed=42`, deterministic |
| `conf_threshold` | **0.65** (lowest val MAE) |
| ONNX | 9.3 MB, FP32, fixed 640 input, output `[1, 5, 8400]` |
| PyTorch/ONNX parity | 0 differences on 50 val images |
| CPU latency (Kaggle) | ONNX 58 ms/image, PyTorch 73 ms/image |

The ONNX output uses the one-to-many head, so every consumer must apply the threshold and then NMS (IoU 0.7). The backend and the frontend both do this.

---

## Evaluation

### Metrics

| Group | Metrics |
| :--- | :--- |
| Counting | **MAE** (mean of \|predicted − true\|), **exact count** (% of images with no error), **within ±1** (% with error ≤ 1); overall and per dataset |
| Detection | Precision, recall, F1, mAP50, mAP50-95 |
| Speed | Latency (ms/image), FPS, ONNX size |

Accuracy and ROC-AUC are not used: object detection has no defined true negatives. Exact count and the PR curve take their place. Empty images are included in the counting metrics.

### Counting results

| Split | Images | MAE | Exact count | Within ±1 |
| :--- | ---: | ---: | ---: | ---: |
| Validation | 559 | 0.034 | 96.6% | 100% |
| **Test** | **335** | **0.006** | **99.4%** | **100%** |

| Dataset | Val MAE | Val exact | Test MAE | Test exact |
| :--- | ---: | ---: | ---: | ---: |
| CountingPills | 0.028 | 97.2% | 0.006 | 99.4% |
| Pill Detection | 0.000 | 100% | 0.000 | 100% |
| medical-pills | 0.348 | 65.2% | 0.083 | 91.7% |

### Detection results

| Split | Precision | Recall | F1 | mAP50 | mAP50-95 |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Validation | 0.997 | 0.996 | 0.996 | 0.995 | 0.887 |
| Test | 0.999 | 0.999 | 0.999 | 0.995 | 0.909 |

### Threshold search (validation)

| Threshold | 0.10 | 0.25 | 0.40 | 0.50 | 0.60 | **0.65** | 0.70 | 0.75 | 0.80 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Val MAE | 0.068 | 0.048 | 0.041 | 0.039 | 0.038 | **0.034** | 0.039 | 0.048 | 0.082 |

### Limitations
- **medical-pills is the weak spot.** Its val and test sets are tiny (23 and 12 images), and 6 val images have near-twins in train, so its val score is slightly optimistic.
- **Test is easier than validation** and is dominated by CountingPills.
- **No test set from real app conditions** (phone cameras, home lighting). Field accuracy is not yet measured.

---

## Getting Started

### 1. Prerequisites
- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- A [Roboflow](https://roboflow.com/) API key (for two of the datasets)
- A GPU for full training (or Kaggle, see above)

### 2. Install
From `ml/`:
```bash
uv sync
cp .env.example .env              # then set ROBOFLOW_API_KEY
```

### 3. Run the Pipelines
```bash
# Download (dry run first: checks sources and the API key only)
uv run python -c "from pipelines.download_pipeline import run_download; run_download(dry_run=True)"
uv run python -m pipelines.download_pipeline

# Build data/splits/
uv run python -m pipelines.data_prep_pipeline

# Train → evaluate → export, one by one ...
uv run python -m pipelines.train_pipeline
uv run python -m pipelines.evaluate_pipeline
uv run python -m pipelines.export_pipeline
# ... or all at once
uv run python -m pipelines.full_pipeline

# Promote the run id set in configs/promote.yaml
uv run python -m pipelines.promote_pipeline
```

Set `sanity_run: true` in `configs/train.yaml` for a quick check (1 epoch on 5% of the data), and use a new `run_name` for every scenario.

After promoting, also regenerate the frontend parity fixtures (`uv run python -m scripts.make_parity_fixtures` in `backend/`).

### 4. EDA
Open [`notebooks/01_exploratory_data_analysis.ipynb`](notebooks/01_exploratory_data_analysis.ipynb) and run all cells. It audits labels, image and object sizes, pill density, empty images, duplicates and leakage, and ends with the decisions used by data prep. Its index files go to `outputs/eda/`.

### 5. MLflow
```bash
uv run mlflow ui --backend-store-uri sqlite:///outputs/mlflow/mlflow.db
```
Open http://127.0.0.1:5000. One training scenario is one run, holding its parameters, training curves, val/test metrics, export results, and a `promoted` tag.

---

## Quality Assurance & Testing

```bash
# Unit tests (35 tests)
uv run python -m pytest

# Lint and format checks
uv run ruff check .
uv run ruff format --check .
```

On Windows, use `uv run python -m pytest`; plain `uv run pytest` can fail because of the uv launcher.
