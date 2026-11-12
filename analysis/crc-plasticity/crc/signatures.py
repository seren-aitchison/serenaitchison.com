"""Gene signatures, fixed before any result was examined.

Each set carries its provenance. Scoring records which genes were actually present
in each matrix, so "missing" is a reported fact rather than a silent omission.
"""

SIGNATURES = {
    "FETAL": dict(
        genes=["ANXA1","ANXA3","CLU","TACSTD2","EMP1","S100A4","SPP1","MSLN","CD44",
               "PLAUR","TIMP1","LGALS3","SERPINE1","IFITM3","CAV1"],
        label="Fetal-like / revival programme",
        provenance="Fetal-like and revival regenerative programmes of intestinal "
                   "epithelium (Yui 2018; Ayyaz 2019; Mustata 2013), reported as "
                   "co-opted in colorectal cancer.",
        caveat="A transcriptional programme associated with drug tolerance in prior "
               "literature. This analysis does not measure drug response.",
    ),
    "YAP": dict(
        genes=["CYR61","CTGF","ANKRD1","AMOTL2","THBS1","AXL","TEAD1"],
        label="YAP/TAZ target expression",
        provenance="Canonical YAP/TAZ transcriptional targets.",
        caveat="Measures target transcript abundance, which is a downstream readout "
               "and not a direct measure of YAP/TAZ signalling activity.",
    ),
    "ISC": dict(
        genes=["LGR5","ASCL2","OLFM4","SMOC2","EPHB2","RGMB","TNFRSF19","SLC12A2","AXIN2"],
        label="LGR5+ intestinal stem-cell programme",
        provenance="Canonical intestinal stem-cell markers.",
        caveat="",
    ),
    "DIFF": dict(
        genes=["KRT20","MUC2","FABP1","CEACAM7","TFF3","AQP8","GUCA2A"],
        label="Differentiated epithelium",
        provenance="Enterocyte and goblet markers, included as a specificity control.",
        caveat="",
    ),
}

NAMES = list(SIGNATURES)
def genes(sig): return list(SIGNATURES[sig]["genes"])
def label(sig): return SIGNATURES[sig]["label"]
