"""Express each variance tier as a fraction of that cohort's own between-patient spread.

Raw score magnitudes are not comparable across cohorts: KUL3 and SMC are natural-log TPM,
Pelka and GSE200997 are log CP10K, and the Tirosh control correction is relative to each
dataset's own expression distribution. Standardising each paired difference by the
between-patient SD measured in the same cohort, on the same scale, makes the tiers
comparable without assuming the scales are.
"""
import numpy as np, pandas as pd
from itertools import combinations
from scipy.stats import wilcoxon
MIN_CELLS = 20
rng = np.random.default_rng(0)

def patient_sd(name, sig="FETAL", prep="unsorted"):
    s = pd.read_csv(f"{name}_samples.csv")
    t = s[(s.Region == "Tumor") & (s.n_cells >= MIN_CELLS)]
    if "Prep" in t.columns and (t.Prep == prep).any():
        t = t[t.Prep == prep]
    t = t.groupby("Patient", as_index=False)[sig].mean()
    pairs = [abs(a - b) for a, b in combinations(t[sig].values, 2)]
    return t[sig].std(), np.mean(pairs), len(t)

rows = []

# regional: KUL3 core vs border
k = pd.read_csv("kul3_samples.csv")
k = k[k.Region.isin(["Tumor","Border"]) & (k.n_cells >= MIN_CELLS)]
w = k.pivot_table(index="Patient", columns="Region", values="FETAL").dropna()
reg_diff = (w["Tumor"] - w["Border"]).abs()
sd, pair, npat = patient_sd("kul3")
rows.append(dict(tier="Regional (core vs border)", cohort="GSE144735", n=len(reg_diff),
                 mean_abs_diff=reg_diff.mean(), patient_sd=sd, patient_pair=pair,
                 frac_of_sd=reg_diff.mean()/sd, frac_of_pair=reg_diff.mean()/pair))

# technical: Pelka two preparations of the same tumour
p = pd.read_csv("pelka_samples.csv")
p = p[(p.Region=="Tumor") & (p.n_cells >= MIN_CELLS) & p.Prep.isin(["unsorted","LiveMACS"])]
wp = p.pivot_table(index="Patient", columns="Prep", values="FETAL").dropna()
tech_diff = (wp["unsorted"] - wp["LiveMACS"]).abs()
sd, pair, npat = patient_sd("pelka")
rows.append(dict(tier="Technical (two preparations)", cohort="GSE178341", n=len(tech_diff),
                 mean_abs_diff=tech_diff.mean(), patient_sd=sd, patient_pair=pair,
                 frac_of_sd=tech_diff.mean()/sd, frac_of_pair=tech_diff.mean()/pair))

# between-patient reference, every cohort
for name, acc in [("kul3","GSE144735"),("smc","GSE132465"),("gse200997","GSE200997"),("pelka","GSE178341")]:
    sd, pair, npat = patient_sd(name)
    rows.append(dict(tier="Between patients", cohort=acc, n=npat, mean_abs_diff=pair,
                     patient_sd=sd, patient_pair=pair, frac_of_sd=pair/sd, frac_of_pair=1.0))

df = pd.DataFrame(rows)
df.to_csv("standardised.csv", index=False)
pd.set_option("display.width", 200)
print(df.round(4).to_string(index=False))

print("\n--- headline ---")
r = df[df.tier.str.startswith("Regional")].iloc[0]
t = df[df.tier.str.startswith("Technical")].iloc[0]
print(f"Regional  : |core - border| = {r.mean_abs_diff:.4f} = {r.frac_of_pair*100:.0f}% of the "
      f"mean difference between two random patients in the same cohort (n={int(r.n)})")
print(f"Technical : |prep A - prep B| = {t.mean_abs_diff:.4f} = {t.frac_of_pair*100:.0f}% of the "
      f"same reference in its cohort (n={int(t.n)})")
print("\nPaired test, core vs border (is there any regional shift at all?):")
st, pv = wilcoxon(w["Tumor"] - w["Border"])
print(f"  Wilcoxon p = {pv:.3f}, median signed difference = {(w['Tumor']-w['Border']).median():+.4f}")
