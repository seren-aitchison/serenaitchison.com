# Signalling varies across colorectal tumours; the transcriptional state it drives does not

**Seren Aitchison**

*Independent analysis of public data. Not peer reviewed.*

---

## Abstract

Colorectal cancer cells can adopt a fetal-like, wound-healing transcriptional state that is
slow-cycling and tolerant of cytotoxic chemotherapy. Whether the tumour is uniform in this
respect matters clinically, because a single biopsy is taken to represent a whole lesion.
Using four public single-cell cohorts (511,077 cells, 101 patients), I asked how much of the
variation in this programme lies between regions of one tumour versus between patients.
Occupancy of the fetal-like state is almost entirely a patient-level property: across tumour
core and border it gives an intraclass correlation of 0.99, and the mean difference between
two regions of one tumour is 9% of the mean difference between two patients — smaller than
the difference between two library preparations of the same tumour (56%). The pattern is
specific rather than a property of the method: YAP/TAZ target expression, the signalling arm
of the same programme, varies regionally at 64% of the between-patient difference, well above
its own technical floor of 26%. Signalling varies across a tumour; the transcriptional state
it is thought to drive does not. These data cannot distinguish a population unable to enter
the drug-tolerant state from one that has not been pushed into it, which is the distinction
that matters for treatment response and which requires perturbation to resolve.

---

## Introduction

Intestinal epithelium can abandon the canonical LGR5+ stem-cell programme for a fetal-like,
regenerative state during wound healing. That state is YAP/TAZ-associated, slow-cycling, and
tolerant of cytotoxic chemotherapy, which preferentially kills rapidly dividing cells.
Colorectal cancer appears to co-opt the same programme, and the resulting drug-tolerant
population need not be a pre-existing resistant clone: cells can enter the state, persist
through treatment, and resume proliferation afterwards.

If the capacity to make that switch is unevenly distributed across a tumour, then a diagnostic
biopsy samples one region's capacity and generalises it to the whole lesion. This is a
sampling problem with direct clinical consequences, and it is the motivation for multi-region
studies of tumour plasticity.

Public single-cell data can address part of this question before any new sample is collected.
Here I ask a deliberately narrow version of it: **how much of the variation in fetal-like
programme occupancy lies within a tumour, and how much lies between patients?**

---

## Methods

### Data

Four public colorectal single-cell cohorts, all processed by their original authors; nothing
was re-aligned or re-quantified here.

| Cohort | Accession | Cells | Patients | Structure used |
|---|---|---:|---:|---|
| KUL3 | GSE144735 | 27,414 | 6 | tumour core, tumour border, matched normal |
| SMC | GSE132465 | 63,689 | 23 | tumour, matched normal |
| Lee *et al.* | GSE200997 | 49,859 | 16 | tumour, matched normal |
| Pelka *et al.* | GSE178341 | 370,115 | 60 | tumour, matched normal, **multiple library preparations per tumour** |

KUL3 is the only cohort with spatially separated samples from one tumour. GSE178341 contains
several library preparations of the same tumour tissue — unsorted and live-cell-enriched —
which provides a technical reference measured in the same way as the biological comparisons.
GSE178341 preparations enriched for CD45+ cells were excluded, since they deplete epithelium
by design.

### Signatures

Four gene sets were fixed in code (`sigs.py`) **before any result was examined**, to prevent
selecting genes that produce a desired answer:

- **FETAL** (15 genes) — fetal-like / revival regenerative programme
- **YAP** (7) — canonical YAP/TAZ transcriptional targets
- **ISC** (9) — LGR5+ intestinal stem-cell programme
- **DIFF** (7) — differentiated enterocyte and goblet markers, as a specificity control

37 of 38 genes were present in the KUL3 and SMC matrices (MUC2 absent); all were present in
GSE200997.

### Scoring

Scores follow Tirosh *et al.* (2016). Genes are binned into 25 bins by mean expression; for
each signature, 50 control genes are drawn from each occupied bin; the score is
mean(signature) − mean(control). This removes dependence on sequencing depth and on how
highly expressed the signature genes happen to be. Control selection is seeded (`SEED = 0`).

KUL3 and SMC matrices are the authors' natural-log TPM. GSE200997 and GSE178341 are raw counts,
normalised here to log1p(CP10K). **Scores are therefore never compared across cohorts.** Every
reported quantity is a within-cohort ratio, which this design supports; absolute values are not
comparable between cohorts.

### Analysis

Cells were restricted to those the original authors annotated as epithelial, except in
GSE200997 where no cell-type annotation is supplied (noted as a limitation).

Cell-level scores were aggregated to the **sample** — patient × region, or patient ×
preparation — because the sample is the unit at which a regional claim is made. Treating
cells as independent replicates would inflate significance by orders of magnitude. Samples
with fewer than 20 epithelial cells were excluded; results are reported across thresholds
from 0 to 200.

Variance components come from random-intercept models with patient as the grouping factor.
To compare tiers measured on different scales, each paired difference was standardised by the
mean absolute difference between two random patients **within the same cohort**, on the same
scale.

---

## Results

### The score behaves as the biology predicts

Before asking anything about regions, the score was checked against what is already known.
The fetal-like programme is elevated in tumour over matched normal epithelium in **every
patient of every cohort that contains matched normal tissue**: 6/6 (GSE144735, p = 0.031),
8/8 (GSE132465, p = 0.0078), 7/7 (GSE200997, p = 0.016) and 30/32 (GSE178341, p = 6.5 × 10⁻⁹;
Wilcoxon signed-rank throughout). At cell level it anticorrelates with the stem programme
(r = −0.34), as expected if the two are alternative states.

### Occupancy of the fetal-like state is a patient-level property

In KUL3, the only cohort with spatially separated tumour samples, 99% of the variance in
fetal-like score lies between patients and 1% between tumour core and border
(ICC = 0.990). The mean absolute core−border difference is 0.026 against a between-patient
standard deviation of 0.230. There is no significant systematic shift between core and border
(Wilcoxon p = 0.125).

Between patients, the spread is substantial in all four cohorts (SD 0.087–0.230; Figure 2C).

### Regional variation is below the technical floor

A variance ratio means little without a scale. Standardising each paired difference by the
between-patient difference in the same cohort:

| Comparison | Signature | % of between-patient difference |
|---|---|---:|
| Two regions of one tumour | Fetal-like | **9%** |
| Two library preparations of one tumour | Fetal-like | **56%** |
| Two regions of one tumour | YAP targets | **64%** |
| Two library preparations of one tumour | YAP targets | **26%** |

The core−border difference in the fetal-like programme is smaller than the difference between
two library preparations of the same tissue. The regional figure is stable across minimum-cell
thresholds from 0 to 200 cells (9–13%). The technical figure falls from 56% to 9% at thresholds
above 100 cells, as expected when sampling noise is driven by low-cell samples — so the honest
statement is that **regional variation in this programme is at or below the technical floor**.

### Signalling is regional; state is not

The specificity control is what makes this more than a null result. The same analysis applied
to YAP/TAZ targets — the signalling arm of the same programme — gives the opposite pattern:
regional variation of 64% against a technical floor of 26%. The stem programme sits near its
floor (57% vs 51%) and the differentiation control below it (36% vs 118%).

So the method clearly can detect regional variation; it detects it in signalling, in the same
cells, in the same samples. What it does not detect is regional variation in the transcriptional
state that signalling is thought to drive.

---

## Discussion

Two regions of one colorectal tumour resemble each other more closely, in fetal-like programme
occupancy, than two preparations of the same tissue do. Meanwhile YAP target expression varies
across the same regions well above its technical floor.

The straightforward reading is that the microenvironment varies across a tumour and drives
corresponding variation in signalling, while the epithelial transcriptional state at baseline
does not follow. That would be consistent with a threshold or buffering relationship between
pathway activity and state commitment, rather than a proportional one — a cell may need
sustained signalling, or an additional insult, before it commits.

**The limitation is the point.** Occupancy is not capacity. A snapshot cannot distinguish a
population that *cannot* enter the drug-tolerant state from one that simply has not been
pushed into it, and the second is what determines treatment response. No further reanalysis of
observational data resolves that; it requires perturbation.

These data do generate a testable prediction. If signalling varies regionally while resting
state does not, then regional differences in *capacity* should emerge under perturbation —
chemotherapy, or restoration of stromal signals in co-culture — while remaining absent at
baseline. Multi-region patient-derived organoids, perturbed and read out at single-cell
resolution, would test exactly this.

---

## Limitations

- **One spatial axis.** Only KUL3 has spatially separated tumour samples, and only two per
  tumour: core and border. This is not a survey of a tumour, and a programme could vary along
  an axis these samples do not capture.
- **Six patients** for the regional comparison. The effect is large and consistent, but the
  cohort is small.
- **The technical reference is imperfect.** Unsorted and live-enriched preparations differ in
  more than pipetting; live enrichment may select on cell state. It is a conservative floor
  rather than a pure technical replicate.
- **GSE200997 has no cell-type annotation**, so its scores are over all cells and it
  contributes only to the between-patient and tumour-versus-normal comparisons.
- **Signature choice.** The fetal-like gene set is drawn from the literature, not derived here.
  A different set could give a different magnitude, though the specificity controls argue
  against the result being an artefact of one list.
- **Occupancy is not capacity**, as above.
- Annotation, region assignment and quantification are the original authors'. Errors there
  propagate here.

---

## Data and code

All data are public. Accessions: GSE144735, GSE132465, GSE200997, GSE178341.

Analysis code, fixed signatures, pinned seeds and recorded package versions:
`analysis/crc-plasticity/` at <https://github.com/seren-aitchison/serenaitchison.com>.
The full pipeline runs from the raw accessions; the heaviest cohort takes about 40 minutes,
the rest a few minutes each.

## References

Tirosh I, *et al.* Dissecting the multicellular ecosystem of metastatic melanoma by single-cell
RNA-seq. *Science* 2016.

Lee H-O, *et al.* Lineage-dependent gene expression programs influence the immune landscape of
colorectal cancer. *Nat Genet* 2020. (GSE144735, GSE132465)

Pelka K, *et al.* Spatially organized multicellular immune hubs in human colorectal cancer.
*Cell* 2021. (GSE178341)
