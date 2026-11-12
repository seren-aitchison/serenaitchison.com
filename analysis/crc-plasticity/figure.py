import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, pandas as pd, numpy as np

s = pd.read_csv("sample_scores.csv")
tum = s[s.Class.isin(["Tumor","Border"])]
p = tum.pivot(index="Patient", columns="Class", values="FETAL")
w = s.pivot(index="Patient", columns="Class", values="FETAL")

FG, MUTE, GRID = "#f2f2f2", "#9aa0ad", "#2a2f3a"
BLUE, CYAN, AMBER, GREEN = "#4d7dff", "#6ad7e5", "#ffc24b", "#4fe0a6"
plt.rcParams.update({"font.family":"DejaVu Sans","text.color":FG,"axes.labelcolor":FG,
    "xtick.color":MUTE,"ytick.color":MUTE,"axes.edgecolor":GRID,"figure.facecolor":"none",
    "axes.facecolor":"none","savefig.facecolor":"none","font.size":9})

fig, ax = plt.subplots(1, 3, figsize=(12.2, 4.1), gridspec_kw={"width_ratios":[1.15,1,0.95]})

# A: core vs border, paired per patient
a = ax[0]
# nudge labels apart where patients sit close together
lab_y, used = {}, []
for pat in p.sort_values("Border", ascending=False).index:
    yv = p.loc[pat, "Border"]
    while any(abs(yv - u) < 0.028 for u in used):
        yv -= 0.028
    used.append(yv); lab_y[pat] = yv
for pat in p.index:
    a.plot([0,1], [p.loc[pat,"Tumor"], p.loc[pat,"Border"]], "-o", color=BLUE, ms=5, lw=1.6, alpha=.9)
    a.annotate(pat, (1.05, lab_y[pat]), fontsize=7.5, color=MUTE, va="center")
a.set_xlim(-0.25, 1.55); a.set_xticks([0,1]); a.set_xticklabels(["Tumour core","Tumour border"])
a.set_ylabel("Fetal-like programme score"); a.set_title("A  Within a tumour", loc="left", fontsize=10.5, pad=10)
a.axhline(0, color=GRID, lw=.8, zorder=0)
a.text(.02,.03, f"mean |core − border| = {(p['Tumor']-p['Border']).abs().mean():.3f}\nbetween-patient SD = {tum[tum.Class=='Tumor'].FETAL.std():.3f}",
       transform=a.transAxes, fontsize=8, color=MUTE, va="bottom")

# B: variance components
b = ax[1]
vc = {"FETAL":(0.0544,0.0005),"DIFF":(0.0430,0.0133),"ISC":(0.0054,0.0024),"YAP":(0.0008,0.0009)}
names = list(vc); between = [vc[k][0] for k in names]; within = [vc[k][1] for k in names]
tot = [a_+b_ for a_,b_ in zip(between,within)]
fb = [x/t*100 for x,t in zip(between,tot)]; fw = [x/t*100 for x,t in zip(within,tot)]
y = np.arange(len(names))
b.barh(y, fb, color=BLUE, height=.6, label="between patients")
b.barh(y, fw, left=fb, color=AMBER, height=.6, label="between regions")
for i,(f,n) in enumerate(zip(fb,names)):
    b.text(f-2, i, f"{f:.0f}%", ha="right", va="center", fontsize=8.5, color="#06070c", fontweight="bold")
b.set_yticks(y); b.set_yticklabels(["Fetal-like","Differentiation","Stem (LGR5+)","YAP targets"])
b.set_xlabel("Share of variance (%)"); b.set_xlim(0,100)
b.set_title("B  Where the variance sits", loc="left", fontsize=10.5, pad=10)
b.legend(frameon=False, fontsize=8, loc="upper center", bbox_to_anchor=(.5,-.17), ncol=2, labelcolor=MUTE)
b.invert_yaxis()

# C: tumour vs matched normal
c = ax[2]
for pat in w.index:
    c.plot([0,1,2], [w.loc[pat,"Normal"], w.loc[pat,"Border"], w.loc[pat,"Tumor"]],
           "-o", color=CYAN, ms=4.5, lw=1.5, alpha=.85)
c.set_xticks([0,1,2]); c.set_xticklabels(["Normal","Border","Core"])
c.axhline(0, color=GRID, lw=.8, zorder=0)
c.set_title("C  Tumour vs matched normal", loc="left", fontsize=10.5, pad=10)
c.set_ylim(c.get_ylim()[0], c.get_ylim()[1] + .16)
c.text(.03,.97,"core > normal in 6/6 patients\nWilcoxon p = 0.031", transform=c.transAxes,
       fontsize=8, color=GREEN, va="top")

for a_ in ax:
    a_.spines[["top","right"]].set_visible(False)
    a_.grid(axis="y", color=GRID, lw=.6, alpha=.5); a_.set_axisbelow(True)
fig.suptitle("Fetal-like programme occupancy in colorectal epithelium is a patient-level property",
             x=.009, ha="left", fontsize=12.5, fontweight="bold", y=1.02)
fig.text(.009, -.055, "GSE144735 · 6 patients · 6,168 epithelial cells · Tirosh-style scoring against expression-matched controls",
         fontsize=8, color=MUTE, ha="left")
fig.tight_layout()
fig.savefig("figure1.svg", bbox_inches="tight", transparent=True)
fig.savefig("figure1.png", bbox_inches="tight", dpi=200, transparent=False, facecolor="#0b0b0b")
print("saved")
