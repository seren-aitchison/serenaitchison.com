# Expert review request: fetal-like signature and analysis design

**Analysis:** Regional heterogeneity of a fetal-like epithelial programme in colorectal cancer
**Author:** Seren Aitchison · independent, not peer reviewed
**Code:** `analysis/crc-plasticity/` · **Write-up:** [MANUSCRIPT.md](MANUSCRIPT.md)

This document exists so someone who knows this biology can check the one choice the whole
result rests on, in about twenty minutes, without reading the code.

---

## 1. What I am asking you to check

The analysis finds that a fetal-like transcriptional programme varies far less across a
colorectal tumour than between patients, while YAP target expression does the opposite.
**That conclusion depends almost entirely on which genes are in which list.** I chose the
lists from the literature; I have not validated them experimentally and cannot.

Five specific questions, in order of how much they would change the result:

1. **Is the FETAL list defensible as a fetal-like / revival programme in human colorectal
   epithelium?** Which genes would you remove, and which obvious ones have I missed?
2. **Is the YAP list a fair readout of pathway output** in this tissue, or are some of these
   genes too promiscuous to attribute to YAP/TAZ?
3. **Is DIFF a reasonable specificity control**, or does it overlap the biology under test?
4. **Does the core-versus-border contrast test what I claim?** Is "border" in GSE144735
   invasive front, or simply peripheral tissue?
5. **Is the headline interpretation over-reaching** — that the microenvironment varies across
   a tumour and drives pathway output, while the epithelial programme does not follow?

A one-line answer to any of these is useful. You do not need to read the code.

---

## 2. The gene lists, exactly as used

Taken verbatim from `crc/signatures.py`. Nothing is added or dropped at runtime; genes absent
from a matrix are reported, not silently removed.

### FETAL — fetal-like / revival regenerative programme (15 genes)

```
ANXA1  ANXA3  CLU  TACSTD2  EMP1  S100A4  SPP1  MSLN  CD44
PLAUR  TIMP1  LGALS3  SERPINE1  IFITM3  CAV1
```

**Rationale.** Intestinal epithelium can leave the LGR5+ stem programme for a fetal-like,
regenerative state during damage repair, reported as co-opted in colorectal cancer. The list
mixes canonical revival markers (CLU, ANXA1, TACSTD2) with wound-response and matrix-
interaction genes (SPP1, PLAUR, SERPINE1, TIMP1, CD44).

**My own concerns, stated so you do not have to find them:**

- **SPP1, S100A4, LGALS3, CD44, TIMP1** are expressed by myeloid and stromal cells. The
  analysis restricts to author-annotated epithelial cells, but ambient RNA and doublets would
  push the score up in samples with more stroma. **Does this list risk reading stromal content
  rather than epithelial state?**
- **CAV1 and IFITM3** are broadly expressed and may contribute noise rather than signal.
- **MSLN** is more associated with mesothelial and some tumour lineages than with intestinal
  regeneration specifically.
- The list is **not derived from data**. A defined, published fetal-like signature would be
  more defensible than my assembly, and if you can name the right one I will switch to it and
  re-run — the pipeline makes that a single-file change.

### YAP — YAP/TAZ target expression (7 genes)

```
CYR61 (CCN1)  CTGF (CCN2)  ANKRD1  AMOTL2  THBS1  AXL  TEAD1
```

**Rationale.** Canonical YAP/TAZ transcriptional targets.

**Concerns.** TEAD1 is the transcription factor partner rather than a target, so including it
is arguably a category error. THBS1 and AXL have substantial YAP-independent regulation. The
gene symbols are the older CYR61/CTGF forms because the source matrices use an older
reference. **Would you cut TEAD1, THBS1 and AXL and keep the three canonical targets?**

### ISC — LGR5+ intestinal stem cell (9 genes)

```
LGR5  ASCL2  OLFM4  SMOC2  EPHB2  RGMB  TNFRSF19  SLC12A2  AXIN2
```

### DIFF — differentiated epithelium, specificity control (7 genes)

```
KRT20  MUC2  FABP1  CEACAM7  TFF3  AQP8  GUCA2A
```

MUC2 is absent from two of the four matrices and is reported as missing rather than dropped
silently.

**No gene appears in more than one list** — there is a test asserting this.

---

## 3. What the scores are, and are not

Three distinctions I have tried to hold throughout, and would like checked:

| Claimed | Not claimed |
|---|---|
| A mean expression-based signature score | A count or fraction of cells in a defined state |
| A programme **associated with** drug tolerance in prior literature | Any measurement of drug response — these are cross-sectional data with no treatment arm |
| YAP **target transcript abundance** | YAP/TAZ signalling activity |

Scoring is Tirosh *et al.* (2016): genes binned by mean expression, controls drawn from the
same bins, score = mean(signature) − mean(control).

---

## 4. Design, in one page

**Data.** Four public cohorts, 511,077 cells. Only GSE144735 has spatially separated tumour
samples (core and border, 6 patients). GSE178341 contains several library preparations of the
same tumour, which I use as a technical reference.

**Unit of analysis.** Cell scores are aggregated to the sample (patient × region) before any
test. Cells within a sample are not independent replicates.

**Primary test.** Paired per-patient core-versus-border contrast, exact sign-flip permutation
over all 2ⁿ assignments.

**Secondary.** Variance decomposition with patient as a random effect — reported as
exploratory, with a bootstrap interval and a leave-one-patient-out range. With two samples per
patient the residual is within-patient variation that mixes regional and technical components;
this design cannot separate them, which is why the technical tier exists.

**Standardisation.** Normalisations differ between cohorts, so every paired difference is
divided by the mean difference between two random patients **in the same cohort**. Scores are
never compared across cohorts.

---

## 5. The results, so you can judge whether they follow

| Comparison | Fetal-like | YAP targets |
|---|---:|---:|
| Between two regions of one tumour | 9% | 65% |
| Between two library preparations of one tumour | 56% | 26% |
| Between patients | 100% (reference) | 100% |

Primary contrast, core versus border: **+0.0220, exact p = 0.125, 4/5 patients positive** —
no significant regional shift.

Variance decomposition, fetal-like: **ICC 0.992, 95% CI 0.866–0.997**, leave-one-patient-out
0.990–0.995. Exploratory.

Validity: higher in tumour than matched normal in every patient of every cohort with matched
tissue. Core−normal 6/6 (p = 0.031); border−normal 5/5 (p = 0.062).

Robust across control-gene seeds (9.0–9.5%) and minimum-cell thresholds from 0 to 200.

**Interpretation offered:** the microenvironment varies across a tumour and drives variation in
pathway output, while the epithelial programme at baseline does not follow — consistent with a
threshold rather than proportional relationship between pathway activity and state commitment.

**Is that over-reading?** It is the question I would most like answered.

---

## 6. What would change my mind

Stated in advance, so this is falsifiable rather than defended:

- If the FETAL list substantially measures stromal contamination, the result is an artefact
  and I would withdraw it. **I have now run this check.** The score correlates *negatively*
  with the non-epithelial fraction (ρ = -0.478 and
  -0.668), which is the wrong direction for contamination to explain
  it. I would still welcome being told the check is inadequate.
- **One check does fail.** In the multi-region cohort the core−border score difference tracks
  the core−border cell-count difference (ρ = +0.900,
  p = 0.037, n = 5).
  I read this as making the conclusion more conservative — the residual regional signal looks
  technical — but I would like that read checked.
- If "border" is not spatially meaningful in this dataset, the regional comparison is void.
- If a published, data-derived fetal-like signature gives a materially different answer, that
  signature wins. Swapping the list is a one-file change and a re-run.

---

## 7. Reproducing it

```bash
pip install -r requirements.lock
python3 scripts/download_data.py    # GEO, SHA-256 verified against a committed manifest
python3 scripts/run_analysis.py
python3 scripts/run_statistics.py
python3 scripts/make_figures.py
python3 -m pytest tests/ -q         # 16 tests, synthetic fixtures, no data download needed
```

Every statistic is written to `results/tables/statistics.json`; the figures and the README are
generated from that file, so no number in either is typed by hand.

---

*If any part of this is wrong I would rather hear it now than after an application. A blunt
reply is more useful to me than a kind one.*
