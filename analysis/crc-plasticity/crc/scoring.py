"""Expression-matched control scoring (Tirosh et al. 2016), with full provenance.

Every run records which signature genes were present, which controls were drawn,
the seed and the bin layout, so a score can be traced to the genes that produced it.
"""
import numpy as np, pandas as pd
from .config import N_BINS, N_CONTROL, SEED
from .signatures import SIGNATURES

def expression_bins(means, n_bins=N_BINS):
    """Rank-based bins, so each bin holds an equal number of genes."""
    order = np.argsort(means, kind="stable")
    bins = np.empty(len(means), dtype=int)
    bins[order] = np.arange(len(means)) * n_bins // len(means)
    return bins

def choose_controls(genes, means, seed=SEED, n_control=N_CONTROL, n_bins=N_BINS):
    """For each signature, draw control genes from the bins its own genes occupy."""
    bins = expression_bins(means, n_bins)
    index = {g: i for i, g in enumerate(genes)}
    rng = np.random.default_rng(seed)
    out = {}
    for sig, spec in SIGNATURES.items():
        present = [g for g in spec["genes"] if g in index]
        missing = [g for g in spec["genes"] if g not in index]
        pool = set()
        for g in present:
            cand = np.where(bins == bins[index[g]])[0]
            cand = cand[~np.isin(genes[cand], present)]
            if len(cand):
                pool.update(rng.choice(cand, size=min(n_control, len(cand)), replace=False).tolist())
        out[sig] = dict(present=present, missing=missing,
                        controls=sorted(genes[i] for i in pool),
                        bins=sorted({int(bins[index[g]]) for g in present}))
    return out

def score_cells(rows, controls):
    """score = mean(signature) - mean(expression-matched controls), per cell."""
    scores = {}
    for sig, spec in controls.items():
        sig_rows = [rows[g] for g in spec["present"] if g in rows]
        ctl_rows = [rows[g] for g in spec["controls"] if g in rows]
        if not sig_rows or not ctl_rows:
            raise ValueError(f"{sig}: no usable genes after extraction")
        scores[sig] = np.mean(sig_rows, axis=0) - np.mean(ctl_rows, axis=0)
    return pd.DataFrame(scores)

def provenance(controls, seed=SEED):
    """A record of exactly what was scored, written alongside the results."""
    return {sig: dict(n_supplied=len(SIGNATURES[sig]["genes"]),
                      n_present=len(s["present"]), n_controls=len(s["controls"]),
                      missing=s["missing"], bins_occupied=s["bins"], seed=seed)
            for sig, s in controls.items()}
