"""Tests for project 2. Scientific tests use synthetic data with a planted confound."""
import sys
from pathlib import Path
import numpy as np, pandas as pd, pytest, statsmodels.formula.api as smf
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from crcd.signatures import ALL, PROGRAMME_NAMES, COMPOSITION_NAMES
from crcd.io import is_tumour, patient_of

def test_no_gene_appears_in_two_sets():
    seen = {}
    for name, spec in ALL.items():
        for g in spec["genes"]:
            assert g not in seen, f"{g} in both {seen[g]} and {name}"
            seen[g] = name

def test_composition_panels_declare_they_are_not_estimate():
    for name in COMPOSITION_NAMES:
        p = ALL[name]["provenance"].lower()
        assert "compact" in p or "canonical" in p, f"{name} provenance is not explicit"

def test_tcga_barcode_parsing():
    assert is_tumour("TCGA-AA-3492-01A") is True
    assert is_tumour("TCGA-AA-3492-11A") is False
    assert patient_of("TCGA-AA-3492-01A") == "TCGA-AA-3492"

def test_residualising_removes_a_planted_confound():
    """A score built purely from composition must have no signal left after adjustment."""
    rng = np.random.default_rng(0)
    n = 300
    stroma = rng.normal(size=n)
    df = pd.DataFrame({"STROMA": stroma, "IMMUNE": rng.normal(size=n),
                       "EPITHELIUM": rng.normal(size=n)})
    df["outcome"] = stroma + rng.normal(scale=.2, size=n)
    df["FETAL"] = stroma * 2 + rng.normal(scale=.1, size=n)   # pure composition
    raw = smf.ols("outcome ~ FETAL", df).fit()
    df["FETAL_adj"] = smf.ols("FETAL ~ STROMA + IMMUNE + EPITHELIUM", df).fit().resid
    adj = smf.ols("outcome ~ FETAL_adj", df).fit()
    assert raw.pvalues["FETAL"] < 1e-10, "planted confounded association not detected"
    assert adj.pvalues["FETAL_adj"] > 0.05, "adjustment failed to remove a pure confound"

def test_adjustment_preserves_genuine_signal():
    """A score independent of composition must survive adjustment."""
    rng = np.random.default_rng(1)
    n = 300
    df = pd.DataFrame({c: rng.normal(size=n) for c in COMPOSITION_NAMES})
    true = rng.normal(size=n)
    df["FETAL"] = true + df["STROMA"] * .3
    df["outcome"] = true + rng.normal(scale=.3, size=n)
    df["FETAL_adj"] = smf.ols("FETAL ~ STROMA + IMMUNE + EPITHELIUM", df).fit().resid
    assert smf.ols("outcome ~ FETAL_adj", df).fit().pvalues["FETAL_adj"] < 1e-10


# --- the sensitivity analysis -------------------------------------------------

FLAGGED = ["SPP1", "S100A4", "LGALS3", "CD44", "TIMP1"]

def test_sensitivity_variants_are_subsets_of_the_published_list():
    """The variants must be drawn from FETAL, never a different list quietly swapped in."""
    src = (ROOT / "scripts" / "run_sensitivity.py").read_text()
    assert "FLAGGED = " in src
    fetal = set(ALL["FETAL"]["genes"])
    assert set(FLAGGED) <= fetal, "a flagged gene is not in FETAL"
    # the stated revival subset, parsed from the script so it cannot drift silently
    revival = set(eval(src.split("REVIVAL = ")[1].split("\n")[0]))
    assert revival <= fetal, "the revival subset contains a gene outside FETAL"
    assert revival.isdisjoint(FLAGGED), "revival subset overlaps the flagged genes"

class _FakeExpr:
    """Minimal stand-in for BulkExpression: genes are symbols, two samples."""
    normalisation = "synthetic"
    def __init__(self, genes, values):
        self._g, self._v = np.array(genes), values
    def samples(self): return ["TCGA-XX-0001-01A", "TCGA-XX-0002-01A"]
    def gene_means(self): return self._g, np.array([self._v[g].mean() for g in self._g])
    def rows(self, wanted): return {g: self._v[g] for g in self._g if g in wanted}

def test_score_sets_subtracts_expression_matched_controls(monkeypatch):
    """A set whose genes sit at the same level as their controls must score near zero."""
    from crcd import pipeline
    monkeypatch.setattr(pipeline, "_ensembl_map", lambda syms: {s: s for s in syms})
    rng = np.random.default_rng(0)
    sig = ["G1", "G2", "G3"]
    bg = [f"B{i}" for i in range(200)]
    vals = {g: np.array([5.0, 5.0]) + rng.normal(scale=1e-6, size=2) for g in sig + bg}
    df, prov = pipeline.score_sets(_FakeExpr(sig + bg, vals), {"S": dict(genes=sig)})
    assert prov["S"]["n_present"] == 3
    assert prov["S"]["n_controls"] > 0
    assert np.allclose(df["S"].to_numpy(), 0, atol=1e-4), "flat expression should score ~0"

def test_score_sets_detects_a_raised_signature(monkeypatch):
    from crcd import pipeline
    monkeypatch.setattr(pipeline, "_ensembl_map", lambda syms: {s: s for s in syms})
    rng = np.random.default_rng(1)
    sig = ["G1", "G2", "G3"]
    bg = [f"B{i}" for i in range(200)]
    vals = {g: np.array([5.0, 5.0]) + rng.normal(scale=1e-3, size=2) for g in bg}
    for g in sig:                       # raised in the second sample only
        vals[g] = np.array([5.0, 7.0])
    df, _ = pipeline.score_sets(_FakeExpr(sig + bg, vals), {"S": dict(genes=sig)})
    s = df["S"].to_numpy()
    assert s[1] - s[0] > 1.5, "a planted 2-unit shift was not recovered"
