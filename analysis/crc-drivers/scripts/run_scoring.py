#!/usr/bin/env python3
import sys; from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crcd.pipeline import run
for cohort in (sys.argv[1:] or ["COAD", "READ"]):
    df, meta = run(cohort)
    print(f"[{cohort}] {meta['n_samples']} samples ({meta['n_tumour']} tumour), "
          f"survival {meta['n_with_survival']}, TMB {meta['n_with_tmb']}")
    for s, p in meta["signatures"].items():
        miss = f"  missing {p['missing']}" if p["missing"] else ""
        print(f"    {s:11} {p['n_present']}/{p['n_supplied']} genes, {p['n_controls']} controls{miss}")
