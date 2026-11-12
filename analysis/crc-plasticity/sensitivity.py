"""Does the conclusion depend on the minimum-cell threshold, or on the signature?"""
import numpy as np, pandas as pd
from itertools import combinations
k_all = pd.read_csv("kul3_samples.csv")
p_all = pd.read_csv("pelka_samples.csv")

def tiers(minc, sig="FETAL"):
    k = k_all[k_all.Region.isin(["Tumor","Border"]) & (k_all.n_cells >= minc)]
    w = k.pivot_table(index="Patient", columns="Region", values=sig).dropna()
    reg = (w["Tumor"] - w["Border"]).abs()

    p = p_all[(p_all.Region=="Tumor") & (p_all.n_cells>=minc) & p_all.Prep.isin(["unsorted","LiveMACS"])]
    wp = p.pivot_table(index="Patient", columns="Prep", values=sig).dropna()
    tech = (wp["unsorted"] - wp["LiveMACS"]).abs()

    def pairref(df, prep=None):
        t = df[(df.Region=="Tumor") & (df.n_cells>=minc)]
        if prep and "Prep" in t.columns: t = t[t.Prep==prep]
        v = t.groupby("Patient")[sig].mean().values
        return np.mean([abs(a-b) for a,b in combinations(v,2)]) if len(v)>1 else np.nan

    return (len(reg), reg.mean()/pairref(k_all), len(tech), tech.mean()/pairref(p_all,"unsorted"))

print(f"{'min cells':>9} {'n reg':>6} {'regional %':>11} {'n tech':>7} {'technical %':>12}")
for m in [0, 20, 50, 100, 200]:
    nr, r, nt, t = tiers(m)
    print(f"{m:>9} {nr:>6} {r*100:>10.1f}% {nt:>7} {t*100:>11.1f}%")

print("\nBy signature (min cells = 20):")
print(f"{'signature':>10} {'regional %':>11} {'technical %':>12}")
for sig in ["FETAL","YAP","ISC","DIFF"]:
    nr, r, nt, t = tiers(20, sig)
    print(f"{sig:>10} {r*100:>10.1f}% {t*100:>11.1f}%")
