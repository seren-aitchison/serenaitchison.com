import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, pandas as pd, numpy as np
from itertools import combinations
from scipy.stats import wilcoxon

MIN = 20
FG, MUTE, GRID = "#f2f2f2", "#9aa0ad", "#2a2f3a"
BLUE, CYAN, AMBER, GREEN, RED = "#4d7dff", "#6ad7e5", "#ffc24b", "#4fe0a6", "#ff7a7a"
plt.rcParams.update({"font.family":"DejaVu Sans","text.color":FG,"axes.labelcolor":FG,
    "xtick.color":MUTE,"ytick.color":MUTE,"axes.edgecolor":GRID,"figure.facecolor":"none",
    "axes.facecolor":"none","savefig.facecolor":"none","font.size":9})

k_all = pd.read_csv("kul3_samples.csv"); p_all = pd.read_csv("pelka_samples.csv")
COH = [("kul3","GSE144735"),("smc","GSE132465"),("gse200997","GSE200997"),("pelka","GSE178341")]

def pairref(df, sig, prep=None):
    t = df[(df.Region=="Tumor") & (df.n_cells>=MIN)]
    if prep and "Prep" in t.columns: t = t[t.Prep==prep]
    v = t.groupby("Patient")[sig].mean().values
    return np.mean([abs(a-b) for a,b in combinations(v,2)])

def tiers(sig):
    k = k_all[k_all.Region.isin(["Tumor","Border"]) & (k_all.n_cells>=MIN)]
    w = k.pivot_table(index="Patient", columns="Region", values=sig).dropna()
    reg = (w["Tumor"]-w["Border"]).abs().mean()/pairref(k_all,sig)
    p = p_all[(p_all.Region=="Tumor") & (p_all.n_cells>=MIN) & p_all.Prep.isin(["unsorted","LiveMACS"])]
    wp = p.pivot_table(index="Patient", columns="Prep", values=sig).dropna()
    tech = (wp["unsorted"]-wp["LiveMACS"]).abs().mean()/pairref(p_all,sig,"unsorted")
    return reg*100, tech*100

fig, ax = plt.subplots(1, 3, figsize=(12.6, 4.2), gridspec_kw={"width_ratios":[1.25,1,1.05]})

# A — standardised tiers by signature
a = ax[0]; sigs = ["FETAL","YAP","ISC","DIFF"]
labels = ["Fetal-like\nstate","YAP\ntargets","Stem\n(LGR5+)","Differen-\ntiation"]
reg = [tiers(s)[0] for s in sigs]; tech = [tiers(s)[1] for s in sigs]
x = np.arange(len(sigs)); wdt = .36
a.bar(x-wdt/2, reg, wdt, color=BLUE, label="between tumour regions")
a.bar(x+wdt/2, tech, wdt, color=AMBER, label="between library preparations")
a.axhline(100, color=MUTE, ls="--", lw=1)
a.text(len(sigs)-.45, 103, "between patients", fontsize=8, color=MUTE, ha="right")
for i,(r,t) in enumerate(zip(reg,tech)):
    a.text(i-wdt/2, r+3, f"{r:.0f}", ha="center", fontsize=8.5, color=BLUE)
    a.text(i+wdt/2, t+3, f"{t:.0f}", ha="center", fontsize=8.5, color=AMBER)
a.set_xticks(x); a.set_xticklabels(labels, fontsize=8.5)
a.set_ylabel("% of between-patient difference"); a.set_ylim(0,130)
a.set_title("A  Regional vs technical vs between-patient", loc="left", fontsize=10.5, pad=10)
a.legend(frameon=False, fontsize=8, loc="upper center", bbox_to_anchor=(.5,-.17), ncol=2, labelcolor=MUTE)

# B — tumour vs matched normal, every cohort
b = ax[1]; ys, lbl = [], []
for i,(name,acc) in enumerate(COH):
    s = pd.read_csv(f"{name}_samples.csv"); s = s[s.n_cells>=MIN]
    if "Prep" in s.columns and (s.Prep=="unsorted").any(): s = s[s.Prep=="unsorted"]
    w = s.pivot_table(index="Patient", columns="Region", values="FETAL")
    if not {"Tumor","Normal"} <= set(w.columns): continue
    w = w.dropna(subset=["Tumor","Normal"]); d = w["Tumor"]-w["Normal"]
    st,pv = wilcoxon(d)
    b.scatter(d, np.full(len(d), i)+np.random.default_rng(i).normal(0,.07,len(d)),
              s=16, color=CYAN, alpha=.75, zorder=3)
    b.plot([d.median()],[i], marker="|", ms=20, color=FG, mew=2.2, zorder=4)
    lbl.append(f"{acc}\n{int((d>0).sum())}/{len(d)}  p={pv:.1e}"); ys.append(i)
b.axvline(0, color=RED, ls="--", lw=1.1)
b.set_yticks(ys); b.set_yticklabels(lbl, fontsize=8)
b.set_xlabel("Tumour − matched normal"); b.invert_yaxis()
b.set_title("B  The score validates in every cohort", loc="left", fontsize=10.5, pad=10)

# C — between-patient spread of tumour samples
c = ax[2]
for i,(name,acc) in enumerate(COH):
    s = pd.read_csv(f"{name}_samples.csv")
    t = s[(s.Region=="Tumor") & (s.n_cells>=MIN)]
    if "Prep" in t.columns and (t.Prep=="unsorted").any(): t = t[t.Prep=="unsorted"]
    v = t.groupby("Patient").FETAL.mean().values
    c.scatter(np.full(len(v), i)+np.random.default_rng(i+9).normal(0,.08,len(v)), v,
              s=14, color=BLUE, alpha=.7, zorder=3)
    c.plot([i-.22,i+.22],[v.mean()]*2, color=FG, lw=2, zorder=4)
    c.text(i, c.get_ylim()[1], f"n={len(v)}", ha="center", fontsize=7.5, color=MUTE)
c.set_xticks(range(len(COH))); c.set_xticklabels([a_ for _,a_ in COH], rotation=20, fontsize=8)
c.set_ylabel("Fetal-like score, tumour")
c.set_title("C  Patients differ, in all four cohorts", loc="left", fontsize=10.5, pad=10)

for a_ in ax:
    a_.spines[["top","right"]].set_visible(False)
    a_.grid(axis="y", color=GRID, lw=.6, alpha=.5); a_.set_axisbelow(True)
fig.suptitle("Signalling varies across a tumour; the transcriptional state it drives does not",
             x=.009, ha="left", fontsize=12.5, fontweight="bold", y=1.03)
fig.text(.009,-.07,"Four public cohorts · 511,077 cells · each tier standardised to its own cohort's between-patient difference",
         fontsize=8, color=MUTE, ha="left")
fig.tight_layout()
fig.savefig("figure2.svg", bbox_inches="tight", transparent=True)
fig.savefig("figure2.png", bbox_inches="tight", dpi=200, facecolor="#0b0b0b")
print("saved")
