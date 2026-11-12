"""Tests for the CRC plasticity analysis.

Scientific tests use a synthetic fixture whose structure is known in advance:
two patients, two regions each, with patient P2 given an elevated fetal-like
programme. Any correct implementation must recover a large between-patient
component and a near-zero regional one.
"""
import sys, gzip, json
from pathlib import Path
import numpy as np, pandas as pd, pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from crc import stats, scoring, signatures
from crc.io import DenseText, ValidationError, _check

FIX = Path(__file__).parent / "fixtures"

# ---------------------------------------------------------------- signatures
def test_signatures_have_provenance_and_genes():
    for name, spec in signatures.SIGNATURES.items():
        assert spec["genes"], f"{name} has no genes"
        assert spec["provenance"], f"{name} has no provenance"
        assert len(set(spec["genes"])) == len(spec["genes"]), f"{name} has duplicates"

def test_signature_sets_do_not_overlap():
    seen = {}
    for name, spec in signatures.SIGNATURES.items():
        for g in spec["genes"]:
            assert g not in seen, f"{g} appears in both {seen[g]} and {name}"
            seen[g] = name

# ---------------------------------------------------------------- io
def test_dense_text_round_trip():
    src = DenseText(FIX / "tiny_matrix.tsv.gz")
    cells = src.cells(); genes, means = src.gene_means()
    assert len(cells) == 200 and len(genes) == len(set(genes))
    rows = src.rows({"CLU", "LGR5"})
    assert set(rows) == {"CLU", "LGR5"}
    assert all(len(v) == len(cells) for v in rows.values())

def test_validation_flags_duplicate_genes():
    issues = _check(np.array(["A", "A", "B"]), ["c1", "c2"], "fixture")
    assert any("duplicate gene" in i for i in issues)

def test_validation_rejects_empty_matrix():
    with pytest.raises(ValidationError):
        _check(np.array([]), [], "fixture")

# ---------------------------------------------------------------- scoring
def test_control_genes_are_expression_matched_and_disjoint():
    src = DenseText(FIX / "tiny_matrix.tsv.gz")
    genes, means = src.gene_means()
    ctl = scoring.choose_controls(genes, means)
    for sig, spec in ctl.items():
        assert not set(spec["controls"]) & set(spec["present"]), f"{sig}: control overlaps signature"
        assert spec["controls"], f"{sig}: no controls drawn"

def test_scoring_is_deterministic_for_a_seed():
    src = DenseText(FIX / "tiny_matrix.tsv.gz")
    genes, means = src.gene_means(); rows = src.rows(set(genes))
    a = scoring.score_cells(rows, scoring.choose_controls(genes, means, seed=1))
    b = scoring.score_cells(rows, scoring.choose_controls(genes, means, seed=1))
    pd.testing.assert_frame_equal(a, b)

def test_missing_genes_are_reported_not_silently_dropped():
    genes = np.array(["CLU", "ANXA1", "BG001", "BG002", "BG003", "BG004"])
    means = np.array([1.0, 0.9, 0.8, 0.7, 0.6, 0.5])
    ctl = scoring.choose_controls(genes, means)
    assert "LGR5" in ctl["ISC"]["missing"]
    assert ctl["FETAL"]["present"] == ["ANXA1", "CLU"] or set(ctl["FETAL"]["present"]) == {"ANXA1", "CLU"}

# ---------------------------------------------------------------- statistics
@pytest.fixture
def fixture_samples():
    """Score the synthetic fixture and aggregate to samples, as the pipeline does."""
    src = DenseText(FIX / "tiny_matrix.tsv.gz")
    cells = src.cells(); genes, means = src.gene_means()
    ctl = scoring.choose_controls(genes, means)
    wanted = {g for s in ctl.values() for g in s["present"] + s["controls"]}
    df = scoring.score_cells(src.rows(wanted), ctl)
    df.index = pd.Index(cells, name="cell")
    ann = pd.read_csv(FIX / "tiny_annotation.tsv.gz", sep="\t").set_index("Index")
    df["Patient"] = ann.reindex(df.index).Patient.values
    df["Region"] = ann.reindex(df.index).Class.values
    g = df.groupby(["Patient", "Region"], observed=True)
    s = g[list(signatures.NAMES)].mean(); s["n_cells"] = g.size()
    return s.reset_index()

def test_fixture_recovers_the_planted_between_patient_difference(fixture_samples):
    s = fixture_samples
    w = s.pivot_table(index="Patient", columns="Region", values="FETAL")
    assert w.loc["P4"].mean() > w.loc["P1"].mean() + 0.3, "planted patient effect not recovered"
    assert list(w.mean(axis=1).sort_values().index) == ["P1", "P2", "P3", "P4"], "patient ordering not recovered"

def test_fixture_has_no_regional_effect(fixture_samples):
    r = stats.paired_contrast(fixture_samples, "FETAL", "Tumor", "Border")
    assert abs(r["mean"]) < 0.2, "regional difference found where none was planted"

def test_icc_is_high_when_variation_is_between_patients(fixture_samples):
    r = stats.icc(fixture_samples, "FETAL")
    assert r["icc"] > 0.8, f"expected a high ICC, got {r['icc']}"
    assert "var_within_patient" in r and "converged" in r

def test_paired_contrast_permutation_is_exact_for_small_n():
    s = pd.DataFrame({"Patient": list("ABCDE") * 2,
                      "Region": ["Tumor"] * 5 + ["Border"] * 5,
                      "X": [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]})
    r = stats.paired_contrast(s, "X", "Tumor", "Border")
    assert r["exact"] is True
    assert r["mean"] == pytest.approx(0.0)
    assert r["p_exact"] == pytest.approx(1.0)

def test_paired_contrast_detects_a_consistent_shift():
    s = pd.DataFrame({"Patient": list("ABCDEF") * 2,
                      "Region": ["Tumor"] * 6 + ["Border"] * 6,
                      "X": [2, 3, 4, 5, 6, 7] + [1, 2, 3, 4, 5, 6]})
    r = stats.paired_contrast(s, "X", "Tumor", "Border")
    assert r["mean"] == pytest.approx(1.0)
    assert r["p_exact"] < 0.05, "a perfectly consistent shift should be significant at n=6"
    assert r["n_positive"] == 6

def test_between_patient_reference_is_mean_pairwise_difference():
    s = pd.DataFrame({"Patient": ["A", "B", "C"], "X": [0.0, 1.0, 2.0]})
    # |0-1| + |0-2| + |1-2| = 4, over 3 pairs
    assert stats.between_patient_reference(s, "X") == pytest.approx(4 / 3)

def test_leave_one_patient_out_drops_each_patient_once(fixture_samples):
    lopo = stats.leave_one_patient_out(fixture_samples, "FETAL")
    assert set(lopo.dropped) == set(fixture_samples.Patient.unique())

# ---------------------------------------------------------------- reporting
def test_published_numbers_match_the_generated_statistics():
    """The README must not drift from results/tables/statistics.json."""
    stats_path = ROOT / "results" / "tables" / "statistics.json"
    readme = ROOT / "README.md"
    if not stats_path.exists() or not readme.exists():
        pytest.skip("results not generated in this environment")
    S = json.loads(stats_path.read_text()); text = readme.read_text()
    icc = S["variance"]["FETAL"]["icc"]
    assert f"{icc:.3f}" in text or f"{icc:.2f}" in text, \
        f"README does not quote the generated FETAL ICC ({icc:.3f})"
