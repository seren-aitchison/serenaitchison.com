#!/usr/bin/env python3
"""External validation in TCGA-READ: do the two surviving associations replicate?

READ is a separate TCGA project, scored independently with the same pipeline. The
associations were identified in COAD, so READ is a genuine held-out test rather than
a second look at the same data.
"""
import sys, json
from pathlib import Path
import numpy as np, pandas as pd, statsmodels.formula.api as smf
from scipy.stats import spearmanr, mannwhitneyu
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crcd import config
from crcd.signatures import PROGRAMME_NAMES, COMPOSITION_NAMES

T = config.TABLES
out = {}
for cohort in ["COAD", "READ"]:
    d = pd.read_csv(T / f"{cohort}_scores.csv", index_col=0)
    t = d[d.tumour].copy()
    for s in PROGRAMME_NAMES:
        t[f"{s}_adj"] = smf.ols(f"{s} ~ STROMA + IMMUNE + EPITHELIUM", t).fit().resid
    comp_r2 = {s: float(smf.ols(f"{s} ~ STROMA + IMMUNE + EPITHELIUM", t).fit().rsquared)
               for s in PROGRAMME_NAMES}

    res = dict(n_tumour=int(len(t)), composition_r2=comp_r2)
    order = {"I": 1, "II": 2, "III": 3, "IV": 4}
    st = t[t.stage.isin(order)]
    for suffix in ["", "_adj"]:
        r, p = spearmanr(st[f"FETAL{suffix}"], st.stage.map(order))
        res[f"stage{suffix or '_raw'}"] = dict(rho=float(r), p=float(p), n=int(len(st)))
    hm = t.dropna(subset=["hypermutated"])
    for suffix in ["", "_adj"]:
        g = [x[f"FETAL{suffix}"].values for _, x in hm.groupby("hypermutated")]
        if len(g) == 2:
            u, p = mannwhitneyu(*g)
            res[f"hypermutated{suffix or '_raw'}"] = dict(
                delta=float(np.median(g[1]) - np.median(g[0])), p=float(p), n=int(len(hm)),
                n_hyper=int(hm.hypermutated.sum()))
    out[cohort] = res

print(f"{'':22}  {'COAD':>22}  {'READ':>22}")
print(f"{'tumour samples':22}  {out['COAD']['n_tumour']:>22}  {out['READ']['n_tumour']:>22}")
print("\nVariance explained by composition (R²):")
for s in PROGRAMME_NAMES:
    print(f"  {s:20}  {out['COAD']['composition_r2'][s]:>22.3f}  {out['READ']['composition_r2'][s]:>22.3f}")
print("\nFETAL vs stage:")
for k, lab in [("stage_raw", "unadjusted"), ("stage_adj", "composition-adjusted")]:
    c, r = out["COAD"][k], out["READ"][k]
    print(f"  {lab:20}  rho={c['rho']:+.3f} p={c['p']:.1e} (n={c['n']})   "
          f"rho={r['rho']:+.3f} p={r['p']:.3f} (n={r['n']})")
print("\nFETAL in hypermutated tumours:")
for k, lab in [("hypermutated_raw", "unadjusted"), ("hypermutated_adj", "composition-adjusted")]:
    c, r = out["COAD"].get(k), out["READ"].get(k)
    if not c or not r: continue
    print(f"  {lab:20}  Δ={c['delta']:+.3f} p={c['p']:.1e} ({c['n_hyper']}/{c['n']})   "
          f"Δ={r['delta']:+.3f} p={r['p']:.3f} ({r['n_hyper']}/{r['n']})")

(T / "validation.json").write_text(json.dumps(out, indent=2, default=float))
print(f"\nwritten: {T/'validation.json'}")
