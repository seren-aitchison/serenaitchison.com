#!/usr/bin/env python3
"""Render README.md from the generated results, so no number is typed by hand.

Everything between the AUTO markers is replaced on each run. Prose outside them
is preserved.
"""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crc.config import TABLES, MIN_CELLS
from crc.signatures import SIGNATURES, NAMES, label

ROOT = Path(__file__).resolve().parent.parent
S = json.loads((TABLES / "statistics.json").read_text())
START, END = "<!-- AUTO:START -->", "<!-- AUTO:END -->"

def fmt_p(p): return f"{p:.3f}" if p >= 0.001 else f"{p:.1e}"

lines = [START, ""]

lines += ["## Cohorts", "",
          "| Cohort | Cells | Epithelial | Patients | Normalisation |",
          "|---|---:|---:|---:|---|"]
for c, v in S["cohorts"].items():
    lines.append(f"| {v['accession']} | {v['cells']:,} | {v['epithelial']:,} | "
                 f"{v['patients_total']} | {v['normalisation']} |")
total = sum(v["cells"] for v in S["cohorts"].values())
lines += ["", f"**{total:,} cells across {len(S['cohorts'])} cohorts.** "
          f"Samples enter the analysis with at least {MIN_CELLS} epithelial cells.", ""]

lines += ["## Signatures", "",
          "| Set | Genes | Measures | Caveat |", "|---|---:|---|---|"]
for n in NAMES:
    spec = SIGNATURES[n]
    lines.append(f"| {n} | {len(spec['genes'])} | {spec['label']} | {spec['caveat'] or '—'} |")
k = json.loads((TABLES / "kul3_run.json").read_text())
missing = {s: p["missing"] for s, p in k["signatures"].items() if p["missing"]}
if missing:
    lines += ["", "Genes absent from a matrix are reported, not silently dropped. "
              f"In {k['accession']}: " +
              "; ".join(f"{s} missing {', '.join(m)}" for s, m in missing.items()) + ".", ""]

p = S["primary"]["FETAL"]
lines += ["## Primary analysis: paired within-tumour contrast", "",
          "With six patients, the inference the design supports is a paired per-patient",
          "contrast, tested by exact sign-flip permutation over all 2ⁿ assignments.", "",
          "| Signature | Core − border | 95% CI | Exact p | Direction |",
          "|---|---:|---|---:|---|"]
for n in NAMES:
    r = S["primary"][n]
    lines.append(f"| {n} | {r['mean']:+.4f} | [{r['ci_lo']:+.4f}, {r['ci_hi']:+.4f}] | "
                 f"{fmt_p(r['p_exact'])} | {r['n_positive']}/{r['n']} positive |")
lines += ["", f"No signature shows a significant systematic core–border shift. For the fetal-like "
          f"programme the mean difference is {p['mean']:+.4f} (exact p = {fmt_p(p['p_exact'])}).", "",
          "> The bootstrap interval and the exact p-value disagree in sign-of-evidence here. "
          "At n = 5–6 the percentile bootstrap is anticonservative, so **the exact permutation "
          "p-value is the result**; the interval is shown for scale, not inference.", ""]

v = S["vs_normal"]
lines += ["## Validity: tumour versus matched normal", "",
          "| Comparison | Higher in tumour | Mean difference | Exact p |", "|---|---:|---:|---:|"]
for region, r in v.items():
    name = "Core − normal" if region == "Tumor" else "Border − normal"
    lines.append(f"| {name} | {r['n_positive']}/{r['n']} | {r['mean']:+.4f} | {fmt_p(r['p_exact'])} |")
lines += ["", "The two regions are reported separately because they differ: the core comparison "
          "and the border comparison do not have the same n or the same p-value.", ""]

lines += ["## Secondary: variance decomposition (exploratory)", "",
          "| Signature | ICC | 95% bootstrap CI | Leave-one-patient-out | Converged |",
          "|---|---:|---|---|---|"]
for n in NAMES:
    r = S["variance"][n]
    lines.append(f"| {n} | {r['icc']:.3f} | [{r['ci_ci_lo']:.3f}, {r['ci_ci_hi']:.3f}] | "
                 f"[{r['lopo_min']:.3f}, {r['lopo_max']:.3f}] | {r['converged']} |")
lines += ["", "> **What the residual is.** With two tumour samples per patient, the residual of a "
          "random-intercept model is *within-patient sample-level* variation. It contains the "
          "regional difference and sample-level technical variation together, and this design "
          "cannot separate them. It is reported as within-patient, never as between-region. "
          "The technical tier below is what gives the regional number a scale.", ""]

t = S["tiers"][str(MIN_CELLS)]
lines += ["## Tiers: regional, technical, between-patient", "",
          "Each paired difference is divided by the mean difference between two random patients "
          "**in the same cohort**, because normalisations differ between cohorts and raw "
          "magnitudes do not transfer.", "",
          "| Signature | Between regions | Between library preparations |", "|---|---:|---:|"]
for n in NAMES:
    r = t[n]
    tech = f"{r['technical']*100:.0f}%" if r["technical"] == r["technical"] else "—"
    lines.append(f"| {n} | {r['regional']*100:.0f}% | {tech} |")
lines += ["", "Stability across minimum-cell thresholds:", "",
          "| Min cells | Fetal-like regional | Fetal-like technical |", "|---:|---:|---:|"]
for m, tab in S["tiers"].items():
    r = tab["FETAL"]
    tech = f"{r['technical']*100:.0f}%" if r["technical"] == r["technical"] else "—"
    lines.append(f"| {m} | {r['regional']*100:.0f}% | {tech} |")

seeds = S["seed_sensitivity"]
lines += ["", "## Sensitivity to control-gene selection", "",
          "| Seed | Regional % | ICC |", "|---:|---:|---:|"]
for s, r in seeds.items():
    lines.append(f"| {s} | {r['regional_frac']*100:.1f}% | {r['icc']:.3f} |")
lines += ["", "", END]

readme = (ROOT / "README.md").read_text()
if START in readme and END in readme:
    head = readme.split(START)[0]; tail = readme.split(END)[1]
else:
    head, tail = readme.rstrip() + "\n\n", "\n"
(ROOT / "README.md").write_text(head + "\n".join(lines) + tail)
print(f"README.md rendered from {TABLES/'statistics.json'}")
