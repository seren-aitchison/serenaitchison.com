#!/usr/bin/env python3
"""All statistics, written to results/tables/statistics.json.

Primary   paired per-patient core-vs-border contrast, exact sign-flip permutation
Secondary variance decomposition with a bootstrap interval, reported as exploratory
Sensitivity leave-one-patient-out, cell-count thresholds, control-gene seeds
"""
import sys, json, itertools, numpy as np, pandas as pd
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from crc import config, stats
from crc.signatures import NAMES, label
from crc.pipeline import run_cohort

T = config.TABLES
def load(c):
    p = T / f"{c}_samples.csv"
    return pd.read_csv(p) if p.exists() else None

out = {"params": config.params(), "cohorts": {}}
MIN = config.MIN_CELLS

# ---------------------------------------------------------------- primary
kul = load("kul3")
tum = kul[kul.Region.isin(["Tumor", "Border"]) & (kul.n_cells >= MIN)]
out["primary"] = {}
for sig in NAMES:
    r = stats.paired_contrast(tum, sig, "Tumor", "Border", n_boot=config.N_BOOT)
    out["primary"][sig] = r
    print(f"[primary] {sig:6} core-border mean={r['mean']:+.4f} "
          f"95% CI [{r['ci_lo']:+.4f}, {r['ci_hi']:+.4f}] exact p={r['p_exact']:.4f} "
          f"({r['n_positive']}/{r['n']} positive)")

# tumour vs matched normal, each region separately — these differ and must be stated
out["vs_normal"] = {}
for region in ["Tumor", "Border"]:
    sub = kul[kul.Region.isin([region, "Normal"]) & (kul.n_cells >= MIN)]
    r = stats.paired_contrast(sub, "FETAL", region, "Normal", n_boot=config.N_BOOT)
    out["vs_normal"][region] = r
    print(f"[vs normal] {region:6} vs Normal: {r['n_positive']}/{r['n']} higher, "
          f"mean={r['mean']:+.4f}, exact p={r['p_exact']:.4f}")

# ---------------------------------------------------------------- secondary
out["variance"] = {}
for sig in NAMES:
    base = stats.icc(tum, sig)
    ci = stats.icc_interval(tum, sig, n_boot=500)
    lopo = stats.leave_one_patient_out(tum, sig)
    out["variance"][sig] = dict(**base, **{f"ci_{k}": v for k, v in ci.items()},
                                lopo_min=float(lopo.icc.min()), lopo_max=float(lopo.icc.max()),
                                lopo=lopo.to_dict("records"))
    print(f"[variance] {sig:6} ICC={base['icc']:.3f} "
          f"95% CI [{ci['ci_lo']:.3f}, {ci['ci_hi']:.3f}] "
          f"LOPO [{lopo.icc.min():.3f}, {lopo.icc.max():.3f}] converged={base['converged']}")

# ---------------------------------------------------------------- tiers
def tier_table(min_cells):
    res = {}
    k = kul[kul.Region.isin(["Tumor","Border"]) & (kul.n_cells >= min_cells)]
    pel = load("pelka")
    for sig in NAMES:
        ref_k = stats.between_patient_reference(k[k.Region == "Tumor"], sig)
        w = k.pivot_table(index="Patient", columns="Region", values=sig).dropna()
        regional = float((w["Tumor"] - w["Border"]).abs().mean() / ref_k) if ref_k else np.nan
        technical = np.nan
        if pel is not None:
            p = pel[(pel.Region == "Tumor") & (pel.n_cells >= min_cells)
                    & pel.Prep.isin(["unsorted", "LiveMACS"])]
            wp = p.pivot_table(index="Patient", columns="Prep", values=sig).dropna()
            ref_p = stats.between_patient_reference(
                pel[(pel.Region == "Tumor") & (pel.n_cells >= min_cells) & (pel.Prep == "unsorted")], sig)
            if len(wp) and ref_p:
                technical = float((wp["unsorted"] - wp["LiveMACS"]).abs().mean() / ref_p)
        res[sig] = dict(regional=regional, technical=technical,
                        n_regional=int(len(w)), n_technical=int(len(wp)) if pel is not None else 0)
    return res

out["tiers"] = {str(m): tier_table(m) for m in [0, 20, 50, 100, 200]}
print("\n[tiers] % of between-patient difference (min cells = 20)")
for sig, v in out["tiers"]["20"].items():
    t = f"{v['technical']*100:.0f}%" if np.isfinite(v["technical"]) else "n/a"
    print(f"    {sig:6} regional {v['regional']*100:5.1f}%   technical {t:>6}")

# ---------------------------------------------------------------- seed sensitivity
seeds = {}
for seed in [0, 1, 2, 3, 4]:
    s, _, _ = run_cohort("kul3", seed=seed)
    t = s[s.Region.isin(["Tumor","Border"]) & (s.n_cells >= MIN)]
    r = stats.paired_contrast(t, "FETAL", "Tumor", "Border", n_boot=200)
    ref = stats.between_patient_reference(t[t.Region == "Tumor"], "FETAL")
    seeds[seed] = dict(mean_abs=r["mean_abs"], regional_frac=r["mean_abs"]/ref, icc=stats.icc(t, "FETAL")["icc"])
out["seed_sensitivity"] = seeds
print("\n[seeds] control-gene selection")
for s, v in seeds.items():
    print(f"    seed {s}: regional {v['regional_frac']*100:.1f}%  ICC {v['icc']:.3f}")

# cohort-level descriptives, generated not typed
desc = {}
for c in ["kul3", "smc", "gse200997", "pelka"]:
    s = load(c)
    if s is None: continue
    meta = json.loads((T / f"{c}_run.json").read_text())
    t = s[(s.Region == "Tumor") & (s.n_cells >= MIN)]
    if "Prep" in t.columns and (t.Prep == "unsorted").any(): t = t[t.Prep == "unsorted"]
    pm = t.groupby("Patient").FETAL.mean()
    desc[c] = dict(accession=meta["accession"], cells=meta["n_cells_matrix"],
                   epithelial=meta["n_epithelial"], samples=meta["n_samples"],
                   patients_total=int(s.Patient.nunique()), tumour_patients=int(len(pm)),
                   fetal_sd=float(pm.std()), fetal_min=float(pm.min()), fetal_max=float(pm.max()),
                   low_cell_samples=int((s.n_cells < 100).sum()),
                   normalisation=meta["normalisation"])
    sub = s[s.n_cells >= MIN]
    if "Prep" in sub.columns and (sub.Prep == "unsorted").any(): sub = sub[sub.Prep == "unsorted"]
    r = stats.paired_contrast(sub, "FETAL", "Tumor", "Normal", n_boot=config.N_BOOT)
    desc[c]["vs_normal"] = r
out["cohorts"] = desc

(T / "statistics.json").write_text(json.dumps(out, indent=2, default=float))
print(f"\nwritten: {T/'statistics.json'}")
