# What explains the between-patient variation in the fetal-like programme?

Independent computational analysis of TCGA colorectal cancer · Python

> **Status.** Independent analysis, not peer reviewed. Every number is generated into
> `results/tables/` and read from there by the figures. Companion to
> [`../crc-plasticity`](../crc-plasticity), which this follows directly.

## The question

[Project 1](../crc-plasticity) found that a fetal-like epithelial programme varies far more
between patients than across a tumour. It could not say *why*, because six patients cannot
support that question. This project asks it in bulk TCGA tumours, where n is two orders of
magnitude larger.

**But bulk tissue reintroduces the confound project 1 controlled by restricting to annotated
epithelial cells.** A signature containing stromal genes will track tumour composition. So the
first question is not "what explains the score" but "how much of the score is composition at
all" — and every association is reported twice, before and after adjustment.

## What I found

### 1. In bulk, much of these scores is composition — and that replicates exactly

Variance in each programme score explained by stromal, immune and epithelial panels:

| Signature | TCGA-COAD (n=473) | TCGA-READ (n=167) |
|---|---:|---:|
| Fetal-like | 47% | 47% |
| **YAP targets** | **70%** | **74%** |
| Stem (LGR5+) | 9% | 10% |
| Differentiation | 17% | 15% |

The YAP signature correlates with the stromal panel at ρ = +0.81.
In bulk colorectal tissue it is largely a readout of stromal content.

This is the solid finding: it is large, and it reproduces almost exactly in an independent
cohort scored separately. It is also a direct retrospective justification for project 1's
design — that analysis restricted to annotated epithelial cells, which is why it could
attribute signal to epithelium at all.

### 2. One association survives adjustment

| Association | Unadjusted | Composition-adjusted |
|---|---|---|
| Fetal-like vs stage | ρ = +0.181, p = 9.2e-05 | ρ = +0.193, p = 3.2e-05 |
| Fetal-like in hypermutated tumours | Δ = +0.367, p = 1.3e-06 | Δ = +0.119, p = 0.002 |
| YAP vs stage | ρ = +0.106, p = 0.023 | ρ = +0.045, p = 0.340 |

The fetal-like association with stage survives adjustment; the hypermutation association
attenuates by two thirds but survives; **the YAP association with stage disappears entirely.**
It was composition. All p-values are Benjamini–Hochberg corrected across the 20 tests run.

### 3. It does not replicate, and it is not prognostic

| | COAD | READ |
|---|---|---|
| Fetal-like vs stage, adjusted | ρ = +0.193, p = 3.2e-05 | ρ = +0.077, p = 0.338 |
| Hypermutated tumours available | 84 | 7 |

The stage association is in the same direction in READ but does not reach significance
(n = 156). The hypermutation comparison cannot be tested there at all, with
only 7 hypermutated tumours.

Survival, Cox proportional hazards on 438 samples with 91 events:

| Term | HR | 95% CI | p |
|---|---:|---|---:|
| Fetal-like (per SD) | 1.017 | 0.833–1.242 | 0.868 |
| Fetal-like, composition-adjusted | 1.065 | 0.870–1.304 | 0.540 |
| Stage (per step) | 2.396 | 1.868–3.072 | 5.9e-12 |
| Age (per year) | 1.031 | 1.013–1.050 | 9.3e-04 |

The programme carries no independent prognostic information here. Stage and age behave as
they should, which is the sanity check that the model is working.

## The honest summary

The question was what explains the between-patient variation. The answer this analysis
supports is: **a large part of it, in bulk, is not biology at all — it is tumour composition**,
and that is reproducible across two cohorts. What remains after adjustment is a modest
association with stage that does not replicate in the smaller independent cohort, and no
prognostic value.

That is a negative result for the original question and a positive one for the methodological
point. The methodological point is the more useful of the two, because it applies to anyone
scoring these programmes in bulk tissue.

## Method notes

- Scoring is the same expression-matched control method as project 1, imported from it
  unchanged so the two analyses measure the same thing.
- Composition panels are compact canonical marker sets, deliberately **not** the full
  ESTIMATE signatures, and are labelled as such. No gene appears in two sets.
- Adjustment is by residualising each score on all three composition panels.
- Mutation burden stands in for MSI status, which is not in the distributed clinical table.
  TCGA hypermutated colorectal tumours are overwhelmingly MSI-H or POLE-mutant, but it is a
  proxy and is named as one.
- Associations were identified in COAD and tested in READ, so READ is genuinely held out.

## Limitations

- **TMB is a proxy for MSI**, not a measurement of it.
- **The composition panels are compact**, not the full published signatures. A different panel
  would change the exact R², though the direction and scale are unlikely to move.
- **READ is small** (n = 167), so failure to replicate is weak evidence of absence
  rather than evidence of absence.
- **Residualising on composition is a linear adjustment** of a relationship that need not be
  linear, and over-adjustment is possible where composition and biology genuinely covary.
- Bulk expression cannot separate a programme expressed by tumour cells from the same
  programme expressed by neighbouring cells. That is the limitation project 1 avoided and
  this one must live with.

## Reproducing

```bash
pip install -r requirements.lock
python3 scripts/download_data.py      # TCGA via the Xena GDC hub
python3 scripts/run_scoring.py        # score COAD and READ
python3 scripts/run_analysis.py       # confound, associations, survival
python3 scripts/run_validation.py     # held-out replication in READ
python3 scripts/make_figures.py
```

## Data

TCGA-COAD and TCGA-READ, via the UCSC Xena GDC hub: `star_tpm`, `clinical`, `survival`,
`somaticmutation_wxs`. All open-access.
