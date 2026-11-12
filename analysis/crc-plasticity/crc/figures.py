"""Figures. Every number is read from results/tables/; none is typed here.

If the statistics change, the figures change. That is the whole point: a figure
that can disagree with its own analysis is not evidence.
"""
import json, numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from .config import TABLES, FIGURES, MIN_CELLS
from .signatures import NAMES

FG, MUTE, GRID = "#f2f2f2", "#9aa0ad", "#2a2f3a"
BLUE, CYAN, AMBER, GREEN, RED = "#4d7dff", "#6ad7e5", "#ffc24b", "#4fe0a6", "#ff7a7a"
SHORT = {"FETAL": "Fetal-like\nprogramme", "YAP": "YAP target\nexpression",
         "ISC": "Stem\n(LGR5+)", "DIFF": "Differen-\ntiation"}

def _style():
    plt.rcParams.update({"font.family": "DejaVu Sans", "text.color": FG, "axes.labelcolor": FG,
        "xtick.color": MUTE, "ytick.color": MUTE, "axes.edgecolor": GRID,
        "figure.facecolor": "none", "axes.facecolor": "none", "savefig.facecolor": "none",
        "font.size": 9})

def _tidy(ax):
    for a in np.atleast_1d(ax).ravel():
        a.spines[["top", "right"]].set_visible(False)
        a.grid(axis="y", color=GRID, lw=.6, alpha=.5); a.set_axisbelow(True)

def _save(fig, name):
    FIGURES.mkdir(parents=True, exist_ok=True)
    fig.savefig(FIGURES / f"{name}.svg", bbox_inches="tight", transparent=True)
    fig.savefig(FIGURES / f"{name}.png", bbox_inches="tight", dpi=200, facecolor="#0b0b0b")
    plt.close(fig)

def stats(): return json.loads((TABLES / "statistics.json").read_text())
def samples(c): return pd.read_csv(TABLES / f"{c}_samples.csv")

# ------------------------------------------------------------------ figure 1
def figure1():
    _style(); S = stats()
    kul = samples("kul3")
    tum = kul[kul.Region.isin(["Tumor", "Border"]) & (kul.n_cells >= MIN_CELLS)]
    w = tum.pivot_table(index="Patient", columns="Region", values="FETAL").dropna()
    prim = S["primary"]["FETAL"]

    fig, ax = plt.subplots(1, 3, figsize=(12.2, 4.2), gridspec_kw={"width_ratios": [1.1, 1, 1]})

    a = ax[0]
    ys = {}
    for p in w.sort_values("Border", ascending=False).index:
        y = w.loc[p, "Border"]
        while any(abs(y - v) < .028 for v in ys.values()): y -= .028
        ys[p] = y
    for p in w.index:
        a.plot([0, 1], [w.loc[p, "Tumor"], w.loc[p, "Border"]], "-o", color=BLUE, ms=5, lw=1.6, alpha=.9)
        a.annotate(p, (1.05, ys[p]), fontsize=7.5, color=MUTE, va="center")
    a.set_xlim(-.25, 1.55); a.set_xticks([0, 1]); a.set_xticklabels(["Tumour core", "Tumour border"])
    a.set_ylabel("Fetal-like programme score")
    a.set_title("A  Paired within-tumour comparison", loc="left", fontsize=10.5, pad=10)
    a.axhline(0, color=GRID, lw=.8, zorder=0)
    lo, hi = a.get_ylim(); a.set_ylim(lo - (hi - lo) * .22, hi)
    a.text(.02, .02, f"mean difference {prim['mean']:+.3f}\nexact p = {prim['p_exact']:.3f}  (n = {prim['n']})",
           transform=a.transAxes, fontsize=8, color=MUTE, va="bottom")

    b = ax[1]
    v = S["variance"]; names = NAMES
    icc = [v[s]["icc"] for s in names]
    lo = [v[s]["ci_ci_lo"] for s in names]; hi = [v[s]["ci_ci_hi"] for s in names]
    y = np.arange(len(names))
    b.barh(y, icc, color=[BLUE if s == "FETAL" else "#4a5168" for s in names], height=.55)
    b.errorbar(icc, y, xerr=[np.array(icc) - np.array(lo), np.array(hi) - np.array(icc)],
               fmt="none", ecolor=FG, elinewidth=1.3, capsize=3)
    for i, s in enumerate(names):
        b.plot([v[s]["lopo_min"], v[s]["lopo_max"]], [i + .28] * 2, color=AMBER, lw=2.4, solid_capstyle="butt")
    b.set_yticks(y); b.set_yticklabels([SHORT[s].replace("\n", " ") for s in names], fontsize=8.5)
    b.set_xlim(0, 1.02); b.set_xlabel("Between-patient share of variance (ICC)")
    b.set_title("B  Variance decomposition, with uncertainty", loc="left", fontsize=10.5, pad=10)
    b.invert_yaxis()
    b.text(0, len(names) - .35, "white bars: 95% bootstrap CI     amber: leave-one-patient-out range",
           fontsize=7.5, color=MUTE, va="top", ha="left")
    b.set_ylim(len(names) - .1, -0.6)

    c = ax[2]
    vn = S["vs_normal"]
    for region, col in [("Tumor", CYAN), ("Border", BLUE)]:
        d = vn[region]["per_patient"]
        xs = list(d.values())
        c.scatter(xs, np.full(len(xs), 0 if region == "Tumor" else 1), s=22, color=col, alpha=.8, zorder=3)
        c.plot([np.median(xs)], [0 if region == "Tumor" else 1], marker="|", ms=18, color=FG, mew=2.2, zorder=4)
    c.axvline(0, color=RED, ls="--", lw=1.1)
    c.set_yticks([0, 1])
    c.set_yticklabels([f"Core − normal\n{vn['Tumor']['n_positive']}/{vn['Tumor']['n']}  p={vn['Tumor']['p_exact']:.3f}",
                       f"Border − normal\n{vn['Border']['n_positive']}/{vn['Border']['n']}  p={vn['Border']['p_exact']:.3f}"],
                      fontsize=8)
    c.set_xlabel("Difference in fetal-like score"); c.invert_yaxis()
    c.set_title("C  Tumour vs matched normal", loc="left", fontsize=10.5, pad=10)

    _tidy(ax)
    fig.suptitle("Within-tumour variation is small relative to between-patient variation",
                 x=.009, ha="left", fontsize=12.5, fontweight="bold", y=1.03)
    k = json.loads((TABLES / "kul3_run.json").read_text())
    fig.text(.009, -.06, f"{k['accession']} · {k['n_epithelial']:,} epithelial cells · "
             f"samples with ≥{MIN_CELLS} cells · all values generated from results/tables/",
             fontsize=8, color=MUTE, ha="left")
    fig.tight_layout(); _save(fig, "figure1")

# ------------------------------------------------------------------ figure 2
def figure2():
    _style(); S = stats()
    tiers = S["tiers"][str(MIN_CELLS)]
    coh = S["cohorts"]
    fig, ax = plt.subplots(1, 3, figsize=(12.6, 4.2), gridspec_kw={"width_ratios": [1.2, 1, 1]})

    a = ax[0]
    names = NAMES; x = np.arange(len(names)); wd = .36
    reg = [tiers[s]["regional"] * 100 for s in names]
    tec = [tiers[s]["technical"] * 100 if np.isfinite(tiers[s]["technical"]) else np.nan for s in names]
    a.bar(x - wd/2, reg, wd, color=BLUE, label="between tumour regions")
    a.bar(x + wd/2, tec, wd, color=AMBER, label="between library preparations")
    a.axhline(100, color=MUTE, ls="--", lw=1)
    a.text(len(names) - .45, 103, "between patients", fontsize=8, color=MUTE, ha="right")
    for i, (r, t) in enumerate(zip(reg, tec)):
        a.text(i - wd/2, r + 3, f"{r:.0f}", ha="center", fontsize=8.5, color=BLUE)
        if np.isfinite(t): a.text(i + wd/2, t + 3, f"{t:.0f}", ha="center", fontsize=8.5, color=AMBER)
    a.set_xticks(x); a.set_xticklabels([SHORT[s] for s in names], fontsize=8.5)
    a.set_ylabel("% of between-patient difference"); a.set_ylim(0, 135)
    a.set_title("A  Regional vs technical vs between-patient", loc="left", fontsize=10.5, pad=10)
    a.legend(frameon=False, fontsize=8, loc="upper center", bbox_to_anchor=(.5, -.17), ncol=2, labelcolor=MUTE)

    b = ax[1]; lbl, ys = [], []
    for i, (c, v) in enumerate(coh.items()):
        r = v.get("vs_normal") or {}
        d = list((r.get("per_patient") or {}).values())
        if not d: continue
        b.scatter(d, np.full(len(d), i) + np.random.default_rng(i).normal(0, .07, len(d)),
                  s=16, color=CYAN, alpha=.75, zorder=3)
        b.plot([np.median(d)], [i], marker="|", ms=18, color=FG, mew=2.2, zorder=4)
        lbl.append(f"{v['accession']}\n{r['n_positive']}/{r['n']}  p={r['p_exact']:.3f}"); ys.append(i)
    b.axvline(0, color=RED, ls="--", lw=1.1); b.set_yticks(ys); b.set_yticklabels(lbl, fontsize=8)
    b.set_xlabel("Tumour − matched normal"); b.invert_yaxis()
    b.set_title("B  Replication across cohorts", loc="left", fontsize=10.5, pad=10)

    c = ax[2]
    for i, (name, v) in enumerate(coh.items()):
        s = samples(name)
        t = s[(s.Region == "Tumor") & (s.n_cells >= MIN_CELLS)]
        if "Prep" in t.columns and (t.Prep == "unsorted").any(): t = t[t.Prep == "unsorted"]
        vals = t.groupby("Patient").FETAL.mean().to_numpy()
        c.scatter(np.full(len(vals), i) + np.random.default_rng(i + 9).normal(0, .08, len(vals)),
                  vals, s=14, color=BLUE, alpha=.7, zorder=3)
        c.plot([i - .22, i + .22], [vals.mean()] * 2, color=FG, lw=2, zorder=4)
        c.annotate(f"n={len(vals)}", (i, c.get_ylim()[1]), ha="center", fontsize=7.5, color=MUTE)
    c.set_xticks(range(len(coh))); c.set_xticklabels([v["accession"] for v in coh.values()], rotation=20, fontsize=8)
    c.set_ylabel("Fetal-like score, tumour")
    c.set_title("C  Between-patient spread", loc="left", fontsize=10.5, pad=10)

    _tidy(ax)
    fig.suptitle("YAP target expression varies across a tumour; the fetal-like programme does not",
                 x=.009, ha="left", fontsize=12.5, fontweight="bold", y=1.03)
    total = sum(v["cells"] for v in coh.values())
    fig.text(.009, -.07, f"{len(coh)} public cohorts · {total:,} cells · "
             "each tier standardised to its own cohort's between-patient difference",
             fontsize=8, color=MUTE, ha="left")
    fig.tight_layout(); _save(fig, "figure2")

def all_figures():
    figure1(); figure2()
