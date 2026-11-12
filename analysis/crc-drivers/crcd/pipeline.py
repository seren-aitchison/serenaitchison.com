"""Score bulk tumours and assemble the analysis table."""
import json, platform, numpy as np, pandas as pd
from datetime import datetime, timezone
from . import config, io as cio
from .signatures import ALL, NAMES

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "crc-plasticity"))
from crc.scoring import expression_bins   # same control-matching as project 1

SYMBOL_TO_ENSEMBL = None

def _ensembl_map(symbols):
    """Resolve gene symbols to Ensembl IDs via the Ensembl REST API, cached on disk."""
    cache = config.ROOT / "data" / "symbol_map.json"
    known = json.loads(cache.read_text()) if cache.exists() else {}
    need = [s for s in symbols if s not in known]
    if need:
        import urllib.request
        for s in need:
            try:
                url = f"https://rest.ensembl.org/xrefs/symbol/homo_sapiens/{s}?content-type=application/json"
                hits = json.load(urllib.request.urlopen(url, timeout=30))
                gid = next((h["id"] for h in hits if h.get("id", "").startswith("ENSG")), None)
                known[s] = gid
            except Exception:
                known[s] = None
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps(known, indent=0, sort_keys=True))
    return known

def score_sets(expr, sets, seed=None):
    """Score an arbitrary dict of {name: {"genes": [...]}} against a loaded cohort.

    Separated from run() so that sensitivity analyses can re-score alternative gene
    lists through exactly the same control-matching code as the headline result.
    Returns (DataFrame indexed by sample, provenance dict).
    """
    seed = config.SEED if seed is None else seed
    samples = expr.samples()
    genes, means = expr.gene_means()

    wanted_symbols = sorted({g for s in sets.values() for g in s["genes"]})
    smap = _ensembl_map(wanted_symbols)
    sym_of = {v: k for k, v in smap.items() if v}

    index = {g: i for i, g in enumerate(genes)}
    bins = expression_bins(means, config.N_BINS)
    rng = np.random.default_rng(seed)

    controls, prov = {}, {}
    for name, spec in sets.items():
        present = [smap[g] for g in spec["genes"] if smap.get(g) and smap[g] in index]
        missing = [g for g in spec["genes"] if not smap.get(g) or smap[g] not in index]
        pool = set()
        for g in present:
            cand = np.where(bins == bins[index[g]])[0]
            cand = cand[~np.isin(genes[cand], present)]
            if len(cand):
                pool.update(rng.choice(cand, size=min(config.N_CONTROL, len(cand)), replace=False).tolist())
        controls[name] = dict(present=present, controls=sorted(genes[i] for i in pool))
        prov[name] = dict(n_supplied=len(spec["genes"]), n_present=len(present),
                          n_controls=len(pool), missing=missing)

    wanted = {g for c in controls.values() for g in c["present"] + c["controls"]}
    rows = expr.rows(wanted)

    df = pd.DataFrame(index=pd.Index(samples, name="sample"))
    for name, c in controls.items():
        sig = [rows[g] for g in c["present"] if g in rows]
        ctl = [rows[g] for g in c["controls"] if g in rows]
        df[name] = np.mean(sig, axis=0) - np.mean(ctl, axis=0)
    return df, prov


def run(cohort, seed=None):
    seed = config.SEED if seed is None else seed
    config.ensure_dirs()
    expr = cio.BulkExpression(cohort)
    df, prov = score_sets(expr, ALL, seed)

    df["tumour"] = [cio.is_tumour(s) for s in df.index]
    df["patient"] = [cio.patient_of(s) for s in df.index]
    df = df.join(cio.clinical(cohort), how="left")
    df = df.join(cio.survival(cohort)[["os_days", "os_event"]], how="left")
    tmb = cio.mutation_burden(cohort)
    df = df.join(tmb, how="left")
    df["hypermutated"] = df.tmb > config.MIN_TMB_HYPERMUTATED
    df["cohort"] = cohort

    meta = dict(cohort=cohort, generated=datetime.now(timezone.utc).isoformat(timespec="seconds"),
                normalisation=expr.normalisation, params=config.params() | dict(seed=seed),
                n_samples=len(df), n_tumour=int(df.tumour.sum()),
                n_with_survival=int(df.os_days.notna().sum()),
                n_with_tmb=int(df.tmb.notna().sum()), signatures=prov,
                python=platform.python_version())

    df.to_csv(config.TABLES / f"{cohort}_scores.csv")
    (config.TABLES / f"{cohort}_run.json").write_text(json.dumps(meta, indent=2))
    return df, meta
