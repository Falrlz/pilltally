"""
Train a YOLO model with Ultralytics.
"""

from pathlib import Path

import yaml
from ultralytics import YOLO

from src.utils.config import TrainConfig

# Sanity run: a quick check that the whole training setup works
SANITY_EPOCHS = 1
SANITY_FRACTION = 0.05


def train_yolo(
    config: TrainConfig, data_yaml: Path, runs_dir: Path, pretrained_dir: Path
) -> Path:
    """Train the model and return the path of best.pt.

    Results are saved to runs_dir/<run_name>/. The pretrained weights are
    downloaded to pretrained_dir/ the first time.
    """

    pretrained_dir.mkdir(parents=True, exist_ok=True)
    model = YOLO(str(pretrained_dir / config.model))

    epochs = config.epochs
    fraction = 1.0
    if config.sanity_run:
        epochs = SANITY_EPOCHS
        fraction = SANITY_FRACTION

    model.train(
        data=str(data_yaml),
        epochs=epochs,
        patience=config.patience,
        freeze=config.freeze,
        fraction=fraction,
        imgsz=config.imgsz,
        batch=config.batch,
        seed=config.seed,
        deterministic=config.deterministic,
        device=config.device,
        project=str(runs_dir),
        name=config.run_name,
        exist_ok=False,
    )

    return Path(model.trainer.best)


def get_best_weights(run_dir: Path) -> Path:
    """Return outputs/runs/<run_name>/weights/best.pt."""

    best_path = run_dir / "weights" / "best.pt"
    if not best_path.exists():
        raise FileNotFoundError(f"best.pt not found: {best_path}")
    return best_path


def load_train_args(run_dir: Path) -> dict:
    """Read args.yaml, the training settings Ultralytics saved for this run."""

    with (run_dir / "args.yaml").open(encoding="utf-8") as file:
        return yaml.safe_load(file)
