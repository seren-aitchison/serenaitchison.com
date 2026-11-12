"""Load TCGA bulk expression, clinical and mutation data from the Xena GDC hub."""
import gzip, numpy as np, pandas as pd
from .config import DATA_DIR

FILES = {c: dict(expr=f"TCGA-{c}.star_tpm.tsv.gz", clin=f"TCGA-{c}.clinical.tsv.gz",
                 surv=f"TCGA-{c}.survival.tsv.gz", mut=f"TCGA-{c}.somaticmutation_wxs.tsv.gz")
         for c in ("COAD", "READ")}

def path(cohort, kind):
    p = DATA_DIR / FILES[cohort][kind]
    if not p.exists():
        raise FileNotFoundError(f"missing {p}; run scripts/download_data.py")
    return p

def is_tumour(sample_id):
    """TCGA barcode: sample type 01-09 are tumour, 10-19 normal."""
    try: return int(str(sample_id).split("-")[3][:2]) < 10
    except Exception: return False

def patient_of(sample_id):
    return "-".join(str(sample_id).split("-")[:3])

class BulkExpression:
    """Genes x samples, log2(TPM+1) from the Xena GDC hub, Ensembl IDs with version."""
    normalisation = "log2(TPM+0.001) as distributed by the Xena GDC hub"
    def __init__(self, cohort): self.p = path(cohort, "expr")
    def samples(self):
        with gzip.open(self.p, "rt") as fh:
            return fh.readline().rstrip("\n").split("\t")[1:]
    def gene_means(self):
        genes, means = [], []
        with gzip.open(self.p, "rt") as fh:
            fh.readline()
            for line in fh:
                t = line.index("\t")
                genes.append(line[:t].split(".")[0])
                means.append(np.fromstring(line[t+1:], sep="\t").mean())
        return np.array(genes), np.array(means)
    def rows(self, wanted):
        out = {}
        with gzip.open(self.p, "rt") as fh:
            fh.readline()
            for line in fh:
                t = line.index("\t")
                g = line[:t].split(".")[0]
                if g in wanted:
                    v = np.fromstring(line[t+1:], sep="\t").astype(np.float32)
                    out[g] = np.maximum(out[g], v) if g in out else v   # duplicate Ensembl IDs
        return out

def clinical(cohort):
    c = pd.read_csv(path(cohort, "clin"), sep="\t", low_memory=False)
    key = "submitter_id.samples" if "submitter_id.samples" in c.columns else c.columns[0]
    c = c.rename(columns={key: "sample"}).set_index("sample")
    out = pd.DataFrame(index=c.index)
    out["age"] = pd.to_numeric(c.get("age_at_index.demographic"), errors="coerce")
    out["sex"] = c.get("gender.demographic")
    stage = c.get("ajcc_pathologic_stage.diagnoses")
    out["stage"] = (stage.astype(str).str.extract(r"Stage\s+(IV|III|II|I)")[0]
                    if stage is not None else np.nan)
    site = c.get("site_of_resection_or_biopsy.diagnoses")
    RIGHT = ["Cecum", "Ascending", "Hepatic flexure", "Transverse"]
    LEFT = ["Descending", "Sigmoid", "Splenic flexure", "Rectosigmoid", "Rectum"]
    def side(s):
        s = str(s)
        if any(k.lower() in s.lower() for k in RIGHT): return "right"
        if any(k.lower() in s.lower() for k in LEFT): return "left"
        return np.nan
    out["side"] = site.map(side) if site is not None else np.nan
    out["site_raw"] = site
    return out

def survival(cohort):
    s = pd.read_csv(path(cohort, "surv"), sep="\t")
    return s.rename(columns={"OS.time": "os_days", "OS": "os_event"}).set_index("sample")

def mutation_burden(cohort):
    """Mutations per megabase per sample, as a proxy for MSI/hypermutation.

    TCGA hypermutated tumours are overwhelmingly MSI-H or POLE-mutant. MSI status is not
    distributed in this clinical table, so burden stands in for it and is named as a proxy.
    """
    m = pd.read_csv(path(cohort, "mut"), sep="\t", low_memory=False)
    col = "sample" if "sample" in m.columns else m.columns[0]
    n = m.groupby(col).size().rename("n_mutations")
    EXOME_MB = 38.0
    return pd.DataFrame({"n_mutations": n, "tmb": n / EXOME_MB})
