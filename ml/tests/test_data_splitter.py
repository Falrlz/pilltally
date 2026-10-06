"""
Tests for src/data/data_splitter.py (small hand-made data, no real dataset).
"""

import pandas as pd

from src.data.data_splitter import (
    assign_splits,
    build_frame_groups,
    get_pill_code,
    pick_test_groups,
    round_half_up,
    split_by_group,
)


def test_round_half_up():
    """0.5 is always rounded up."""
    assert round_half_up(11.5) == 12
    assert round_half_up(12.5) == 13
    assert round_half_up(12.4) == 12


def test_get_pill_code():
    """The code is the part before the first underscore."""
    file_name = "K-001900-010224-016551-031705_0_2_0_2_70_000_200_png.rf.d6.jpg"
    assert get_pill_code(file_name) == "K-001900-010224-016551-031705"


def test_split_by_group_ratio():
    """20 groups at 8:1:1 -> 16 train, 2 val, 2 test."""
    groups = []
    for number in range(20):
        groups.append(f"group_{number}")

    split_of_group = split_by_group(groups, (8, 1, 1), seed=42)

    counts = {"train": 0, "val": 0, "test": 0}
    for split in split_of_group.values():
        counts[split] += 1
    assert counts == {"train": 16, "val": 2, "test": 2}


def test_split_by_group_same_seed_same_result():
    """The same seed always gives the same split."""
    groups = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
    first = split_by_group(groups, (8, 1, 1), seed=7)
    second = split_by_group(groups, (8, 1, 1), seed=7)
    assert first == second


def test_build_frame_groups_joins_chains():
    """A~B and B~C put A, B and C in one group; D stays alone."""
    paths = ["a.jpg", "b.jpg", "c.jpg", "d.jpg"]
    pairs = [("a.jpg", "b.jpg"), ("b.jpg", "c.jpg")]

    group_of = build_frame_groups(paths, pairs)

    assert group_of["a.jpg"] == group_of["b.jpg"] == group_of["c.jpg"]
    assert group_of["d.jpg"] != group_of["a.jpg"]


def test_pick_test_groups_skips_groups_with_val():
    """A group that contains a val image is never moved to test."""
    group_of = {"a.jpg": "g1", "b.jpg": "g1", "c.jpg": "g2", "d.jpg": "g3"}
    split_of = {"a.jpg": "train", "b.jpg": "val", "c.jpg": "train", "d.jpg": "train"}

    test_groups = pick_test_groups(group_of, split_of, n_target=10, seed=42)

    assert "g1" not in test_groups
    assert test_groups == {"g2", "g3"}


def make_image_index() -> pd.DataFrame:
    """Small image index with all three datasets."""
    rows = []
    # CountingPills: original splits
    rows.append(["CountingPills", "train", "cp_a.jpg"])
    rows.append(["CountingPills", "val", "cp_b.jpg"])
    rows.append(["CountingPills", "test", "cp_c.jpg"])
    # Pill Detection: 10 codes x 3 photos, train only
    for code_number in range(10):
        for photo_number in range(3):
            file_name = f"K-{code_number:03d}_{photo_number}_png.rf.x.jpg"
            rows.append(["Pill Detection", "train", file_name])
    # medical-pills: 9 train + 1 val
    for frame_number in range(9):
        rows.append(["medical-pills", "train", f"Frame_{frame_number}.jpg"])
    rows.append(["medical-pills", "val", "Frame_99.jpg"])

    df = pd.DataFrame(rows, columns=["dataset", "split", "file"])
    df["path"] = df["dataset"] + "/" + df["split"] + "/" + df["file"]
    df["n_object"] = 1
    return df


def test_assign_splits_keeps_pill_codes_together():
    """Photos of one pill code never end up in two splits."""
    df_img = make_image_index()
    df_pairs = pd.DataFrame(columns=["path_a", "path_b", "dataset"])

    result = assign_splits(df_img, df_pairs, (8, 1, 1), test_fraction=0.1, seed=42)

    detection = result[result["dataset"] == "Pill Detection"]
    for code in detection["group"].unique():
        splits_of_code = detection[detection["group"] == code]["split"].unique()
        assert len(splits_of_code) == 1


def test_assign_splits_keeps_counting_pills_split():
    """CountingPills keeps its original split."""
    df_img = make_image_index()
    df_pairs = pd.DataFrame(columns=["path_a", "path_b", "dataset"])

    result = assign_splits(df_img, df_pairs, (8, 1, 1), test_fraction=0.1, seed=42)

    counting = result[result["dataset"] == "CountingPills"]
    assert list(counting["split"]) == list(counting["orig_split"])


def test_assign_splits_medical_pills_test_from_train_only():
    """medical-pills test images come from train; val stays val."""
    df_img = make_image_index()
    df_pairs = pd.DataFrame(columns=["path_a", "path_b", "dataset"])

    result = assign_splits(df_img, df_pairs, (8, 1, 1), test_fraction=0.1, seed=42)

    medical = result[result["dataset"] == "medical-pills"]
    test_rows = medical[medical["split"] == "test"]
    assert len(test_rows) == 1
    assert set(test_rows["orig_split"]) == {"train"}
    assert list(medical[medical["orig_split"] == "val"]["split"]) == ["val"]
