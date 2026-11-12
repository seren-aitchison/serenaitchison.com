"""Figures, read from results/tables/. No statistic is typed here."""
import json, numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from .config import TABLES, FIGURES
from .signatures import PROGRAMME_NAMES

FG, MUTE, GRID = "#f2f2f2", "#9aa0ad", "#2a2f3a"
BLUE, CYAN, AMBER, GREEN, RED = "#4d7dff", "#6ad7e5", "#ffc24b", "#4fe0a6", "#ff7a7a"
LAB = {"FETAL": "Fetal-like", "YAP": "YAP targets", "ISC": "Stem (LGR5+)", "DIFF": "Differentiation"}

def _style():
    plt.rcParams.update({"font.family":"DejaVu Sans","text.color":FG,"axes.labelcolor":FG,
        "xtick.color":MUTE,"ytick.color":MUTE,"axes.edgecolor":GRID,"figure.facecolor":"none",
        "axes.facecolor":"none","savefig.facecolor":"none","font.size":9})

def figure1():
    _style()
    A = json.loads((TABLES / "analysis.json").read_text())
    V = json.loads((TABLES / "validation.json").read_text())
    coad = pd.read_csv(TABLES / "COAD_scores.csv", index_col=0)
    t = coad[coad.tumour]

    fig, ax = plt.subplots(1, 3, figsize=(12.6, 4.2), gridspec_kw={"width_ratios":[1,1.15,1]})

    # A: how much of each score is composition, in both cohorts
    a = ax[0]; x = np.arange(len(PROGRAMME_NAMES)); w = .36
    c_r2 = [V["COAD"]["composition_r2"][s]*100 for s in PROGRAMME_NAMES]
    r_r2 = [V["READ"]["composition_r2"][s]*100 for s in PROGRAMME_NAMES]
    a.bar(x - w/2, c_r2, w, color=BLUE, label=f"COAD (n={V['COAD']['n_tumour']})")
    a.bar(x + w/2, r_r2, w, color=CYAN, label=f"READ (n={V['READ']['n_tumour']})")
    for i,(c,r) in enumerate(zip(c_r2, r_r2)):
        a.text(i-w/2, c+1.5, f"{c:.0f}", ha="center", fontsize=8.5, color=BLUE)
        a.text(i+w/2, r+1.5, f"{r:.0f}", ha="center", fontsize=8.5, color=CYAN)
    a.set_xticks(x); a.set_xticklabels([LAB[s] for s in PROGRAMME_NAMES], rotation=18, fontsize=8.5)
    a.set_ylabel("% of variance explained by composition"); a.set_ylim(0, 92)
    a.set_title("A  In bulk, much of the score is composition", loc="left", fontsize=10.5, pad=10)
    a.legend(frameon=False, fontsize=8, labelcolor=MUTE, loc="upper right")

    # B: the scatter that makes it concrete
    b = ax[1]
    b.scatter(t.STROMA, t.YAP, s=9, color=AMBER, alpha=.55, label="YAP targets")
    b.scatter(t.STROMA, t.FETAL, s=9, color=BLUE, alpha=.55, label="Fetal-like")
    for col, c in [("YAP", AMBER), ("FETAL", BLUE)]:
        z = np.polyfit(t.STROMA, t[col], 1); xs = np.linspace(t.STROMA.min(), t.STROMA.max(), 50)
        b.plot(xs, np.polyval(z, xs), color=c, lw=1.8)
    rho_y = A["composition"]["YAP"]["STROMA"]["rho"]; rho_f = A["composition"]["FETAL"]["STROMA"]["rho"]
    b.text(.03,.97, f"YAP vs stroma  ρ = {rho_y:+.2f}\nFetal-like vs stroma  ρ = {rho_f:+.2f}",
           transform=b.transAxes, fontsize=8.5, va="top", color=MUTE)
    b.set_xlabel("Stromal score"); b.set_ylabel("Programme score")
    b.set_title("B  Stromal content drives the YAP signal", loc="left", fontsize=10.5, pad=10)
    b.legend(frameon=False, fontsize=8, labelcolor=MUTE, loc="lower right")

    # C: which associations survive adjustment, and which replicate
    c = ax[2]
    rows = [("FETAL vs stage", "stage_raw", "stage_adj"),
            ("FETAL vs hypermutation", "hypermutated_raw", "hypermutated_adj")]
    ypos, labels = [], []
    for i, (name, raw, adj) in enumerate(rows):
        for j, (cohort, col) in enumerate([("COAD", BLUE), ("READ", CYAN)]):
            for k, (key, mark) in enumerate([(raw, "o"), (adj, "s")]):
                v = V[cohort].get(key)
                if not v: continue
                y = i*2.6 + j*1.05 + k*0.38
                sig = v["p"] < 0.05
                c.scatter([-np.log10(v["p"])], [y], marker=mark, s=46 if sig else 30,
                          color=col, alpha=1 if sig else .45,
                          edgecolors=FG if sig else "none", linewidths=.8, zorder=3)
                ypos.append(y); labels.append(f"{cohort} {'adj' if k else 'raw'}")
    c.axvline(-np.log10(0.05), color=RED, ls="--", lw=1.1)
    c.text(-np.log10(0.05), c.get_ylim()[1], " p=0.05", color=RED, fontsize=8, va="top")
    c.set_yticks(ypos); c.set_yticklabels(labels, fontsize=7.5)
    c.set_xlabel("−log₁₀ p")
    for i,(name,_,_) in enumerate(rows):
        c.text(-0.02, i*2.6 + 0.7, name, transform=c.get_yaxis_transform(),
               ha="right", fontsize=8.5, color=FG, va="center")
    c.set_title("C  Survives adjustment, fails to replicate", loc="left", fontsize=10.5, pad=10)

    for a_ in ax:
        a_.spines[["top","right"]].set_visible(False)
        a_.grid(axis="y", color=GRID, lw=.6, alpha=.5); a_.set_axisbelow(True)
    fig.suptitle("Bulk programme scores are substantially tumour composition — reproducibly so",
                 x=.009, ha="left", fontsize=12.5, fontweight="bold", y=1.03)
    fig.text(.009,-.09,"TCGA-COAD and TCGA-READ · composition = stromal, immune and epithelial panels · "
             "all values generated from results/tables/", fontsize=8, color=MUTE, ha="left")
    fig.tight_layout()
    FIGURES.mkdir(parents=True, exist_ok=True)
    fig.savefig(FIGURES/"figure1.svg", bbox_inches="tight", transparent=True)
    fig.savefig(FIGURES/"figure1.png", bbox_inches="tight", dpi=200, facecolor="#0b0b0b")
    plt.close(fig)

def all_figures(): figure1()
