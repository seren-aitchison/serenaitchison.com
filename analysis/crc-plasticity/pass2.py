"""Pass 2: extract signature genes and expression-matched control genes.

Control selection follows Tirosh et al. (2016): bin all genes by mean expression,
and for each signature gene draw control genes from the same bin. The score is then
mean(signature) - mean(control), which removes the dependence on a cell's overall
depth and on how highly expressed the signature genes happen to be.
"""
import gzip, json, numpy as np
from sigs import SIGNATURES

MATRIX = "/home/user/crc-data/GSE144735_processed_KUL3_CRC_10X_natural_log_TPM_matrix.txt.gz"
N_BINS, N_CTRL, SEED = 25, 50, 0

idx = json.load(open("index.json"))
genes = np.array(idx["genes"])
means = np.load("gene_means.npy")

# rank-based binning, so bins hold equal numbers of genes
order = np.argsort(means, kind="stable")
bin_of = np.empty(len(genes), dtype=int)
bin_of[order] = (np.arange(len(genes)) * N_BINS // len(genes))
gene_to_i = {g: i for i, g in enumerate(genes)}

rng = np.random.default_rng(SEED)
controls = {}
for name, gl in SIGNATURES.items():
    present = [g for g in gl if g in gene_to_i]
    pool = set()
    for g in present:
        b = bin_of[gene_to_i[g]]
        cand = np.where(bin_of == b)[0]
        cand = cand[~np.isin(genes[cand], present)]
        pool.update(rng.choice(cand, size=min(N_CTRL, len(cand)), replace=False).tolist())
    controls[name] = sorted(pool)
    print(f"{name}: {len(present)} signature genes, {len(pool)} control genes")

needed = set()
for name, gl in SIGNATURES.items():
    needed.update(g for g in gl if g in gene_to_i)
    needed.update(genes[i] for i in controls[name])
print("rows to extract:", len(needed))

rows = {}
with gzip.open(MATRIX, "rt") as fh:
    fh.readline()
    for line in fh:
        tab = line.index("\t")
        g = line[:tab]
        if g in needed:
            rows[g] = np.fromstring(line[tab+1:], sep="\t").astype(np.float32)

print("extracted:", len(rows))
np.savez_compressed("expr.npz", **rows)
json.dump({k: [genes[i] for i in v] for k, v in controls.items()}, open("controls.json", "w"))
