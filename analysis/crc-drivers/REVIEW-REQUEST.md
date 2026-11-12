# Expert review request: composition adjustment and bulk scoring

**Analysis:** What explains the between-patient variation in a fetal-like programme? (TCGA COAD/READ)
**Author:** Seren Aitchison · independent, not peer reviewed
**Code:** `analysis/crc-drivers/` · **Results:** [README.md](README.md)
**Companion:** [project 1's review request](../crc-plasticity/REVIEW-REQUEST.md) — read that one first
if you only have time for one; this analysis inherits its gene lists unchanged.

This asks five questions in about twenty minutes, without reading code. A one-line answer to any
of them is useful.

---

## 0. The shortest possible summary

Scoring the same four programmes in bulk TCGA colorectal tumours, **composition — stromal,
immune and epithelial marker panels — explains 47% of the fetal-like score and
70% of the YAP score**, replicating in a
separately-scored second cohort. Adjusting for it removes the YAP–stage association entirely and
leaves a modest fetal-like–stage association that does not replicate. Nothing is prognostic.

The methodological point is the result. **The five questions below are the ones that decide
whether it stands.**

---

## 1. Is the fetal-like list epithelial enough for any of this to mean anything?

This is the same question as project 1's, and it now carries more weight, because if the list is
substantially a stromal readout then "composition explains 47% of it" is partly a statement about
the list rather than about bulk tissue.

**I have bounded this rather than argued about it.** The list was re-scored in four variants
through identical code:

| Fetal-like variant | R² from composition (COAD) | ρ with stromal panel |
|---|---:|---:|
| As published, 15 genes | 47% | +0.62 |
| Minus SPP1, S100A4, LGALS3, CD44, TIMP1 | 37% | +0.52 |
| Canonical revival markers only (ANXA1, ANXA3, CLU, TACSTD2, EMP1) | 19% | +0.41 |
| The five flagged genes alone | 45% | +0.65 |

So: the confound does not vanish with a clean list (19% for
five canonical markers), but roughly a fifth of the headline figure is attributable to five gene
choices.

**Question.** Is 19% for a five-gene canonical revival panel
what you would expect from bulk colorectal tissue, or does it suggest even that panel is not
epithelially specific?

---

## 2. Retain, remove, or analyse the five separately?

SPP1, S100A4, LGALS3, CD44 and TIMP1 are genuinely expressed by myeloid and stromal cells, and
they are also genuinely part of the published wound-response character of the fetal-like state.
Three options, and I do not know which is right:

1. **Keep them** — they are part of the programme as described in the literature, and dropping
   them to make the confound smaller would be fitting the signature to the result.
2. **Drop them** — a signature for an epithelial state should contain genes epithelium expresses
   preferentially, and these fail that test.
3. **Split the list in two** and report both, since they behave differently: in READ the flagged
   genes carry what little stage signal exists (+0.147,
   p = 0.066) and the remainder carries none
   (+0.018, p = 0.824).

**I currently do (1) and report (2) and (3) alongside it.** Is that the right default, or should
the headline use the reduced list?

---

## 3. Is one scoring method defensible across single-cell and bulk?

Both projects use Tirosh *et al.* (2016) expression-matched control scoring: bin genes by mean
expression, draw controls from the same bins, score = mean(signature) − mean(control). Project 1
applies it to log-normalised single-cell counts; this project applies the same code to bulk
log2(TPM+1).

The method was designed for single cells. In bulk it is being used mainly as a background
correction for library composition. **Is that a legitimate transfer, or should bulk use something
designed for it — ssGSEA, GSVA, singscore — and would the choice change the composition result?**
Scores are never compared across the two projects, only within a cohort.

---

## 4. Are the adjustment and the MSI proxy appropriate?

**Adjustment** is residualising each score on all three composition panels by OLS, then testing
the residual. Two concerns I can see: the relationship need not be linear, and where composition
and biology genuinely covary — a programme that really is induced by a stroma-rich environment —
this over-adjusts and removes real signal. I report both the unadjusted and adjusted value for
every test rather than choosing. **Is there a better treatment than residualisation here?**

The panels are compact canonical marker sets (15/15/7 genes), deliberately not the full ESTIMATE
signatures, and labelled as such. **Does using compact panels rather than ESTIMATE or a
deconvolution method materially change what the R² means?**

**MSI** is not in the distributed clinical table, so mutation burden above 10/Mb stands in for it.
TCGA hypermutated colorectal tumours are overwhelmingly MSI-H or POLE-mutant. **Is that proxy
acceptable for a descriptive association, and does POLE contamination matter at this n?**

---

## 5. Are the conclusions proportionate?

What I claim:

| Claimed | Not claimed |
|---|---|
| Composition is a first-order term when scoring these programmes in bulk | A specific percentage — it is 19–47% depending on the list |
| The YAP–stage association was composition | That YAP signalling is unrelated to stage |
| A fetal-like–stage association survives adjustment in COAD | That it is established — it does not replicate in READ |
| Project 1's epithelial restriction was necessary | That project 1 is therefore correct |
| No prognostic value **in this cohort, with this signature** | That the programme is prognostically irrelevant |

**Is any row in the left column reaching further than the evidence supports?** That is the
question I would most like answered, and the one I am least able to answer for myself.

---

## 6. What would change my mind, stated in advance

- If the fetal-like list is judged not epithelially specific, **the headline becomes a statement
  about signature construction**, not about bulk tissue, and I would reframe it as such rather
  than defend it.
- If residualisation is the wrong adjustment, every number in section 2 of the README is
  provisional.
- If the Tirosh method does not transfer to bulk, the composition R² values are not comparable to
  anything in the literature and should be presented as internal contrasts only.
- The READ non-replication already stands as reported. I am not looking for a way around it.

---

## 7. Reproducing

```bash
pip install -r requirements.lock
python3 scripts/download_data.py      # TCGA via the UCSC Xena GDC hub, all open access
python3 scripts/run_scoring.py
python3 scripts/run_analysis.py
python3 scripts/run_validation.py     # READ held out
python3 scripts/run_sensitivity.py    # the gene-list variants in section 1
python3 -m pytest tests/ -q           # 8 tests, synthetic fixtures, no download needed
```

---

*A blunt reply is more useful to me than a kind one. If the answer to question 1 is "no", I would
rather hear it now than after an application.*
