#!/usr/bin/env python3
"""Is the composition result a property of bulk tissue, or of the gene list?

The fetal-like signature contains five genes that are substantially expressed by
stromal and myeloid cells (SPP1, S100A4, LGALS3, CD44, TIMP1). If the headline
"composition explains 47% of the fetal-like score" is driven by those five, the
result says something about my signature rather than about bulk tissue.

This re-scores four variants of the list through exactly the same code and reports
the composition R-squared and the stage association for each, in both cohorts.

PRE-SPECIFICATION. The five flagged genes were named on cell-type-expression grounds
in ../crc-plasticity/REVIEW-REQUEST.md, committed before this script existed, so the
"minus flagged" and "flagged alone" variants were fixed before any result here was
seen. The five-gene revival subset was defined in this script, in the same commit as
its results, on the stated criterion "canonical revival markers" -- it is a literature
criterion, not a pre-registered one, and should be read as the weaker of the two.

MULTIPLICITY. The stage p-values below are raw. The headline association (full list)
was already Benjamini-Hochberg corrected across the 20 tests in run_analysis.py; these
are sensitivity re-tests of that same association under alternative definitions, not
new hypotheses. BH across the eight stage tests here is reported alongside, but the
variants correlate 0.78-0.95 with each other, so they are not independent tests and
neither correction is the right one. Read the direction and the effect size, not the
stars.

The spread across variants is a RANGE OF COMPOSITION-ASSOCIATED VARIANCE ACROSS
SIGNATURE DEFINITIONS. It is not a confidence interval and carries no coverage
guarantee.
"""
import sys, json
from pathlib import Path
import pandas as pd, statsmodels.formula.api as smf
from scipy.stats import spearmanr
from statsmodels.stats.multitest import multipletests
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crcd import config, io as cio
from crcd.pipeline import score_sets
from crcd.signatures import PROGRAMME, COMPOSITION

FLAGGED = ["SPP1", "S100A4", "LGALS3", "CD44", "TIMP1"]
FETAL = PROGRAMME["FETAL"]["genes"]
REVIVAL = ["ANXA1", "ANXA3", "CLU", "TACSTD2", "EMP1"]

VARIANTS = {
    "FETAL_full":      dict(genes=FETAL, label="As published here (15 genes)"),
    "FETAL_no_flagged": dict(genes=[g for g in FETAL if g not in FLAGGED],
                             label="Five stroma/myeloid-expressed genes removed (10)"),
    "FETAL_revival":   dict(genes=REVIVAL, label="Canonical revival markers only (5)"),
    "FETAL_flagged":   dict(genes=FLAGGED, label="The five flagged genes alone (5)"),
}
STAGE = {"I": 1, "II": 2, "III": 3, "IV": 4}

out = {"flagged": FLAGGED, "variants": {k: v["label"] for k, v in VARIANTS.items()}, "cohorts": {}}

for cohort in ("COAD", "READ"):
    expr = cio.BulkExpression(cohort)
    scores, prov = score_sets(expr, {**VARIANTS, **COMPOSITION})
    scores["tumour"] = [cio.is_tumour(s) for s in scores.index]
    scores = scores.join(cio.clinical(cohort), how="left")
    tum = scores[scores.tumour].copy()

    res = {}
    for name in VARIANTS:
        m = smf.ols(f"{name} ~ STROMA + IMMUNE + EPITHELIUM", tum).fit()
        tum[f"{name}_adj"] = m.resid
        rho_s, p_s = spearmanr(tum[name], tum.STROMA)
        d = tum[tum.stage.isin(STAGE)].dropna(subset=["stage"])
        y = d.stage.map(STAGE)
        r_u, pu = spearmanr(d[name], y)
        r_a, pa = spearmanr(d[f"{name}_adj"], y)
        r_full, _ = spearmanr(tum[name], tum["FETAL_full"])
        res[name] = dict(genes=VARIANTS[name]["genes"],
                         n_genes=prov[name]["n_present"],
                         n_tumours=int(len(tum)),
                         r2_composition=float(m.rsquared),
                         rho_stroma=float(rho_s), p_stroma=float(p_s),
                         stage_rho=float(r_u), stage_p=float(pu),
                         stage_rho_adj=float(r_a), stage_p_adj=float(pa),
                         n_stage=int(len(d)), rho_with_full=float(r_full),
                         stage_test="Spearman rho, stage I-IV coded 1-4, "
                                    "score residualised on STROMA+IMMUNE+EPITHELIUM",
                         prespecified=name in ("FETAL_full", "FETAL_no_flagged", "FETAL_flagged"))
    out["cohorts"][cohort] = res

    print(f"\n=== TCGA-{cohort}: {len(tum)} tumours ===")
    print(f"{'variant':20} {'n':>3} {'R2 comp':>8} {'rho stroma':>11} "
          f"{'stage rho':>10} {'adj':>8} {'adj p':>8} {'r w/ full':>10}")
    for name, v in res.items():
        print(f"{name:20} {v['n_genes']:3} {v['r2_composition']:8.3f} {v['rho_stroma']:+11.3f} "
              f"{v['stage_rho']:+10.3f} {v['stage_rho_adj']:+8.3f} {v['stage_p_adj']:8.4f} "
              f"{v['rho_with_full']:+10.3f}")

# Benjamini-Hochberg across the eight adjusted stage tests, reported but not relied on:
# the variants are 0.78-0.95 correlated, so they are not independent tests.
keys = [(c, v) for c in out["cohorts"] for v in VARIANTS]
raw = [out["cohorts"][c][v]["stage_p_adj"] for c, v in keys]
_, q, _, _ = multipletests(raw, method="fdr_bh")
for (c, v), qv in zip(keys, q):
    out["cohorts"][c][v]["stage_q_adj_within_sensitivity"] = float(qv)
out["multiplicity"] = (
    "stage_p_adj is raw. stage_q_adj_within_sensitivity applies Benjamini-Hochberg across "
    "the eight adjusted stage tests in this script only. The headline association was "
    "separately BH-corrected across the 20 tests in run_analysis.py. The variants are "
    "0.78-0.95 correlated, so neither correction is the correct one; both are shown.")
out["range_is_not_a_confidence_interval"] = (
    "The spread in r2_composition is a range of composition-associated variance across "
    "signature definitions. It has no coverage interpretation.")

print("\nBH across the eight adjusted stage tests in this script:")
for c, v in keys:
    r = out["cohorts"][c][v]
    print(f"  {c} {v:20} rho={r['stage_rho_adj']:+.3f} n={r['n_stage']:3} "
          f"p={r['stage_p_adj']:.4f} q={r['stage_q_adj_within_sensitivity']:.4f}"
          f"{'' if r['prespecified'] else '   (not pre-specified)'}")

config.ensure_dirs()
(config.TABLES / "sensitivity.json").write_text(json.dumps(out, indent=2))
print(f"\nwrote {config.TABLES / 'sensitivity.json'}")
