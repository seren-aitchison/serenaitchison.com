"""Signatures.

The four programme signatures are imported unchanged from project 1, so the two
analyses measure the same thing. The composition panels are new and exist to test
the confound that bulk tissue introduces.
"""
import sys
from pathlib import Path
_P1 = Path(__file__).resolve().parent.parent.parent / "crc-plasticity"
sys.path.insert(0, str(_P1))
from crc.signatures import SIGNATURES as PROGRAMME   # noqa: E402

# Compact canonical panels, deliberately not the full ESTIMATE signatures (141 genes each).
# They are used to measure composition, not to reproduce ESTIMATE, and are labelled as such.
COMPOSITION = {
    "STROMA": dict(
        genes=["COL1A1","COL1A2","COL3A1","COL5A1","FAP","THY1","PDGFRB","PDGFRA",
               "ACTA2","DCN","LUM","SPARC","FN1","POSTN","TAGLN"],
        label="Fibroblast / extracellular matrix content",
        provenance="Canonical fibroblast and ECM markers. A compact panel, not the full "
                   "ESTIMATE stromal signature.",
    ),
    "IMMUNE": dict(
        genes=["PTPRC","CD3D","CD3E","CD2","CD53","LCK","CD8A","CD19","MS4A1",
               "CSF1R","AIF1","ITGAM","TYROBP","FCGR3A","LAPTM5"],
        label="Leukocyte content",
        provenance="Canonical pan-leukocyte and myeloid markers. A compact panel, not the "
                   "full ESTIMATE immune signature.",
    ),
    "EPITHELIUM": dict(
        genes=["EPCAM","KRT8","KRT18","KRT19","CDH1","CLDN4","CLDN7"],
        label="Epithelial content",
        provenance="Canonical epithelial markers, used as a direct composition readout. KRT20 is "
                   "excluded because it belongs to the DIFF programme signature, which is "
                   "fixed from project 1 and must not overlap a covariate.",
    ),
}

ALL = {**{k: v for k, v in PROGRAMME.items()}, **COMPOSITION}
PROGRAMME_NAMES = list(PROGRAMME)
COMPOSITION_NAMES = list(COMPOSITION)
NAMES = list(ALL)
