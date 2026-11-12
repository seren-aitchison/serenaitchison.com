# Regional heterogeneity of a fetal-like epithelial programme in colorectal cancer

Independent computational reanalysis of public single-cell data · Python

> **Status.** Independent analysis, not peer reviewed. Every number below is generated
> from `results/tables/statistics.json` by `scripts/render_readme.py`; none is typed by
> hand. Full write-up in [MANUSCRIPT.md](MANUSCRIPT.md).

> **Frozen pending review (12 November 2026).** This analysis is not being extended. Both this project
> and [`../crc-drivers`](../crc-drivers) depend on the same unvalidated fetal-like gene list, so
> the next step is expert review of that list — see [REVIEW-REQUEST.md](REVIEW-REQUEST.md) — not
> more analysis. Changes from here will be corrections, or a re-run against a signature a
> reviewer recommends.

## Research question

Intestinal epithelium can adopt a fetal-like, regenerative transcriptional programme that
prior work associates with tolerance of cytotoxic chemotherapy. If a tumour is uneven in
this respect, a single biopsy measures one region and is taken to represent the whole lesion.

**How much of the variation in this programme lies between regions of one tumour, and how
much lies between patients?**

### What this analysis does and does not measure

Three distinctions that the wording throughout is careful about:

- It measures a **mean expression-based signature score** across epithelial cells. It is not
  a count of cells occupying a defined state, and is not described as "occupancy".
- The programme is **associated with drug tolerance in prior literature**. These are
  cross-sectional expression data with no treatment arm; nothing here measures drug response.
- The YAP set measures **target transcript abundance**, a downstream readout. It is not a
  direct measure of YAP/TAZ signalling activity.

## Quick start

```bash
pip install -r requirements.lock
python3 scripts/download_data.py       # fetches from GEO, verifies SHA-256
python3 scripts/run_analysis.py        # score all cohorts
python3 scripts/run_statistics.py      # all statistics -> results/tables/
python3 scripts/make_figures.py        # figures, read from those tables
python3 scripts/render_readme.py       # regenerate the numbers below
python3 -m pytest tests/ -q            # 16 tests, synthetic fixtures, no data needed
```

Data lands in `data/raw/` by default; set `CRC_DATA_DIR` to put it elsewhere. No path in
the package is machine-specific. The largest cohort takes about 40 minutes to score; the
other three take a few minutes each.

## Layout

```
crc/                 the analysis package
  config.py          paths and parameters, all overridable
  signatures.py      gene sets, fixed before any result was examined
  io.py              loaders for three file formats, with input validation
  scoring.py         expression-matched control scoring, with provenance
  stats.py           paired contrasts, ICC with bootstrap, leave-one-patient-out
  pipeline.py        score a cohort, write tables and run metadata
  figures.py         figures, every value read from results/tables/
scripts/             download, run, render — each does one thing
tests/               16 tests against synthetic fixtures with known structure
data/manifest.json   SHA-256 and byte size for every input file
results/             generated; gitignored except the committed summary tables
```

## Method

Scores follow Tirosh *et al.* (2016): genes are binned by mean expression, control genes are
drawn from the bins the signature genes occupy, and the score is mean(signature) −
mean(control). This removes dependence on sequencing depth and on the absolute expression of
the signature genes. Control selection is seeded and the drawn genes are recorded.

Cell scores are aggregated to the **sample** — patient × region — before any statistical
test. Cells within a sample are not independent replicates, and treating them as such would
inflate significance by orders of magnitude.

<!-- AUTO:START -->

## Cohorts

| Cohort | Cells | Epithelial | Patients | Normalisation |
|---|---:|---:|---:|---|
| GSE144735 | 27,414 | 6,168 | 6 | author-provided natural-log TPM |
| GSE132465 | 63,689 | 18,539 | 23 | author-provided natural-log TPM |
| GSE200997 | 49,859 | 49,859 | 16 | log1p(CP10K), computed here from raw counts |
| GSE178341 | 370,115 | 168,295 | 62 | log1p(CP10K), computed here from raw counts |

**511,077 cells across 4 cohorts.** Samples enter the analysis with at least 20 epithelial cells.

## Signatures

| Set | Genes | Measures | Caveat |
|---|---:|---|---|
| FETAL | 15 | Fetal-like / revival programme | A transcriptional programme associated with drug tolerance in prior literature. This analysis does not measure drug response. |
| YAP | 7 | YAP/TAZ target expression | Measures target transcript abundance, which is a downstream readout and not a direct measure of YAP/TAZ signalling activity. |
| ISC | 9 | LGR5+ intestinal stem-cell programme | — |
| DIFF | 7 | Differentiated epithelium | — |

Genes absent from a matrix are reported, not silently dropped. In GSE144735: DIFF missing MUC2.

## Primary analysis: paired within-tumour contrast

With six patients, the inference the design supports is a paired per-patient
contrast, tested by exact sign-flip permutation over all 2ⁿ assignments.

| Signature | Core − border | 95% CI | Exact p | Direction |
|---|---:|---|---:|---|
| FETAL | +0.0220 | [+0.0038, +0.0358] | 0.125 | 4/5 positive |
| YAP | +0.0052 | [-0.0194, +0.0297] | 0.750 | 3/5 positive |
| ISC | -0.0393 | [-0.0907, +0.0002] | 0.250 | 1/5 positive |
| DIFF | +0.1031 | [-0.0059, +0.2197] | 0.250 | 3/5 positive |

No signature shows a significant systematic core–border shift. For the fetal-like programme the mean difference is +0.0220 (exact p = 0.125).

> The bootstrap interval and the exact p-value disagree in sign-of-evidence here. At n = 5–6 the percentile bootstrap is anticonservative, so **the exact permutation p-value is the result**; the interval is shown for scale, not inference.

## Validity: tumour versus matched normal

| Comparison | Higher in tumour | Mean difference | Exact p |
|---|---:|---:|---:|
| Core − normal | 6/6 | +0.2502 | 0.031 |
| Border − normal | 5/5 | +0.2686 | 0.062 |

The two regions are reported separately because they differ: the core comparison and the border comparison do not have the same n or the same p-value.

## Secondary: variance decomposition (exploratory)

| Signature | ICC | 95% bootstrap CI | Leave-one-patient-out | Converged |
|---|---:|---|---|---|
| FETAL | 0.992 | [0.866, 0.997] | [0.990, 0.995] | True |
| YAP | 0.766 | [0.145, 0.818] | [0.682, 0.802] | True |
| ISC | 0.746 | [0.345, 0.958] | [0.686, 0.923] | True |
| DIFF | 0.762 | [0.000, 0.982] | [0.656, 0.922] | True |

> **What the residual is.** With two tumour samples per patient, the residual of a random-intercept model is *within-patient sample-level* variation. It contains the regional difference and sample-level technical variation together, and this design cannot separate them. It is reported as within-patient, never as between-region. The technical tier below is what gives the regional number a scale.

## Tiers: regional, technical, between-patient

Each paired difference is divided by the mean difference between two random patients **in the same cohort**, because normalisations differ between cohorts and raw magnitudes do not transfer.

| Signature | Between regions | Between library preparations |
|---|---:|---:|
| FETAL | 9% | 56% |
| YAP | 65% | 26% |
| ISC | 56% | 51% |
| DIFF | 36% | 118% |

Stability across minimum-cell thresholds:

| Min cells | Fetal-like regional | Fetal-like technical |
|---:|---:|---:|
| 0 | 11% | 56% |
| 20 | 9% | 56% |
| 50 | 10% | 56% |
| 100 | 12% | 9% |
| 200 | 12% | 9% |

## Sensitivity to control-gene selection

| Seed | Regional % | ICC |
|---:|---:|---:|
| 0 | 9.3% | 0.992 |
| 1 | 9.0% | 0.993 |
| 2 | 9.5% | 0.992 |
| 3 | 9.5% | 0.992 |
| 4 | 9.5% | 0.992 |


<!-- AUTO:END -->

## Confound checks

Two checks that a reviewer would ask for, run before being asked
(`scripts/check_confounds.py`, results in `results/tables/confounds.json`).

**Is the score reading stromal content?** Several FETAL genes (SPP1, S100A4, LGALS3, CD44,
TIMP1) are expressed by stroma and myeloid cells, so ambient RNA or doublets could make an
epithelial-restricted score track tissue composition instead. If that were happening the score
would rise with the non-epithelial fraction. It falls:

| Cohort | Spearman ρ with non-epithelial fraction | p |
|---|---:|---:|
| GSE144735 | -0.478 | 0.052 |
| GSE132465 | -0.668 | 0.000 |

This is evidence against the simplest artefact — stromal and myeloid transcripts inflating the
score in samples that contain more non-epithelial material. It is **not** evidence that the
score is composition-independent. Dilution, correlated cell fractions and opposing
contributions from different populations can produce associations of either sign, so what this
check excludes is one mechanism, not the class.

**Is it a depth artefact?** The score does correlate with epithelial cell count overall
(ρ = +0.637 and +0.648), but tumour samples have both more
epithelial cells and higher scores, so the two are confounded. Within region, in the larger
cohort, the association disappears: ρ = +0.129,
p = 0.566 across
22 tumour samples.

**But one check does fail, and it is reported rather than buried.** In GSE144735 the
core−border *score* difference tracks the core−border *cell-count* difference
(ρ = +0.900, p = 0.037,
n = 5), and within its six tumour cores the score and the
cell count are perfectly rank-correlated (ρ = +1.000).
With six samples that could be chance, and the larger cohort shows nothing comparable.

**What this establishes is coupling between the two differences, not its cause.** Sampling
depth, genuine differences in cellularity between regions, measurement uncertainty at low cell
counts, and a real biological relationship in which the region yielding more epithelial cells
also carries the higher score all predict the same correlation. This design cannot separate
them, and assessing which applies is one of the questions put to review.

Under any of those readings the result argues for caution rather than confidence. There is no
positive result to rescue — the primary contrast is already null — and if the coupling is
technical, the true biological regional variation is lower still.

## Limitations

- **One spatial axis.** Only one cohort has spatially separated tumour samples, and only two
  per tumour. A programme could vary along an axis these samples do not capture.
- **Six patients** for the regional comparison. The effect is consistent, but the cohort is
  small and the intervals are correspondingly wide.
- **The technical reference is imperfect.** Unsorted and live-enriched preparations differ in
  more than handling, and live enrichment may itself select on cell state. It is a
  conservative floor, not a pure technical replicate.
- **One cohort has no cell-type annotation**, so it contributes only to the between-patient
  and tumour-versus-normal comparisons.
- **Signature choice.** The fetal-like set is drawn from the literature rather than derived
  here. The specificity controls argue against the result being an artefact of one list, but
  a different set could change the magnitude.
- **Score, not capacity.** A cross-sectional snapshot cannot distinguish a population unable
  to enter the programme from one that has not been pushed into it. Resolving that requires
  perturbation.

## Data

All inputs are public. Accessions: GSE144735, GSE132465, GSE200997, GSE178341.
`data/manifest.json` records the SHA-256 and size of every file; `download_data.py` refuses
to proceed on a checksum mismatch.

Raw sequencing data for GSE144735 is deposited separately as E-MTAB-8410. This analysis
deliberately starts from the authors' processed matrices rather than re-quantifying.

## References

Tirosh I, *et al.* *Science* 2016. — expression-matched signature scoring
Lee H-O, *et al.* *Nat Genet* 2020. — GSE144735, GSE132465
Pelka K, *et al.* *Cell* 2021. — GSE178341
