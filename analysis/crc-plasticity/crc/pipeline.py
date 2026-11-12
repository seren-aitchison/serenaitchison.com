"""End-to-end: score a cohort, aggregate to samples, write tables and metadata."""
import json, platform, numpy as np, pandas as pd
from datetime import datetime, timezone
from . import config, io as cio
from .signatures import SIGNATURES, NAMES
from .scoring import choose_controls, score_cells, provenance

def run_cohort(cohort, seed=None):
    seed = config.SEED if seed is None else seed
    config.ensure_dirs()
    src, ann, acc = cio.load(cohort)

    cells = src.cells()
    genes, means = src.gene_means()
    issues = cio._check(genes, cells, cohort)

    controls = choose_controls(genes, means, seed=seed)
    wanted = set()
    for spec in controls.values():
        wanted.update(spec["present"]); wanted.update(spec["controls"])
    rows = src.rows(wanted)

    df = score_cells(rows, controls)
    df.index = pd.Index(cells, name="cell")

    aligned = ann.reindex(df.index)
    unannotated = int(aligned["Patient"].isna().sum()) if "Patient" in aligned else len(df)
    for col in ["Patient", "Region", "Sample", "Epithelial", "Prep"]:
        if col in aligned.columns:
            df[col] = aligned[col].values
    df["Cohort"] = acc
    df = df[df["Patient"].notna()]

    epi = df[df["Epithelial"].fillna(False).astype(bool)] if "Epithelial" in df else df
    keys = [k for k in ["Patient", "Region", "Prep"] if k in epi.columns]
    g = epi.groupby(keys, observed=True)
    samples = g[NAMES].mean()
    samples["n_cells"] = g.size()
    samples = samples.reset_index()
    samples["Cohort"] = acc

    meta = dict(
        cohort=cohort, accession=acc, generated=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        normalisation=src.normalisation, params=config.params() | dict(seed=seed),
        n_cells_matrix=len(cells), n_genes=len(genes),
        n_cells_annotated=int(len(df)), n_cells_unannotated=unannotated,
        n_epithelial=int(len(epi)), n_samples=int(len(samples)),
        validation_issues=issues, signatures=provenance(controls, seed),
        python=platform.python_version(),
        packages={m: __import__(m).__version__ for m in ["numpy", "pandas", "scipy", "statsmodels"]},
    )

    samples.to_csv(config.TABLES / f"{cohort}_samples.csv", index=False)
    (config.TABLES / f"{cohort}_run.json").write_text(json.dumps(meta, indent=2))
    return samples, epi, meta
