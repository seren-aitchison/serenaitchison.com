"""Score one cohort. Identical scoring for all four; only loading and metadata differ.

Usage: python3 run_cohort.py <kul3|smc|pelka|gse200997>
Writes <cohort>_cells.csv.gz (cell-level scores) and <cohort>_samples.csv.
"""
import sys, json, gzip, csv, numpy as np, pandas as pd
from sigs import SIGNATURES
from cohorts import DenseText, DenseCsvCounts, H5Sparse, DATA

N_BINS, N_CTRL, SEED = 25, 50, 0

def build(name):
    if name == "kul3":
        src = DenseText(f"{DATA}/GSE144735_processed_KUL3_CRC_10X_natural_log_TPM_matrix.txt.gz", None)
        ann = pd.read_csv(f"{DATA}/GSE144735_processed_KUL3_CRC_10X_annotation.txt.gz", sep="\t").set_index("Index")
        ann = ann.rename(columns={"Class": "Region"})
        ann["Epithelial"] = ann.Cell_type == "Epithelial cells"
        return src, ann, "GSE144735"
    if name == "smc":
        src = DenseText(f"{DATA}/GSE132465_GEO_processed_CRC_10X_natural_log_TPM_matrix.txt.gz", None)
        ann = pd.read_csv(f"{DATA}/GSE132465_GEO_processed_CRC_10X_cell_annotation.txt.gz", sep="\t").set_index("Index")
        ann = ann.rename(columns={"Class": "Region"})
        ann["Epithelial"] = ann.Cell_type == "Epithelial cells"
        return src, ann, "GSE132465"
    if name == "gse200997":
        src = DenseCsvCounts(f"{DATA}/GSE200997_GEO_processed_CRC_10X_raw_UMI_count_matrix.csv.gz")
        ann = pd.read_csv(f"{DATA}/GSE200997_GEO_processed_CRC_10X_cell_annotation.csv.gz", index_col=0)
        ann = ann.rename(columns={"Condition": "Region", "samples": "Sample"})
        ann["Patient"] = ann.Sample.str.replace(r"^[BT]_", "", regex=True)
        # no cell-type annotation supplied; epithelial identity is assigned after scoring
        ann["Epithelial"] = True
        return src, ann, "GSE200997"
    if name == "pelka":
        src = H5Sparse(f"{DATA}/GSE178341_crc10x_full_c295v4_submit.h5")
        meta = pd.read_csv(f"{DATA}/GSE178341_crc10x_full_c295v4_submit_metatables.csv.gz", index_col=0, low_memory=False)
        clu = pd.read_csv(f"{DATA}/GSE178341_crc10x_full_c295v4_submit_cluster.csv.gz", index_col=0)
        meta = meta.join(clu, how="left")
        meta["Patient"] = meta["PID"]
        meta["Region"] = meta["SPECIMEN_TYPE"].map({"T": "Tumor", "N": "Normal"})
        meta["Prep"] = meta["PROCESSING_TYPE"]
        meta["Sample"] = meta["PatientTypeID"].astype(str) + "_" + meta["Prep"].astype(str)
        col = next((c for c in ["clTopLevel", "clMidwayPr", "cl295v11SubFull"] if c in meta.columns), None)
        meta["Epithelial"] = meta[col].astype(str).str.contains("Epi", case=False, na=False) if col else True
        return src, meta, "GSE178341"
    raise SystemExit(f"unknown cohort {name}")

def main(name):
    src, ann, acc = build(name)
    cells = src.cells()
    print(f"[{name}] {acc}: {len(cells)} cells in matrix", flush=True)

    genes, means = src.gene_means()
    print(f"[{name}] {len(genes)} genes, means computed", flush=True)

    order = np.argsort(means, kind="stable")
    bin_of = np.empty(len(genes), dtype=int)
    bin_of[order] = np.arange(len(genes)) * N_BINS // len(genes)
    gi = {g: i for i, g in enumerate(genes)}

    rng = np.random.default_rng(SEED)
    controls, needed = {}, set()
    for sig, gl in SIGNATURES.items():
        present = [g for g in gl if g in gi]
        pool = set()
        for g in present:
            cand = np.where(bin_of == bin_of[gi[g]])[0]
            cand = cand[~np.isin(genes[cand], present)]
            if len(cand):
                pool.update(rng.choice(cand, size=min(N_CTRL, len(cand)), replace=False).tolist())
        controls[sig] = [genes[i] for i in sorted(pool)]
        needed.update(present); needed.update(controls[sig])
        print(f"[{name}]   {sig}: {len(present)}/{len(gl)} genes, {len(pool)} controls", flush=True)

    rows = src.rows(needed)
    print(f"[{name}] extracted {len(rows)} rows", flush=True)

    df = pd.DataFrame(index=pd.Index(cells, name="cell"))
    for sig, gl in SIGNATURES.items():
        s = [rows[g] for g in gl if g in rows]
        c = [rows[g] for g in controls[sig] if g in rows]
        df[sig] = np.mean(s, axis=0) - np.mean(c, axis=0)

    ann = ann.reindex(df.index)
    for col in ["Patient", "Region", "Sample", "Epithelial", "Prep"]:
        if col in ann.columns:
            df[col] = ann[col].values
    df["Cohort"] = acc
    df = df[df["Patient"].notna()]
    df.to_csv(f"{name}_cells.csv.gz", compression="gzip")

    epi = df[df.Epithelial.fillna(False).astype(bool)] if "Epithelial" in df else df
    keys = [k for k in ["Patient", "Region", "Prep"] if k in epi.columns]
    g = epi.groupby(keys, observed=True)
    samp = g[list(SIGNATURES)].mean()
    samp["n_cells"] = g.size()
    samp.reset_index().to_csv(f"{name}_samples.csv", index=False)
    print(f"[{name}] epithelial cells: {len(epi)}; samples: {len(samp)}", flush=True)

if __name__ == "__main__":
    main(sys.argv[1])
