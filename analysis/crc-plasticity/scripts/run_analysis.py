#!/usr/bin/env python3
"""Score cohorts and write every result as a table or JSON, so nothing downstream
hardcodes a number. Usage: run_analysis.py [cohort ...]"""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crc.pipeline import run_cohort
from crc.config import TABLES

for cohort in (sys.argv[1:] or ["kul3", "smc", "gse200997", "pelka"]):
    samples, epi, meta = run_cohort(cohort)
    print(f"[{cohort}] {meta['accession']}: {meta['n_cells_matrix']} cells, "
          f"{meta['n_epithelial']} epithelial, {meta['n_samples']} samples")
    for sig, p in meta["signatures"].items():
        miss = f", missing {p['missing']}" if p["missing"] else ""
        print(f"    {sig:6} {p['n_present']}/{p['n_supplied']} genes, {p['n_controls']} controls{miss}")
    if meta["validation_issues"]:
        print(f"    validation: {meta['validation_issues']}")
