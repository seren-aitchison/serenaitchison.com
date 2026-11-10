// Statistics studio: Manhattan, QQ and expression plots, drawn as SVG and computed in the page.
// GWAS data is simulated with a seeded generator so the plot is stable between renders.
import { esc } from "./ui.js";

export const STAT_CONTROLS = {
  manhattan: `
    <label class="f">Variants <span class="mono" data-v="n">800</span><input name="n" type="range" min="200" max="3000" step="100" value="800"></label>
    <label class="f">True signals <span class="mono" data-v="sig">3</span><input name="sig" type="range" min="0" max="8" step="1" value="3"></label>
    <label class="f">Signal strength <span class="mono" data-v="str">6.0</span><input name="str" type="range" min="2" max="12" step="0.5" value="6"></label>
    <label class="f">Seed <span class="mono" data-v="seed">7</span><input name="seed" type="range" min="1" max="40" step="1" value="7"></label>`,
  qq: `
    <label class="f">Variants <span class="mono" data-v="n">1200</span><input name="n" type="range" min="200" max="4000" step="100" value="1200"></label>
    <label class="f">Inflation λ <span class="mono" data-v="lam">1.00</span><input name="lam" type="range" min="80" max="180" step="2" value="100"></label>
    <label class="f">True signals <span class="mono" data-v="sig">2</span><input name="sig" type="range" min="0" max="10" step="1" value="2"></label>
    <label class="f">Seed <span class="mono" data-v="seed">5</span><input name="seed" type="range" min="1" max="40" step="1" value="5"></label>`,
  expr: `
    <label class="f">Sort by
      <select name="sort"><option value="fc">Fold change</option><option value="name">Gene name</option></select>
    </label>
    <label class="f">Highlight threshold <span class="mono" data-v="thr">1.50</span><input name="thr" type="range" min="105" max="200" step="5" value="150"></label>`,
};

/* ---------- utilities ---------- */
const read = (root) => {
  const o = {};
  root.querySelectorAll("input,select").forEach((el) => { o[el.name] = el.type === "range" ? Number(el.value) : el.value; });
  root.querySelectorAll("[data-v]").forEach((s) => {
    const el = root.querySelector(`[name="${s.dataset.v}"]`);
    if (!el) return;
    const v = Number(el.value);
    s.textContent = s.dataset.v === "lam" ? (v / 100).toFixed(2) : s.dataset.v === "str" ? v.toFixed(1) : s.dataset.v === "thr" ? (v / 100).toFixed(2) : String(v);
  });
  return o;
};
// Deterministic PRNG, so a given seed always gives the same plot.
function rng(seed) {
  let s = seed * 2654435761 % 2147483647;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
// Box–Muller
function normal(r) {
  const u = Math.max(r(), 1e-12), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
// Two-sided p from a z score (Abramowitz & Stegun 7.1.26 error-function approximation).
function pFromZ(z) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return Math.max(1e-300, 1 - y);
}
const GW = 5e-8;

function simulate({ n, sig, str, seed, lam = 100 }) {
  const r = rng(seed);
  const rows = [];
  for (let i = 0; i < n; i++) {
    let z = normal(r) * (lam / 100);
    rows.push({ i, chr: 1 + (i % 22), z: Math.abs(z) });
  }
  const r2 = rng(seed + 991);
  for (let k = 0; k < sig; k++) {
    const idx = Math.floor(r2() * n);
    rows[idx].z = (str || 6) + r2() * 1.5;
    rows[idx].hit = true;
  }
  rows.forEach((d) => { d.p = pFromZ(d.z); d.lp = -Math.log10(d.p); });
  return rows;
}

const frame = (w, h, pad) => ({ w, h, pad, ix: w - pad.l - pad.r, iy: h - pad.t - pad.b });

/* ---------- Manhattan ---------- */
export function drawManhattan(root) {
  const o = read(root);
  const rows = simulate(o);
  const W = 860, H = 380, pad = { l: 52, r: 16, t: 20, b: 42 };
  const f = frame(W, H, pad);
  const maxY = Math.max(8, Math.ceil(Math.max(...rows.map((d) => d.lp)) + 0.5));
  const X = (i) => pad.l + (i / (rows.length - 1)) * f.ix;
  const Y = (v) => pad.t + f.iy - (v / maxY) * f.iy;
  const COL = ["#4d7dff", "#36b6c9"];
  const hits = rows.filter((d) => d.p < GW);

  const ticks = [];
  for (let v = 0; v <= maxY; v += 2) ticks.push(v);

  return `
  <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Manhattan plot of simulated association results">
    ${ticks.map((v) => `<line class="gridl" x1="${pad.l}" y1="${Y(v)}" x2="${W - pad.r}" y2="${Y(v)}"/><text x="${pad.l - 10}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
    <line class="axis" x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${H - pad.b}"/>
    <line class="axis" x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}"/>
    <line x1="${pad.l}" y1="${Y(-Math.log10(GW))}" x2="${W - pad.r}" y2="${Y(-Math.log10(GW))}" stroke="#ff7a7a" stroke-dasharray="5 4" stroke-width="1.2"/>
    <text x="${W - pad.r}" y="${Y(-Math.log10(GW)) - 7}" text-anchor="end" fill="#ff7a7a">p = 5 × 10⁻⁸</text>
    ${rows.map((d) => `<circle cx="${X(d.i).toFixed(1)}" cy="${Y(d.lp).toFixed(1)}" r="${d.p < GW ? 4 : 2.1}" fill="${d.p < GW ? "#fff" : COL[d.chr % 2]}" opacity="${d.p < GW ? 1 : 0.75}"/>`).join("")}
    <text class="lbl" x="${pad.l}" y="${H - 10}">Genomic position (simulated, ordered)</text>
    <text class="lbl" x="18" y="${pad.t + f.iy / 2}" text-anchor="middle" transform="rotate(-90 18 ${pad.t + f.iy / 2})">−log₁₀(p)</text>
  </svg>
  <div class="stat-row">
    <div class="stat"><small>Variants</small><b>${rows.length}</b><span>simulated</span></div>
    <div class="stat"><small>Pass 5 × 10⁻⁸</small><b>${hits.length}</b><span>${hits.length === Number(o.sig) ? "matches the planted signals" : `${o.sig} signal${o.sig === 1 ? "" : "s"} planted`}</span></div>
    <div class="stat"><small>Smallest p</small><b style="font-size:16px">${rows.reduce((a, b) => (b.p < a.p ? b : a)).p.toExponential(1)}</b><span>strongest association</span></div>
  </div>
  <div class="callout" style="font-size:14px"><b>Try this.</b> Set the planted signals to zero and raise the variant count. Points still climb toward the threshold — that is multiple testing, and it is the whole reason the threshold sits at 5 × 10⁻⁸ rather than 0.05.</div>`;
}

/* ---------- QQ ---------- */
export function drawQQ(root) {
  const o = read(root);
  const rows = simulate({ ...o, str: 6 });
  const ps = rows.map((d) => d.p).sort((a, b) => a - b);
  const n = ps.length;
  const pts = ps.map((p, i) => ({ exp: -Math.log10((i + 0.5) / n), obs: -Math.log10(p) }));
  // Genomic inflation factor from the median chi-square (1 df).
  const medChi = (() => {
    const z = rows.map((d) => d.z * d.z).sort((a, b) => a - b);
    return z[Math.floor(z.length / 2)];
  })();
  const lambda = medChi / 0.4549;

  const W = 560, H = 420, pad = { l: 56, r: 20, t: 20, b: 48 };
  const f = frame(W, H, pad);
  const max = Math.max(...pts.map((p) => Math.max(p.exp, p.obs))) * 1.05;
  const X = (v) => pad.l + (v / max) * f.ix;
  const Y = (v) => pad.t + f.iy - (v / max) * f.iy;
  const ticks = []; for (let v = 0; v <= max; v += Math.max(1, Math.round(max / 5))) ticks.push(v);

  return `
  <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="QQ plot of simulated p-values">
    ${ticks.map((v) => `<line class="gridl" x1="${pad.l}" y1="${Y(v)}" x2="${W - pad.r}" y2="${Y(v)}"/>
      <text x="${pad.l - 10}" y="${Y(v) + 4}" text-anchor="end">${v}</text>
      <text x="${X(v)}" y="${H - pad.b + 18}" text-anchor="middle">${v}</text>`).join("")}
    <line class="axis" x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${H - pad.b}"/>
    <line class="axis" x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}"/>
    <line x1="${X(0)}" y1="${Y(0)}" x2="${X(max)}" y2="${Y(max)}" stroke="#ff7a7a" stroke-dasharray="5 4" stroke-width="1.2"/>
    ${pts.map((p) => `<circle cx="${X(p.exp).toFixed(1)}" cy="${Y(p.obs).toFixed(1)}" r="2.2" fill="#4d7dff" opacity=".8"/>`).join("")}
    <text class="lbl" x="${pad.l}" y="${H - 12}">Expected −log₁₀(p)</text>
    <text class="lbl" x="18" y="${pad.t + f.iy / 2}" text-anchor="middle" transform="rotate(-90 18 ${pad.t + f.iy / 2})">Observed −log₁₀(p)</text>
  </svg>
  <div class="stat-row">
    <div class="stat"><small>λ (genomic inflation)</small><b>${lambda.toFixed(3)}</b><span>${lambda > 1.1 ? "inflated — investigate structure" : "close to null expectation"}</span></div>
    <div class="stat"><small>Variants</small><b>${n}</b><span>simulated</span></div>
    <div class="stat"><small>Set λ</small><b>${(o.lam / 100).toFixed(2)}</b><span>what you asked for</span></div>
  </div>
  <div class="callout" style="font-size:14px"><b>What to look for.</b> Points lifting away only in the upper tail is what real association looks like. The whole line drifting above the diagonal is inflation — usually population structure or relatedness, not biology. Push the λ slider up and watch the difference.</div>`;
}

/* ---------- Expression ---------- */
const EXPR = [
  ["EGFR", 80, 160], ["BRCA1", 100, 180], ["MYC", 200, 350], ["AKT1", 160, 190],
  ["MTHFR", 110, 105], ["TP53", 150, 140], ["ESR1", 120, 60], ["PTEN", 90, 45],
];

export function drawExpression(root) {
  const o = read(root);
  const thr = (o.thr || 150) / 100;
  let rows = EXPR.map(([g, c, t]) => ({ g, c, t, fc: t / c, pct: ((t - c) / c) * 100 }));
  rows.sort(o.sort === "name" ? (a, b) => a.g.localeCompare(b.g) : (a, b) => b.fc - a.fc);

  const W = 820, H = 360, pad = { l: 64, r: 24, t: 20, b: 44 };
  const f = frame(W, H, pad);
  const maxFC = Math.max(2.2, ...rows.map((r) => r.fc));
  const X = (v) => pad.l + (v / maxFC) * f.ix;
  const bh = f.iy / rows.length;

  const up = rows.filter((r) => r.fc >= thr).length;
  const down = rows.filter((r) => r.fc <= 1 / thr).length;

  return `
  <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Fold change by gene">
    ${[0, 0.5, 1, 1.5, 2].filter((v) => v <= maxFC).map((v) => `<line class="gridl" x1="${X(v)}" y1="${pad.t}" x2="${X(v)}" y2="${H - pad.b}"/><text x="${X(v)}" y="${H - pad.b + 18}" text-anchor="middle">${v}×</text>`).join("")}
    <line x1="${X(1)}" y1="${pad.t}" x2="${X(1)}" y2="${H - pad.b}" stroke="#ff7a7a" stroke-dasharray="5 4" stroke-width="1.2"/>
    ${rows.map((r, i) => {
      const y = pad.t + i * bh + 4, h = bh - 10;
      const col = r.fc >= thr ? "#4fe0a6" : r.fc <= 1 / thr ? "#ff7a7a" : "#4d7dff";
      return `<rect x="${pad.l}" y="${y.toFixed(1)}" width="${(X(r.fc) - pad.l).toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${col}" opacity=".85"/>
        <text x="${pad.l - 10}" y="${(y + h / 2 + 4).toFixed(1)}" text-anchor="end" class="lbl">${r.g}</text>
        <text x="${(X(r.fc) + 8).toFixed(1)}" y="${(y + h / 2 + 4).toFixed(1)}">${r.fc.toFixed(2)}× (${r.pct > 0 ? "+" : ""}${r.pct.toFixed(0)}%)</text>`;
    }).join("")}
    <text class="lbl" x="${pad.l}" y="${H - 8}">Fold change (treatment ÷ control)</text>
  </svg>
  <div class="stat-row">
    <div class="stat"><small>Above ${thr.toFixed(2)}×</small><b>${up}</b><span>increased</span></div>
    <div class="stat"><small>Below ${(1 / thr).toFixed(2)}×</small><b>${down}</b><span>decreased</span></div>
    <div class="stat"><small>Genes</small><b>${rows.length}</b><span>illustrative dataset</span></div>
  </div>
  <div class="callout warn" style="font-size:14px"><b>No significance here, deliberately.</b> One value per condition means no variance, so no p-value and no multiple-testing correction are possible. Move the threshold and the counts change — which shows that "differentially expressed" is a choice of cut-off, not a property of the data, until a statistical model is involved.</div>`;
}
