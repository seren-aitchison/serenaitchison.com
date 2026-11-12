# Regional variation in the fetal-like programme in colorectal cancer

An independent reanalysis of public single-cell data, asking whether the
wound-healing/fetal-like programme that confers chemotherapy tolerance is
distributed evenly across a colorectal tumour.

## Data

| | |
|---|---|
| Accession | [GSE144735](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE144735) (KUL3 cohort) |
| Content | 27,414 cells, 6 patients, 3 matched regions each: tumour core, tumour border, adjacent normal |
| Matrix | Author-processed natural-log TPM, 33,694 genes |
| Cells used | 6,168 annotated as epithelial — the compartment the programmes describe |

Nothing was re-aligned or re-quantified; this starts from the authors' processed matrix
and their cell-type annotation.

## Method

Signatures were fixed in `sigs.py` **before** any result was looked at, to avoid
choosing genes that produce the answer:

- **FETAL** — fetal-like / revival regenerative programme (15 genes)
- **YAP** — canonical YAP/TAZ targets, the pathway driving it (7)
- **ISC** — LGR5+ intestinal stem-cell programme, the state cells leave (9)
- **DIFF** — differentiated enterocyte markers, as a specificity control (6 of 7; MUC2 absent)

Scoring follows Tirosh et al. (2016): genes are binned by mean expression, control genes
are drawn from the same bins, and the score is mean(signature) − mean(control). That removes
dependence on sequencing depth and on how highly expressed the signature genes happen to be.

Variance components come from a mixed model with patient as a random effect, fitted at the
**sample** level (patient × region), because the sample is the unit at which a regional claim
is made. Treating cells as replicates would inflate significance enormously.

## Result

Across the two tumour regions, the fetal-like programme is almost entirely a patient-level
property:

| Signature | Between patients | Between regions | ICC |
|---|---:|---:|---:|
| **Fetal-like** | 0.0544 | 0.0005 | **0.990** |
| Differentiation | 0.0430 | 0.0133 | 0.764 |
| Stem (LGR5+) | 0.0054 | 0.0024 | 0.689 |
| YAP targets | 0.0008 | 0.0009 | 0.461 |

Mean |core − border| difference is 0.029 against a between-patient SD of 0.230 — roughly
eightfold. The result survives dropping every sample with fewer than 100 epithelial cells
(ICC 0.991, 5 patients).

The score behaves as the biology predicts: it is elevated in tumour over matched normal in
6/6 patients (Wilcoxon p = 0.031) and anticorrelates with the stem programme at cell level
(r = −0.34).

## The limitation that matters

This measures **state occupancy, not capacity**. A snapshot cannot distinguish a population
that cannot enter the drug-tolerant state from one that simply has not been pushed into it.
Establishing that difference needs perturbation — which is the argument for doing the
organoid experiment rather than more reanalysis.

Other limitations: 6 patients; only two tumour regions, so one spatial axis; three samples
with fewer than 100 epithelial cells; core/border assignment is the authors'.

## Reproducing

```bash
pip install numpy pandas scipy statsmodels matplotlib
# download the matrix and annotation from GSE144735 into ../../crc-data/
python3 pass1.py      # cell order and per-gene means, for control binning
python3 pass2.py      # extract signature and control gene rows
python3 score.py      # score cells, aggregate per sample
python3 variance.py   # variance components and tests
python3 figure.py     # figure
```

`pass1.py` streams the 257 MB matrix rather than loading it, and takes about 80 seconds.
Seeds are fixed (`SEED = 0` in `pass2.py`), so control gene selection is deterministic.
