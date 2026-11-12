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
