#!/usr/bin/env python3
"""Confound checks the analysis should answer before a reviewer asks.

1. Does the epithelial fetal-like score track the stromal/myeloid fraction of the sample?
   Several FETAL genes (SPP1, S100A4, LGALS3, CD44, TIMP1) are expressed by stroma and
   myeloid cells, so ambient RNA or doublets could make the score read tissue composition
   rather than epithelial state.
2. Does it track the number of epithelial cells, i.e. is it a depth artefact? Tested
   overall, then within each region, because tumour samples have both more epithelial
   cells and higher scores and the two would otherwise be confounded.
3. Does the core-border score difference track the core-border cell-count difference?
   If it does, the small residual regional signal is technical rather than biological.
"""
import sys, json
from pathlib import Path
import numpy as np, pandas as pd
from scipy.stats import spearmanr
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crc import config, io as cio
from crc.signatures import NAMES

out = {}
for cohort in ["kul3", "smc"]:          # the two cohorts with cell-type annotation
    _, ann, acc = cio.load(cohort)
    samples = pd.read_csv(config.TABLES / f"{cohort}_samples.csv")
    ann = ann.dropna(subset=["Patient", "Region"])
    comp = (ann.groupby(["Patient", "Region", "Cell_type"], observed=True).size()
              .unstack(fill_value=0))
    frac = comp.div(comp.sum(axis=1), axis=0)
    non_epi = [c for c in frac.columns if c != "Epithelial cells"]
    frac["non_epithelial"] = frac[non_epi].sum(axis=1)
    frac = frac.reset_index()

    m = samples.merge(frac, on=["Patient", "Region"], how="inner")
    m = m[m.n_cells >= config.MIN_CELLS]
    res = {}
    for sig in NAMES:
        r_s, p_s = spearmanr(m[sig], m["non_epithelial"])
        r_n, p_n = spearmanr(m[sig], m["n_cells"])
        res[sig] = dict(rho_non_epithelial=float(r_s), p_non_epithelial=float(p_s),
                        rho_n_cells=float(r_n), p_n_cells=float(p_n))
    # the specific worry: stromal-expressed FETAL genes
    out[acc] = dict(n_samples=int(len(m)), correlations=res,
                    non_epithelial_range=[float(m.non_epithelial.min()), float(m.non_epithelial.max())])
    print(f"=== {acc} ({len(m)} samples, non-epithelial fraction "
          f"{m.non_epithelial.min():.2f}–{m.non_epithelial.max():.2f}) ===")
    for sig, v in res.items():
        print(f"  {sig:6} vs non-epithelial fraction: rho={v['rho_non_epithelial']:+.3f} p={v['p_non_epithelial']:.3f}"
              f"   vs n_cells: rho={v['rho_n_cells']:+.3f} p={v['p_n_cells']:.3f}")

# ---- within-region, and the paired cell-count check on the regional contrast ----
for cohort in ["kul3", "smc"]:
    _, ann, acc = cio.load(cohort)
    s = pd.read_csv(config.TABLES / f"{cohort}_samples.csv")
    s = s[s.n_cells >= config.MIN_CELLS]
    within = {}
    for region in sorted(s.Region.dropna().unique()):
        sub = s[s.Region == region]
        if len(sub) < 4: continue
        r, pv = spearmanr(sub.FETAL, sub.n_cells)
        within[region] = dict(n=int(len(sub)), rho=float(r), p=float(pv))
    out[acc]["within_region_n_cells"] = within
    print(f"\n=== {acc}: FETAL vs epithelial cell count, within region ===")
    for region, v in within.items():
        print(f"  {region:7} n={v['n']:2}  rho={v['rho']:+.3f} p={v['p']:.3f}")

    if {"Tumor", "Border"} <= set(s.Region.dropna()):
        wc = s.pivot_table(index="Patient", columns="Region", values="n_cells").dropna(subset=["Tumor","Border"])
        wf = s.pivot_table(index="Patient", columns="Region", values="FETAL").dropna(subset=["Tumor","Border"])
        r, pv = spearmanr(wc["Tumor"] - wc["Border"], wf["Tumor"] - wf["Border"])
        out[acc]["regional_cellcount_coupling"] = dict(n=int(len(wc)), rho=float(r), p=float(pv))
        print(f"  core-border cell-count difference vs score difference: "
              f"rho={r:+.3f} p={pv:.3f} (n={len(wc)})")

(config.TABLES / "confounds.json").write_text(json.dumps(out, indent=2))
print(f"\nwritten: {config.TABLES/'confounds.json'}")
