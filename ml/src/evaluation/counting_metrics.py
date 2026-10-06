"""
Counting metrics: compare the predicted pill count with the true count.

For every image: error = |predicted count - true count|.
"""


def get_errors(pred_counts: list[int], true_counts: list[int]) -> list[int]:
    """Return the absolute count error of every image."""

    if len(pred_counts) != len(true_counts):
        raise ValueError("pred_counts and true_counts must have the same length")
    if len(pred_counts) == 0:
        raise ValueError("At least one image is needed")

    errors = []
    for pred, true in zip(pred_counts, true_counts, strict=True):
        errors.append(abs(pred - true))
    return errors


def mean_absolute_error(pred_counts: list[int], true_counts: list[int]) -> float:
    """Average count error (in pills). Lower is better."""

    errors = get_errors(pred_counts, true_counts)
    return sum(errors) / len(errors)


def exact_match_rate(pred_counts: list[int], true_counts: list[int]) -> float:
    """Share of images (0..1) whose count is exactly right."""

    errors = get_errors(pred_counts, true_counts)
    n_exact = 0
    for error in errors:
        if error == 0:
            n_exact += 1
    return n_exact / len(errors)


def within_one_rate(pred_counts: list[int], true_counts: list[int]) -> float:
    """Share of images (0..1) whose count is off by at most 1 pill."""

    errors = get_errors(pred_counts, true_counts)
    n_close = 0
    for error in errors:
        if error <= 1:
            n_close += 1
    return n_close / len(errors)


def counting_metrics(
    pred_counts: list[int], true_counts: list[int]
) -> dict[str, float]:
    """Return all counting metrics in one dictionary."""

    return {
        "mae": mean_absolute_error(pred_counts, true_counts),
        "exact_match": exact_match_rate(pred_counts, true_counts),
        "within_1": within_one_rate(pred_counts, true_counts),
    }
