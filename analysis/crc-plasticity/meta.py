"""Three-tier variance comparison across cohorts.

The question is whether the fetal-like programme varies across a tumour. A variance
ratio means nothing without a scale, so it is placed between two references measured
the same way in the same cells:

  technical   Pelka: two library preparations (unsorted, LiveMACS) from one tumour
  regional    KUL3: tumour core vs tumour border from one tumour
  patient     every cohort: tumour samples across patients

If regional variance sits near the technical floor while between-patient variance is
far above it, the score has dynamic range and the regional axis is genuinely flat.
"""
import numpy as np, pandas as pd, statsmodels.formula.api as smf, warnings
from scipy.stats import wilcoxon
warnings.filterwarnings("ignore")

SIGS = ["FETAL", "YAP", "ISC", "DIFF"]
MIN_CELLS = 20

def icc(df, value, group):
    """Between-group share of variance from a random-intercept model."""
    d = df[[value, group]].dropna()
    if d[group].nunique() < 3 or len(d) < 6:
        return np.nan, np.nan, np.nan
    m = smf.mixedlm(f"{value} ~ 1", d, groups=d[group]).fit(reml=True)
    vb = float(m.cov_re.iloc[0, 0]); vw = float(m.scale)
    return vb, vw, vb / (vb + vw) if (vb + vw) > 0 else np.nan

rows = []

# ---- tier 1: technical replicates (Pelka) -------------------------------
try:
    pel = pd.read_csv("pelka_samples.csv")
    pel = pel[(pel.Region == "Tumor") & (pel.n_cells >= MIN_CELLS)]
    pel = pel[pel.Prep.isin(["unsorted", "LiveMACS"])]
    paired = pel.groupby("Patient").filter(lambda g: g.Prep.nunique() == 2)
    print(f"[technical] {paired.Patient.nunique()} patients with both preparations")
    for s in SIGS:
        vb, vw, i = icc(paired, s, "Patient")
        rows.append(dict(tier="technical", cohort="GSE178341", sig=s,
                         between=vb, within=vw, icc=i, n=paired.Patient.nunique()))
    w = paired.pivot_table(index="Patient", columns="Prep", values="FETAL")
    print(f"[technical] mean |unsorted - LiveMACS| = {(w['unsorted']-w['LiveMACS']).abs().mean():.4f}")
except FileNotFoundError:
    print("[technical] pelka_samples.csv not present yet")

# ---- tier 2: spatial regions within a tumour (KUL3) ---------------------
kul = pd.read_csv("kul3_samples.csv")
tum = kul[kul.Region.isin(["Tumor", "Border"]) & (kul.n_cells >= MIN_CELLS)]
print(f"\n[regional] {tum.Patient.nunique()} patients with both tumour regions")
for s in SIGS:
    vb, vw, i = icc(tum, s, "Patient")
    rows.append(dict(tier="regional", cohort="GSE144735", sig=s,
                     between=vb, within=vw, icc=i, n=tum.Patient.nunique()))
w = tum.pivot_table(index="Patient", columns="Region", values="FETAL")
print(f"[regional] mean |core - border| = {(w['Tumor']-w['Border']).abs().mean():.4f}")

# ---- tier 3: between patients, every cohort -----------------------------
print("\n[patient] tumour-sample spread per cohort")
spread = []
for name, acc in [("kul3","GSE144735"), ("smc","GSE132465"),
                  ("gse200997","GSE200997"), ("pelka","GSE178341")]:
    try:
        s = pd.read_csv(f"{name}_samples.csv")
    except FileNotFoundError:
        continue
    t = s[(s.Region == "Tumor") & (s.n_cells >= MIN_CELLS)]
    if "Prep" in t.columns:
        t = t[t.Prep == "unsorted"] if (t.Prep == "unsorted").any() else t
    t = t.groupby("Patient", as_index=False)[SIGS].mean()
    spread.append(dict(cohort=acc, n_patients=len(t),
                       **{f"{s_}_sd": t[s_].std() for s_ in SIGS}))
    print(f"  {acc:11} patients={len(t):3}  FETAL SD={t.FETAL.std():.3f}  "
          f"range=[{t.FETAL.min():.3f}, {t.FETAL.max():.3f}]")
pd.DataFrame(spread).to_csv("patient_spread.csv", index=False)

# ---- tumour vs matched normal, as a validity check ----------------------
print("\n[validity] tumour vs matched normal")
val = []
for name, acc in [("kul3","GSE144735"), ("smc","GSE132465"),
                  ("gse200997","GSE200997"), ("pelka","GSE178341")]:
    try:
        s = pd.read_csv(f"{name}_samples.csv")
    except FileNotFoundError:
        continue
    s = s[s.n_cells >= MIN_CELLS]
    if "Prep" in s.columns and (s.Prep == "unsorted").any():
        s = s[s.Prep == "unsorted"]
    p = s.pivot_table(index="Patient", columns="Region", values="FETAL")
    if not {"Tumor","Normal"} <= set(p.columns):
        continue
    p = p.dropna(subset=["Tumor","Normal"])
    d = p["Tumor"] - p["Normal"]
    st, pv = wilcoxon(d)
    val.append(dict(cohort=acc, n=len(d), higher=int((d>0).sum()),
                    median_diff=d.median(), p=pv))
    print(f"  {acc:11} {int((d>0).sum())}/{len(d)} patients higher in tumour, "
          f"median diff={d.median():+.3f}, Wilcoxon p={pv:.2e}")
pd.DataFrame(val).to_csv("validity.csv", index=False)

out = pd.DataFrame(rows)
out.to_csv("variance_tiers.csv", index=False)
print("\n[tiers] variance components")
print(out.round(4).to_string(index=False))
