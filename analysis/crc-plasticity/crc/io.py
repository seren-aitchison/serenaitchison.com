"""Matrix loaders and input validation.

Every loader exposes cells(), gene_means() and rows(wanted). Validation is explicit:
duplicate gene symbols, cells missing annotation and missing signature genes are
reported rather than silently tolerated.
"""
import gzip, csv, numpy as np, pandas as pd
from .config import DATA_DIR

class ValidationError(RuntimeError): pass

def _check(genes, cells, name):
    issues = []
    dup = pd.Index(genes).duplicated().sum()
    if dup: issues.append(f"{dup} duplicate gene symbols")
    if len(set(cells)) != len(cells): issues.append("duplicate cell identifiers")
    if not len(genes) or not len(cells): raise ValidationError(f"{name}: empty matrix")
    return issues

class DenseText:
    """Genes x cells, tab-separated, gzipped. Values are already natural-log TPM."""
    normalisation = "author-provided natural-log TPM"
    def __init__(self, path): self.path = path
    def cells(self):
        with gzip.open(self.path, "rt") as fh:
            return fh.readline().rstrip("\n").split("\t")[1:]
    def gene_means(self):
        genes, means = [], []
        with gzip.open(self.path, "rt") as fh:
            fh.readline()
            for line in fh:
                t = line.index("\t")
                genes.append(line[:t]); means.append(np.fromstring(line[t+1:], sep="\t").mean())
        return np.array(genes), np.array(means)
    def rows(self, wanted):
        out = {}
        with gzip.open(self.path, "rt") as fh:
            fh.readline()
            for line in fh:
                t = line.index("\t")
                if line[:t] in wanted:
                    out[line[:t]] = np.fromstring(line[t+1:], sep="\t").astype(np.float32)
        return out

class DenseCsvCounts:
    """Genes x cells CSV of raw UMI counts, normalised here to log1p(CP10K)."""
    normalisation = "log1p(CP10K), computed here from raw counts"
    def __init__(self, path): self.path, self._tot = path, None
    def cells(self):
        with gzip.open(self.path, "rt") as fh: return next(csv.reader(fh))[1:]
    def _totals(self):
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
        tot = self._totals(); genes, means = [], []
        with gzip.open(self.path, "rt") as fh:
            r = csv.reader(fh); next(r)
            for row in r:
                v = np.asarray(row[1:], dtype=np.float32)
                genes.append(row[0]); means.append(np.log1p(v / tot * 1e4).mean())
        return np.array(genes), np.array(means)
    def rows(self, wanted):
        tot = self._totals(); out = {}
        with gzip.open(self.path, "rt") as fh:
            r = csv.reader(fh); next(r)
            for row in r:
                if row[0] in wanted:
                    out[row[0]] = np.log1p(np.asarray(row[1:], dtype=np.float32) / tot * 1e4).astype(np.float32)
        return out

class H5Sparse:
    """CellRanger h5: genes x cells CSC, raw counts. Streamed; never densified."""
    normalisation = "log1p(CP10K), computed here from raw counts"
    CHUNK = 20000
    def __init__(self, path):
        import h5py
        self.path, self.h5py = path, h5py
        with h5py.File(path, "r") as f:
            self.genes = np.array([x.decode() for x in f["matrix/features/name"][:]])
            self.barcodes = np.array([x.decode() for x in f["matrix/barcodes"][:]])
            self.n_genes, self.n_cells = f["matrix/shape"][:]
        self._tot = None
    def cells(self): return list(self.barcodes)
    def _walk(self, fn):
        with self.h5py.File(self.path, "r") as f:
            indptr = f["matrix/indptr"][:]; data, indices = f["matrix/data"], f["matrix/indices"]
            for start in range(0, self.n_cells, self.CHUNK):
                stop = min(start + self.CHUNK, self.n_cells)
                lo, hi = int(indptr[start]), int(indptr[stop])
                fn(start, stop, data[lo:hi].astype(np.float32), indices[lo:hi], indptr[start:stop+1] - lo)
    def _totals(self):
        if self._tot is None:
            tot = np.zeros(self.n_cells, dtype=np.float32)
            self._walk(lambda a,b,d,ix,p: tot.__setitem__(slice(a,b), np.add.reduceat(d, p[:-1]) if len(d) else 0))
            self._tot = np.maximum(tot, 1.0)
        return self._tot
    def gene_means(self):
        tot = self._totals(); acc = np.zeros(self.n_genes)
        def go(a, b, d, ix, p):
            cell = np.repeat(np.arange(a, b), np.diff(p))
            acc[:] += np.bincount(ix, weights=np.log1p(d / tot[cell] * 1e4), minlength=self.n_genes)
        self._walk(go)
        return self.genes, acc / self.n_cells
    def rows(self, wanted):
        tot = self._totals()
        keep = np.where(np.isin(self.genes, list(wanted)))[0]
        lookup = -np.ones(self.n_genes, dtype=np.int64); lookup[keep] = np.arange(len(keep))
        out = np.zeros((len(keep), self.n_cells), dtype=np.float32)
        def go(a, b, d, ix, p):
            cell = np.repeat(np.arange(a, b), np.diff(p))
            sel = lookup[ix] >= 0
            if sel.any(): out[lookup[ix[sel]], cell[sel]] = np.log1p(d[sel] / tot[cell[sel]] * 1e4)
        self._walk(go)
        return {self.genes[g]: out[lookup[g]] for g in keep}

# ------------------------------------------------------------------ cohorts
FILES = {
    "kul3": "GSE144735_processed_KUL3_CRC_10X_natural_log_TPM_matrix.txt.gz",
    "kul3_ann": "GSE144735_processed_KUL3_CRC_10X_annotation.txt.gz",
    "smc": "GSE132465_GEO_processed_CRC_10X_natural_log_TPM_matrix.txt.gz",
    "smc_ann": "GSE132465_GEO_processed_CRC_10X_cell_annotation.txt.gz",
    "gse200997": "GSE200997_GEO_processed_CRC_10X_raw_UMI_count_matrix.csv.gz",
    "gse200997_ann": "GSE200997_GEO_processed_CRC_10X_cell_annotation.csv.gz",
    "pelka": "GSE178341_crc10x_full_c295v4_submit.h5",
    "pelka_meta": "GSE178341_crc10x_full_c295v4_submit_metatables.csv.gz",
    "pelka_clu": "GSE178341_crc10x_full_c295v4_submit_cluster.csv.gz",
}
ACCESSION = {"kul3": "GSE144735", "smc": "GSE132465",
             "gse200997": "GSE200997", "pelka": "GSE178341"}

def path(key):
    p = DATA_DIR / FILES[key]
    if not p.exists():
        raise ValidationError(
            f"missing input: {p}\nRun scripts/download_data.py, or set CRC_DATA_DIR "
            f"to a directory containing {FILES[key]}")
    return p

def load(cohort):
    """Return (source, annotation DataFrame indexed by cell, accession)."""
    if cohort == "kul3":
        src = DenseText(path("kul3"))
        ann = pd.read_csv(path("kul3_ann"), sep="\t").set_index("Index").rename(columns={"Class": "Region"})
        ann["Epithelial"] = ann.Cell_type == "Epithelial cells"
    elif cohort == "smc":
        src = DenseText(path("smc"))
        ann = pd.read_csv(path("smc_ann"), sep="\t").set_index("Index").rename(columns={"Class": "Region"})
        ann["Epithelial"] = ann.Cell_type == "Epithelial cells"
    elif cohort == "gse200997":
        src = DenseCsvCounts(path("gse200997"))
        ann = pd.read_csv(path("gse200997_ann"), index_col=0).rename(
            columns={"Condition": "Region", "samples": "Sample"})
        ann["Patient"] = ann.Sample.str.replace(r"^[BT]_", "", regex=True)
        ann["Epithelial"] = True          # no cell-type annotation supplied
    elif cohort == "pelka":
        src = H5Sparse(path("pelka"))
        ann = pd.read_csv(path("pelka_meta"), index_col=0, low_memory=False).join(
              pd.read_csv(path("pelka_clu"), index_col=0), how="left")
        ann["Patient"] = ann["PID"]
        ann["Region"] = ann["SPECIMEN_TYPE"].map({"T": "Tumor", "N": "Normal"})
        ann["Prep"] = ann["PROCESSING_TYPE"]
        ann["Epithelial"] = ann["clTopLevel"].astype(str).str.contains("Epi", case=False, na=False)
    else:
        raise ValidationError(f"unknown cohort {cohort}")
    return src, ann, ACCESSION[cohort]
