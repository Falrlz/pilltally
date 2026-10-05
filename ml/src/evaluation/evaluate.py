"""
Evaluation helpers: predicted counts, confidence threshold and detection metrics.

Counting idea: the model gives every box a confidence score. The predicted
pill count of an image is the number of boxes with a score >= threshold.
The model is run once at the lowest threshold; higher thresholds are then
tried by filtering those scores, without running the model again.
"""

from pathlib import Path

import pandas as pd
from ultralytics import YOLO

from src.evaluation.counting_metrics import counting_metrics, mean_absolute_error


def predict_confidences(
    model: YOLO, image_paths: list[Path], imgsz: int, min_conf: float
) -> dict[str, list[float]]:
    """Run the model once and return the box scores per image file name."""

    sources = []
    for path in image_paths:
        sources.append(str(path))

    confidences: dict[str, list[float]] = {}
    results = model.predict(
        source=sources, imgsz=imgsz, conf=min_conf, stream=True, verbose=False
    )
    for result in results:
        file_name = Path(result.path).name
        confidences[file_name] = result.boxes.conf.tolist()

    return confidences


def count_boxes(scores: list[float], threshold: float) -> int:
    """Number of boxes with a score >= threshold."""

    count = 0
    for score in scores:
        if score >= threshold:
            count += 1
    return count


def predicted_counts(
    confidences: dict[str, list[float]], files: list[str], threshold: float
) -> list[int]:
    """Predicted count of every file (same order as files)."""

    counts = []
    for file_name in files:
        counts.append(count_boxes(confidences[file_name], threshold))
    return counts


def select_conf_threshold(
    confidences: dict[str, list[float]],
    files: list[str],
    true_counts: list[int],
    conf_grid: list[float],
) -> tuple[float, pd.DataFrame]:
    """Try every threshold and return the one with the lowest MAE.

    Also returns a table with the MAE of every threshold. On a tie the
    lower threshold wins.
    """

    rows = []
    best_threshold = None
    best_mae = None
    for threshold in sorted(conf_grid):
        pred_counts = predicted_counts(confidences, files, threshold)
        mae = mean_absolute_error(pred_counts, true_counts)
        rows.append({"threshold": threshold, "mae": mae})

        if best_mae is None or mae < best_mae:
            best_mae = mae
            best_threshold = threshold

    return best_threshold, pd.DataFrame(rows)


def build_count_table(
    split_rows: pd.DataFrame, confidences: dict[str, list[float]], threshold: float
) -> pd.DataFrame:
    """One row per image: file, dataset, true count, predicted count, error."""

    files = list(split_rows["new_file"])
    true_counts = list(split_rows["n_object"])
    pred_counts = predicted_counts(confidences, files, threshold)

    errors = []
    for pred, true in zip(pred_counts, true_counts, strict=True):
        errors.append(abs(pred - true))

    return pd.DataFrame(
        {
            "file": files,
            "dataset": list(split_rows["dataset"]),
            "true": true_counts,
            "pred": pred_counts,
            "error": errors,
        }
    )


def get_dataset_key(file_name: str) -> str:
    """Short dataset key from the file prefix: 'cp_a.jpg' -> 'cp'."""

    return file_name.split("_")[0]


def summarize_counts(count_table: pd.DataFrame) -> dict[str, float]:
    """Counting metrics for all images and for every dataset separately.

    Keys: mae, exact_match, within_1, then cp_mae, cp_exact_match, ...
    """

    summary = counting_metrics(list(count_table["pred"]), list(count_table["true"]))

    keys = []
    for file_name in count_table["file"]:
        keys.append(get_dataset_key(file_name))
    with_keys = count_table.assign(key=keys)

    for key, rows in with_keys.groupby("key"):
        metrics = counting_metrics(list(rows["pred"]), list(rows["true"]))
        for name, value in metrics.items():
            summary[f"{key}_{name}"] = value

    return summary


def detection_metrics(
    model: YOLO, data_yaml: Path, split: str, imgsz: int, save_dir: Path
) -> dict[str, float]:
    """Precision, recall, F1, mAP50 and mAP50-95 from Ultralytics validation.

    Ultralytics also saves its plots (confusion matrix, PR / F1 / P / R curves)
    to save_dir.
    """

    metrics = model.val(
        data=str(data_yaml),
        split=split,
        imgsz=imgsz,
        project=str(save_dir.parent),
        name=save_dir.name,
        exist_ok=True,
        plots=True,
        verbose=False,
    )

    precision = float(metrics.box.mp)
    recall = float(metrics.box.mr)
    f1 = 0.0
    if precision + recall > 0:
        f1 = 2 * precision * recall / (precision + recall)

    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "mAP50": float(metrics.box.map50),
        "mAP50-95": float(metrics.box.map),
    }


def save_error_examples(
    model: YOLO,
    count_table: pd.DataFrame,
    images_dir: Path,
    threshold: float,
    imgsz: int,
    n_examples: int,
    out_dir: Path,
) -> None:
    """Save the images with the largest count error, with predicted boxes drawn."""

    out_dir.mkdir(parents=True, exist_ok=True)
    worst = count_table.sort_values("error", ascending=False).head(n_examples)

    for file_name, true, pred in zip(
        worst["file"], worst["true"], worst["pred"], strict=True
    ):
        result = model.predict(
            source=str(images_dir / file_name),
            imgsz=imgsz,
            conf=threshold,
            verbose=False,
        )[0]
        out_name = f"true{true}_pred{pred}_{file_name}"
        result.save(filename=str(out_dir / out_name))
