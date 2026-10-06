"""
Decide the final train / val / test split of every image.

Rules (docs/dataset.md):
- CountingPills: keep the original folder split.
- Pill Detection: only has train -> split 8:1:1 per pill-combination code,
  so photos of the same pill combination never end up in different splits.
- medical-pills: keep train and val; move about 10% of all images from train
  to test, one near-duplicate frame group at a time.
"""

import random

import pandas as pd

COUNTING_PILLS = "CountingPills"
PILL_DETECTION = "Pill Detection"
MEDICAL_PILLS = "medical-pills"


def round_half_up(value: float) -> int:
    """Round to the nearest whole number, with .5 always rounded up."""

    return int(value + 0.5)


def get_pill_code(file_name: str) -> str:
    """Return the pill-combination code of a Pill Detection file.

    Example: "K-001900-010224_0_2_0_2_70_000_200_png.rf.abc.jpg" -> "K-001900-010224"
    """

    return file_name.split("_")[0]


def split_by_group(
    groups: list[str], ratio: tuple[int, int, int], seed: int
) -> dict[str, str]:
    """Shuffle the unique groups and divide them by the train:val:test ratio.

    Returns a mapping group -> split.
    """

    unique_groups = sorted(set(groups))
    random.Random(seed).shuffle(unique_groups)

    ratio_total = sum(ratio)
    n_groups = len(unique_groups)
    n_val = round_half_up(n_groups * ratio[1] / ratio_total)
    n_test = round_half_up(n_groups * ratio[2] / ratio_total)

    split_of_group: dict[str, str] = {}
    for position, group in enumerate(unique_groups):
        if position < n_test:
            split_of_group[group] = "test"
        elif position < n_test + n_val:
            split_of_group[group] = "val"
        else:
            split_of_group[group] = "train"

    return split_of_group


def build_frame_groups(
    paths: list[str], pairs: list[tuple[str, str]]
) -> dict[str, str]:
    """Join images that are linked by a duplicate pair into one group.

    If A~B and B~C, then A, B and C form one group. An image without any pair
    is a group on its own. The group name is the first path of the group
    (alphabetical), so the result is always the same.

    Returns a mapping path -> group name.
    """

    # Neighbours of every image
    neighbours: dict[str, set[str]] = {}
    for path in paths:
        neighbours[path] = set()
    for path_a, path_b in pairs:
        neighbours[path_a].add(path_b)
        neighbours[path_b].add(path_a)

    # Walk through linked images to collect each group
    group_of: dict[str, str] = {}
    for start in sorted(paths):
        if start in group_of:
            continue

        members = []
        to_visit = [start]
        while len(to_visit) > 0:
            path = to_visit.pop()
            if path in members:
                continue
            members.append(path)
            for neighbour in neighbours[path]:
                to_visit.append(neighbour)

        group_name = sorted(members)[0]
        for path in members:
            group_of[path] = group_name

    return group_of


def pick_test_groups(
    group_of: dict[str, str],
    split_of: dict[str, str],
    n_target: int,
    seed: int,
) -> set[str]:
    """Pick random train-only groups until they hold at least n_target images.

    Groups that contain any non-train image are never picked, so a frame that
    is similar to a val image cannot end up in test.
    """

    # Images per group, and whether the group is train-only
    images_in_group: dict[str, int] = {}
    train_only: dict[str, bool] = {}
    for path, group in group_of.items():
        images_in_group[group] = images_in_group.get(group, 0) + 1
        is_train = split_of[path] == "train"
        train_only[group] = train_only.get(group, True) and is_train

    candidates = []
    for group in sorted(images_in_group):
        if train_only[group]:
            candidates.append(group)
    random.Random(seed).shuffle(candidates)

    test_groups: set[str] = set()
    n_picked = 0
    for group in candidates:
        if n_picked >= n_target:
            break
        test_groups.add(group)
        n_picked += images_in_group[group]

    return test_groups


def split_counting_pills(df: pd.DataFrame) -> pd.DataFrame:
    """CountingPills: keep the original split, no group."""

    result = df.copy()
    result["split"] = result["orig_split"]
    result["group"] = ""
    return result


def split_pill_detection(
    df: pd.DataFrame, ratio: tuple[int, int, int], seed: int
) -> pd.DataFrame:
    """Pill Detection: split 8:1:1 per pill-combination code."""

    result = df.copy()
    codes = []
    for file_name in result["file"]:
        codes.append(get_pill_code(file_name))
    result["group"] = codes

    split_of_code = split_by_group(codes, ratio, seed)

    splits = []
    for code in codes:
        splits.append(split_of_code[code])
    result["split"] = splits
    return result


def split_medical_pills(
    df: pd.DataFrame, df_pairs: pd.DataFrame, test_fraction: float, seed: int
) -> pd.DataFrame:
    """medical-pills: keep train/val, move whole frame groups from train to test."""

    result = df.copy()
    paths = list(result["path"])

    pairs = []
    pairs_of_dataset = df_pairs[df_pairs["dataset"] == MEDICAL_PILLS]
    for path_a, path_b in zip(
        pairs_of_dataset["path_a"], pairs_of_dataset["path_b"], strict=True
    ):
        pairs.append((path_a, path_b))

    group_of = build_frame_groups(paths, pairs)

    split_of = {}
    for path, orig_split in zip(paths, result["orig_split"], strict=True):
        split_of[path] = orig_split

    n_target = round_half_up(len(paths) * test_fraction)
    test_groups = pick_test_groups(group_of, split_of, n_target, seed)

    groups = []
    splits = []
    for path in paths:
        group = group_of[path]
        groups.append(group)
        if group in test_groups:
            splits.append("test")
        else:
            splits.append(split_of[path])

    result["group"] = groups
    result["split"] = splits
    return result


def assign_splits(
    df_img: pd.DataFrame,
    df_pairs: pd.DataFrame,
    split_ratio: tuple[int, int, int],
    test_fraction: float,
    seed: int,
) -> pd.DataFrame:
    """Return one row per image with its original and final split.

    Columns: dataset, path, file, n_object, orig_split, split, group.
    """

    df = df_img[["dataset", "path", "file", "n_object"]].copy()
    df["orig_split"] = df_img["split"].astype(str)

    known = [COUNTING_PILLS, PILL_DETECTION, MEDICAL_PILLS]
    for name in df["dataset"].unique():
        if name not in known:
            raise ValueError(f"No split rule for dataset: {name}")

    counting = split_counting_pills(df[df["dataset"] == COUNTING_PILLS])
    detection = split_pill_detection(
        df[df["dataset"] == PILL_DETECTION], split_ratio, seed
    )
    medical = split_medical_pills(
        df[df["dataset"] == MEDICAL_PILLS], df_pairs, test_fraction, seed
    )

    return pd.concat([counting, detection, medical], ignore_index=True)
