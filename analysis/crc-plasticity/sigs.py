"""Signatures fixed in advance of looking at any result.

FETAL  — fetal-like / revival regenerative programme of intestinal epithelium
         (Yui 2018; Ayyaz 2019; Mustata 2013; co-opted in CRC)
YAP    — canonical YAP/TAZ transcriptional targets, the pathway driving that programme
ISC    — canonical LGR5+ intestinal stem-cell programme (the state cells leave)
DIFF   — differentiated enterocyte / goblet markers, as a specificity control
"""
SIGNATURES = {
  "FETAL": ["ANXA1","ANXA3","CLU","TACSTD2","EMP1","S100A4","SPP1","MSLN","CD44",
            "PLAUR","TIMP1","LGALS3","SERPINE1","IFITM3","CAV1"],
  "YAP":   ["CYR61","CTGF","ANKRD1","AMOTL2","THBS1","AXL","TEAD1"],
  "ISC":   ["LGR5","ASCL2","OLFM4","SMOC2","EPHB2","RGMB","TNFRSF19","SLC12A2","AXIN2"],
  "DIFF":  ["KRT20","MUC2","FABP1","CEACAM7","TFF3","AQP8","GUCA2A"],
}
