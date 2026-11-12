import os
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("CRCD_DATA_DIR", ROOT / "data" / "raw"))
RESULTS = ROOT / "results"
TABLES, FIGURES = RESULTS / "tables", RESULTS / "figures"
N_BINS, N_CONTROL, SEED, N_BOOT = 25, 50, 0, 2000
MIN_TMB_HYPERMUTATED = 10.0   # mutations per Mb; the conventional hypermutation cut-off
def ensure_dirs():
    for d in (TABLES, FIGURES): d.mkdir(parents=True, exist_ok=True)
def params():
    return dict(n_bins=N_BINS, n_control=N_CONTROL, seed=SEED, n_boot=N_BOOT,
                tmb_cutoff=MIN_TMB_HYPERMUTATED)
