#!/usr/bin/env python3
import sys; from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crc.figures import all_figures
from crc.config import FIGURES
all_figures(); print(f"figures written to {FIGURES}")
