#!/usr/bin/env python3
"""Does the fetal-like programme carry patient-level information independent of
tumour composition?

In bulk tissue a signature containing stromal genes will track composition. Every
association is therefore reported twice: unadjusted, and adjusted for the stromal,
immune and epithelial panels. An association that disappears on adjustment was
composition, not biology.
"""
import sys, json
from pathlib import Path
import numpy as np, pandas as pd, statsmodels.api as sm, statsmodels.formula.api as smf
from scipy.stats import spearmanr, mannwhitneyu
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crcd import config
from crcd.signatures import PROGRAMME_NAMES, COMPOSITION_NAMES

T = config.TABLES
out = {"params": config.params()}

df = pd.read_csv(T / "COAD_scores.csv", index_col=0)
tum = df[df.tumour].copy()
print(f"TCGA-COAD: {len(tum)} tumour samples\n")

# ---------------------------------------------------------------- 1. the confound
print("=== 1. How much of the programme score is composition? ===")
comp = {}
for s in PROGRAMME_NAMES:
    row = {}
    for c in COMPOSITION_NAMES:
        r, p = spearmanr(tum[s], tum[c])
        row[c] = dict(rho=float(r), p=float(p))
    m = smf.ols(f"{s} ~ STROMA + IMMUNE + EPITHELIUM", tum).fit()
    row["r2_composition"] = float(m.rsquared)
    comp[s] = row
    print(f"  {s:6} rho: stroma {row['STROMA']['rho']:+.3f}  immune {row['IMMUNE']['rho']:+.3f}  "
          f"epithelium {row['EPITHELIUM']['rho']:+.3f}   R² from composition = {m.rsquared:.3f}")
out["composition"] = comp

# residualised score: what is left after composition is removed
for s in PROGRAMME_NAMES:
    tum[f"{s}_adj"] = smf.ols(f"{s} ~ STROMA + IMMUNE + EPITHELIUM", tum).fit().resid

# ---------------------------------------------------------------- 2. patient variables
print("\n=== 2. Patient-level associations, before and after adjustment ===")
assoc = {}
tests = []
for s in ["FETAL", "YAP"]:
    for var, kind in [("side", "cat"), ("stage", "ord"), ("hypermutated", "cat"),
                      ("sex", "cat"), ("age", "num")]:
        d = tum.dropna(subset=[var, s])
        if len(d) < 20: continue
        for suffix in ["", "_adj"]:
            col = s + suffix
            if kind == "num":
                r, p = spearmanr(d[col], d[var]); stat = f"rho={r:+.3f}"
            elif var == "stage":
                order = {"I": 1, "II": 2, "III": 3, "IV": 4}
                dd = d[d[var].isin(order)]
                r, p = spearmanr(dd[col], dd[var].map(order)); stat = f"rho={r:+.3f}"
            else:
                groups = [g[col].values for _, g in d.groupby(var)]
                if len(groups) != 2: continue
                u, p = mannwhitneyu(*groups)
                diff = np.median(groups[1]) - np.median(groups[0])
                stat = f"Δmedian={diff:+.3f}"
            tests.append(dict(signature=s, variable=var, adjusted=bool(suffix),
                              stat=stat, p=float(p), n=int(len(d))))
# Benjamini-Hochberg across every association tested
pv = np.array([t["p"] for t in tests])
order = np.argsort(pv); ranked = pv[order]
q = ranked * len(pv) / (np.arange(len(pv)) + 1)
q = np.minimum.accumulate(q[::-1])[::-1]
for i, idx in enumerate(order): tests[idx]["q"] = float(min(q[i], 1.0))
for t in tests:
    flag = "*" if t["q"] < 0.05 else " "
    print(f"  {flag} {t['signature']:6} vs {t['variable']:13} "
          f"{'adjusted  ' if t['adjusted'] else 'unadjusted'} {t['stat']:18} "
          f"p={t['p']:.2e} q={t['q']:.3f}  n={t['n']}")
out["associations"] = tests

# ---------------------------------------------------------------- 3. survival
print("\n=== 3. Survival (Cox proportional hazards) ===")
surv = tum.dropna(subset=["os_days", "os_event"]).copy()
surv = surv[surv.os_days > 0]
surv["stage_n"] = surv.stage.map({"I": 1, "II": 2, "III": 3, "IV": 4})
surv = surv.dropna(subset=["stage_n", "age"])
print(f"  {len(surv)} samples with survival, stage and age; {int(surv.os_event.sum())} events")

def cox(formula, data, label):
    y, X = data.os_days.values, sm.add_constant(
        pd.get_dummies(data[formula], drop_first=True).astype(float), has_constant="add")
    X = X.drop(columns=["const"])
    m = sm.PHReg(y, X, status=data.os_event.values).fit()
    res = {}
    for name, coef, se, p in zip(X.columns, m.params, m.bse, m.pvalues):
        res[name] = dict(hr=float(np.exp(coef)), ci_lo=float(np.exp(coef - 1.96*se)),
                         ci_hi=float(np.exp(coef + 1.96*se)), p=float(p))
    print(f"  {label}")
    for name, v in res.items():
        print(f"      {name:14} HR={v['hr']:.3f} [{v['ci_lo']:.3f}, {v['ci_hi']:.3f}]  p={v['p']:.3f}")
    return res

# scale the score so the HR is per standard deviation
for s in ["FETAL", "FETAL_adj"]:
    surv[f"{s}_z"] = (surv[s] - surv[s].mean()) / surv[s].std()
out["survival"] = {
    "unadjusted": cox(["FETAL_z", "stage_n", "age"], surv, "FETAL (per SD) + stage + age"),
    "composition_adjusted": cox(["FETAL_adj_z", "stage_n", "age"], surv,
                                "FETAL residualised on composition (per SD) + stage + age"),
}
out["survival"]["n"] = int(len(surv)); out["survival"]["events"] = int(surv.os_event.sum())

(T / "analysis.json").write_text(json.dumps(out, indent=2, default=float))
print(f"\nwritten: {T/'analysis.json'}")
