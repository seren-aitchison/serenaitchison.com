"""Pass 1: cell order, per-gene mean expression (for control binning), gene index."""
import gzip, json, numpy as np, sys

MATRIX = "/home/user/crc-data/GSE144735_processed_KUL3_CRC_10X_natural_log_TPM_matrix.txt.gz"

with gzip.open(MATRIX, "rt") as fh:
    cells = fh.readline().rstrip("\n").split("\t")[1:]
    genes, means, nonzero = [], [], []
    for i, line in enumerate(fh):
        tab = line.index("\t")
        gene = line[:tab]
        v = np.fromstring(line[tab+1:], sep="\t")
        genes.append(gene)
        means.append(v.mean())
        nonzero.append(int((v > 0).sum()))
        if i % 5000 == 0:
            print(f"  {i} genes…", file=sys.stderr, flush=True)

print(f"cells={len(cells)} genes={len(genes)}", file=sys.stderr)
np.save("gene_means.npy", np.array(means))
np.save("gene_nonzero.npy", np.array(nonzero))
json.dump({"cells": cells, "genes": genes}, open("index.json", "w"))
