"""Statistics.

The primary analysis is a paired patient-level contrast, because with six patients
that is the inference the design supports. Variance decomposition is reported as a
secondary, exploratory description with uncertainty attached — not as a precise
population parameter.

A note on what the residual means. With two tumour samples per patient, a
random-intercept model's residual is within-patient sample-level variation. It
contains the regional difference *and* sample-level technical variation, which this
design cannot separate. It is therefore reported as "within-patient", never as
"between regions".
"""
import itertools, numpy as np, pandas as pd, statsmodels.formula.api as smf

def paired_contrast(samples, value, a, b, key="Region", patient="Patient", n_boot=2000, seed=0):
    """Primary analysis: per-patient difference between two regions.

    With n patients an exact sign-flip permutation over all 2^n assignments is
    feasible for n <= 20, so the p-value is exact rather than approximated.
    """
    w = samples.pivot_table(index=patient, columns=key, values=value).dropna(subset=[a, b])
    d = (w[a] - w[b]).to_numpy()
    n = len(d)
    if n < 2:
        return dict(n=n, mean=np.nan, p_exact=np.nan)

    obs = d.mean()
    if n <= 20:
        flips = np.array(list(itertools.product([1, -1], repeat=n)))
        null = (flips * d).mean(axis=1)
        p = float((np.abs(null) >= abs(obs) - 1e-12).mean())
        exact = True
    else:
        rng = np.random.default_rng(seed)
        null = (rng.choice([1, -1], size=(20000, n)) * d).mean(axis=1)
        p = float((np.abs(null) >= abs(obs) - 1e-12).mean()); exact = False

    rng = np.random.default_rng(seed)
    boot = np.array([d[rng.integers(0, n, n)].mean() for _ in range(n_boot)])
    return dict(n=int(n), mean=float(obs), median=float(np.median(d)),
                mean_abs=float(np.abs(d).mean()),
                ci_lo=float(np.percentile(boot, 2.5)), ci_hi=float(np.percentile(boot, 97.5)),
                p_exact=p, exact=exact, n_positive=int((d > 0).sum()),
                per_patient={k: float(v) for k, v in (w[a] - w[b]).items()})

def icc(samples, value, patient="Patient"):
    """Between-patient share of variance, with convergence reported rather than hidden."""
    d = samples[[value, patient]].dropna()
    if d[patient].nunique() < 3:
        return dict(icc=np.nan, converged=False, note="fewer than 3 patients")
    m = smf.mixedlm(f"{value} ~ 1", d, groups=d[patient]).fit(reml=True)
    vb, vw = float(m.cov_re.iloc[0, 0]), float(m.scale)
    return dict(icc=vb / (vb + vw) if (vb + vw) > 0 else np.nan,
                var_between_patient=vb, var_within_patient=vw,
                converged=bool(m.converged), n_patients=int(d[patient].nunique()),
                n_samples=int(len(d)))

def icc_interval(samples, value, patient="Patient", n_boot=2000, seed=0):
    """Bootstrap the ICC by resampling patients, which is the unit of replication."""
    pats = samples[patient].dropna().unique()
    rng = np.random.default_rng(seed)
    vals = []
    for _ in range(n_boot):
        pick = rng.choice(pats, size=len(pats), replace=True)
        rows = []
        for j, p in enumerate(pick):
            sub = samples[samples[patient] == p].copy()
            sub[patient] = f"{p}_{j}"          # resampled patients are distinct groups
            rows.append(sub)
        try:
            r = icc(pd.concat(rows), value, patient)
            if np.isfinite(r["icc"]): vals.append(r["icc"])
        except Exception:
            continue
    if not vals:
        return dict(ci_lo=np.nan, ci_hi=np.nan, n_ok=0)
    return dict(ci_lo=float(np.percentile(vals, 2.5)), ci_hi=float(np.percentile(vals, 97.5)),
                median=float(np.median(vals)), n_ok=len(vals))

def leave_one_patient_out(samples, value, patient="Patient"):
    """How much does any single patient drive the estimate?"""
    out = []
    for p in samples[patient].dropna().unique():
        sub = samples[samples[patient] != p]
        r = icc(sub, value, patient)
        out.append(dict(dropped=p, icc=r["icc"], converged=r.get("converged")))
    return pd.DataFrame(out)

def between_patient_reference(samples, value, patient="Patient"):
    """Mean |difference| between two random patients — the scale everything else uses."""
    v = samples.groupby(patient)[value].mean().to_numpy()
    if len(v) < 2: return np.nan
    return float(np.mean([abs(a - b) for a, b in itertools.combinations(v, 2)]))
