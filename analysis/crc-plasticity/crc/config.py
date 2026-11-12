"""Paths and parameters. No machine-specific path appears anywhere else."""
import os, json
from pathlib import Path

# Data location: override with CRC_DATA_DIR. Defaults to data/raw beside this package,
# which is what scripts/download_data.py fills and what .gitignore excludes.
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("CRC_DATA_DIR", ROOT / "data" / "raw"))
RESULTS = ROOT / "results"
TABLES, FIGURES = RESULTS / "tables", RESULTS / "figures"

# Scoring parameters, recorded in the run metadata so a result can be traced to them.
N_BINS = 25          # expression bins for control matching (Tirosh et al. 2016)
N_CONTROL = 50       # control genes drawn per signature gene
SEED = 0
MIN_CELLS = 20       # minimum epithelial cells for a sample to enter the analysis
N_BOOT = 2000        # bootstrap resamples for interval estimates

def ensure_dirs():
    for d in (TABLES, FIGURES):
        d.mkdir(parents=True, exist_ok=True)

def params() -> dict:
    return dict(n_bins=N_BINS, n_control=N_CONTROL, seed=SEED,
                min_cells=MIN_CELLS, n_boot=N_BOOT)
