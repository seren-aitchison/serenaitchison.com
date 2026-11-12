"""Variance decomposition: does the fetal-like programme vary more between patients
or between regions within a patient?"""
import numpy as np, pandas as pd, statsmodels.formula.api as smf, warnings
warnings.filterwarnings("ignore")

s = pd.read_csv("sample_scores.csv")
tum = s[s.Class.isin(["Tumor", "Border"])].copy()   # the two tumour regions

print("=== 1. Paired core vs border, within patient ===")
p = tum.pivot(index="Patient", columns="Class", values="FETAL")
p["diff"] = p["Tumor"] - p["Border"]
print(p.round(3).to_string())
print(f"\nmean |core-border| difference : {p['diff'].abs().mean():.3f}")
print(f"between-patient SD (tumour core): {tum[tum.Class=='Tumor'].FETAL.std():.3f}")
print(f"between-patient range (core)    : {tum[tum.Class=='Tumor'].FETAL.min():.3f} to {tum[tum.Class=='Tumor'].FETAL.max():.3f}")

print("\n=== 2. Variance components, tumour regions only (n=12 samples, 6 patients) ===")
for sig in ["FETAL", "YAP", "ISC", "DIFF"]:
    m = smf.mixedlm(f"{sig} ~ 1", tum, groups=tum["Patient"]).fit(reml=True)
    vp = float(m.cov_re.iloc[0, 0]); vr = float(m.scale)
    icc = vp / (vp + vr) if (vp + vr) > 0 else np.nan
    print(f"  {sig:6} between-patient var={vp:.4f}  within-patient var={vr:.4f}  ICC={icc:.3f}")

print("\n=== 3. Tissue state effect, all 18 samples ===")
s["Class"] = pd.Categorical(s.Class, ["Normal", "Border", "Tumor"])
m = smf.mixedlm("FETAL ~ C(Class)", s, groups=s["Patient"]).fit(reml=False)
print(m.summary().tables[1].to_string())

print("\n=== 4. Is tumour > normal in every patient? ===")
w = s.pivot(index="Patient", columns="Class", values="FETAL")
w["core_minus_normal"] = w["Tumor"] - w["Normal"]
w["border_minus_normal"] = w["Border"] - w["Normal"]
print(w.round(3).to_string())
from scipy.stats import wilcoxon
for col in ["core_minus_normal", "border_minus_normal"]:
    st, pv = wilcoxon(w[col])
    print(f"  {col}: all positive = {bool((w[col] > 0).all())}, Wilcoxon p = {pv:.4f} (n=6)")

print("\n=== 5. Sensitivity: drop samples with <100 epithelial cells ===")
big = tum[tum.n_cells >= 100]
print(f"  samples retained: {len(big)} of {len(tum)}  patients: {big.Patient.nunique()}")
if big.Patient.nunique() >= 3:
    m = smf.mixedlm("FETAL ~ 1", big, groups=big["Patient"]).fit(reml=True)
    vp = float(m.cov_re.iloc[0, 0]); vr = float(m.scale)
    print(f"  between-patient var={vp:.4f}  within-patient var={vr:.4f}  ICC={vp/(vp+vr):.3f}")
