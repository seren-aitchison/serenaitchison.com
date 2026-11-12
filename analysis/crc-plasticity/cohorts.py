"""Loaders for the four cohorts, each exposing the same interface.

Every cohort is scored independently and scores are never compared across cohorts:
the normalisations differ (natural-log TPM for KUL3/SMC, log CP10K for Pelka/GSE200997),
and the Tirosh control correction is relative to each dataset's own expression
distribution. All reported quantities are within-cohort variance ratios, which that
design supports; absolute score values are not comparable between cohorts.
"""
import gzip, csv, numpy as np, pandas as pd

DATA = "/home/user/crc-data"

# ---------------------------------------------------------------- dense text
class DenseText:
    """Genes x cells, tab-separated, gzipped. Values already natural-log TPM."""
    def __init__(self, path, ann_path, ann_sep="\t"):
        self.path, self.ann_path, self.ann_sep = path, ann_path, ann_sep

    def cells(self):
        with gzip.open(self.path, "rt") as fh:
            return fh.readline().rstrip("\n").split("\t")[1:]

    def gene_means(self):
        genes, means = [], []
        with gzip.open(self.path, "rt") as fh:
            fh.readline()
            for line in fh:
                t = line.index("\t")
                genes.append(line[:t])
                means.append(np.fromstring(line[t+1:], sep="\t").mean())
        return np.array(genes), np.array(means)

    def rows(self, wanted):
        out = {}
        with gzip.open(self.path, "rt") as fh:
            fh.readline()
            for line in fh:
                t = line.index("\t")
                g = line[:t]
                if g in wanted:
                    out[g] = np.fromstring(line[t+1:], sep="\t").astype(np.float32)
        return out

# ---------------------------------------------------------------- dense CSV counts
class DenseCsvCounts:
    """Genes x cells CSV of raw UMI counts. Normalised here to log1p(CP10K)."""
    def __init__(self, path):
        self.path = path
        self._tot = None

    def cells(self):
        with gzip.open(self.path, "rt") as fh:
            return next(csv.reader(fh))[1:]

    def _totals(self):
        """Per-cell total counts, for CP10K scaling."""
        if self._tot is None:
            tot = None
            with gzip.open(self.path, "rt") as fh:
                r = csv.reader(fh); next(r)
                for row in r:
                    v = np.asarray(row[1:], dtype=np.float32)
                    tot = v if tot is None else tot + v
            self._tot = np.maximum(tot, 1.0)
        return self._tot

    def gene_means(self):
        tot = self._totals()
        genes, means = [], []
        with gzip.open(self.path, "rt") as fh:
            r = csv.reader(fh); next(r)
            for row in r:
                v = np.asarray(row[1:], dtype=np.float32)
                genes.append(row[0])
                means.append(np.log1p(v / tot * 1e4).mean())
        return np.array(genes), np.array(means)

    def rows(self, wanted):
        tot = self._totals()
        out = {}
        with gzip.open(self.path, "rt") as fh:
            r = csv.reader(fh); next(r)
            for row in r:
                if row[0] in wanted:
                    v = np.asarray(row[1:], dtype=np.float32)
                    out[row[0]] = np.log1p(v / tot * 1e4).astype(np.float32)
        return out

# ---------------------------------------------------------------- 10x h5 (CSC)
class H5Sparse:
    """CellRanger-style h5: genes x cells CSC, raw counts. Normalised to log1p(CP10K).

    764M non-zeros will not fit in memory as dense, so every pass walks the cell
    columns in chunks and keeps only what it needs.
    """
    CHUNK = 20000

    def __init__(self, path):
        self.path = path
        import h5py
        self.h5py = h5py
        with h5py.File(path, "r") as f:
            self.genes = np.array([x.decode() for x in f["matrix/features/name"][:]])
            self.barcodes = np.array([x.decode() for x in f["matrix/barcodes"][:]])
            self.n_genes, self.n_cells = f["matrix/shape"][:]
        self._tot = None

    def cells(self):
        return list(self.barcodes)

    def _walk(self, fn):
        with self.h5py.File(self.path, "r") as f:
            indptr = f["matrix/indptr"][:]
            data, indices = f["matrix/data"], f["matrix/indices"]
            for start in range(0, self.n_cells, self.CHUNK):
                stop = min(start + self.CHUNK, self.n_cells)
                lo, hi = int(indptr[start]), int(indptr[stop])
                d = data[lo:hi].astype(np.float32)
                ix = indices[lo:hi]
                ptr = indptr[start:stop+1] - lo
                fn(start, stop, d, ix, ptr)

    def _totals(self):
        if self._tot is None:
            tot = np.zeros(self.n_cells, dtype=np.float32)
            def acc(start, stop, d, ix, ptr):
                tot[start:stop] = np.add.reduceat(d, ptr[:-1]) if len(d) else 0
            self._walk(acc)
            self._tot = np.maximum(tot, 1.0)
        return self._tot

    def gene_means(self):
        tot = self._totals()
        acc = np.zeros(self.n_genes, dtype=np.float64)
        def go(start, stop, d, ix, ptr):
            cell = np.repeat(np.arange(start, stop), np.diff(ptr))
            np.add.at(acc, ix, np.log1p(d / tot[cell] * 1e4))
        self._walk(go)
        return self.genes, (acc / self.n_cells)

    def rows(self, wanted):
        tot = self._totals()
        keep = np.where(np.isin(self.genes, list(wanted)))[0]
        pos = {g: i for i, g in enumerate(keep)}
        out = np.zeros((len(keep), self.n_cells), dtype=np.float32)
        lookup = -np.ones(self.n_genes, dtype=np.int64)
        lookup[keep] = np.arange(len(keep))
        def go(start, stop, d, ix, ptr):
            cell = np.repeat(np.arange(start, stop), np.diff(ptr))
            sel = lookup[ix] >= 0
            if sel.any():
                out[lookup[ix[sel]], cell[sel]] = np.log1p(d[sel] / tot[cell[sel]] * 1e4)
        self._walk(go)
        return {self.genes[g]: out[lookup[g]] for g in keep}
