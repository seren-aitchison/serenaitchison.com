"""Score cells, then ask the question: within-patient vs between-patient variation."""
import gzip, json, numpy as np, pandas as pd
from sigs import SIGNATURES

idx = json.load(open("index.json"))
cells = np.array(idx["cells"])
expr = np.load("expr.npz")
controls = json.load(open("controls.json"))

ann = pd.read_csv("/home/user/crc-data/GSE144735_processed_KUL3_CRC_10X_annotation.txt.gz",
                  sep="\t", compression="gzip")
ann = ann.set_index("Index").loc[cells]           # align to matrix column order
print("cells aligned:", len(ann), "| epithelial:", (ann.Cell_type == "Epithelial cells").sum())

def score(name):
    sig = [g for g in SIGNATURES[name] if g in expr]
    ctl = [g for g in controls[name] if g in expr]
    s = np.mean([expr[g] for g in sig], axis=0)
    c = np.mean([expr[g] for g in ctl], axis=0)
    return s - c

for name in SIGNATURES:
    ann[name] = score(name)

epi = ann[ann.Cell_type == "Epithelial cells"].copy()
print("\n--- cell-level signature behaviour (epithelial) ---")
print(epi[list(SIGNATURES)].corr().round(3).to_string())

# sample = patient x region. This is the unit at which a regional claim is made.
g = epi.groupby(["Patient", "Class"], observed=True)
samp = g[list(SIGNATURES)].mean()
samp["n_cells"] = g.size()
samp = samp.reset_index()
print("\n--- per-sample epithelial means ---")
print(samp.round(3).to_string(index=False))
samp.to_csv("sample_scores.csv", index=False)
epi[["Patient","Class","Sample","Cell_subtype"] + list(SIGNATURES)].to_csv("cell_scores.csv.gz",
                                                                            index=False, compression="gzip")
