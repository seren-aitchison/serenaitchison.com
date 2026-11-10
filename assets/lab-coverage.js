// Coverage audit. Choose which alleles a panel assays, fetch the real population
// frequencies of every defining variant from gnomAD via Ensembl, and compute what the
// panel would miss — per population. An untested variant defaults to the reference
// allele, so the output of a gap is not "unknown" but a confident "normal".
import { COVERAGE, FUNCTION_WEIGHT, POPS, FREQ_SNAPSHOT, FREQ_RETRIEVED } from "./lab-data.js";
import { icon, esc } from "./ui.js";

const ENSEMBL = "https://rest.ensembl.org";
const ORDER = ["afr", "amr", "eas", "sas", "nfe", "fin", "asj", "mid"];

export function mountCoverage(root) {
  if (!root) return;
  const geneSel = root.querySelector("#cov-gene");
  const list = root.querySelector("#cov-alleles");
  const out = root.querySelector("#cov-out");
  const status = root.querySelector("#cov-status");
  const cache = new Map();
  let tested = new Set();
  let live = false; // when true, re-fetch each variant from Ensembl instead of using the snapshot

  geneSel.innerHTML = Object.keys(COVERAGE).map((g) => `<option value="${g}">${g}</option>`).join("");

  function paintAlleles() {
    const g = COVERAGE[geneSel.value];
    tested = new Set(g.alleles.filter((a) => a.core).map((a) => a.rs));
    list.innerHTML = g.alleles.map((a) => `
      <button type="button" data-rs="${a.rs}" aria-pressed="${tested.has(a.rs)}">
        <span>${esc(a.a)}</span><small>${esc(a.fn.replace(" function", ""))}</small>
      </button>`).join("");
  }

  const setStatus = (t, cls = "") => { status.className = `live-dot ${cls}`; status.textContent = t; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function frequencies(rs) {
    if (!live) return FREQ_SNAPSHOT[rs]?.freq || null;
    if (cache.has(rs)) return cache.get(rs);
    // Ensembl rate-limits; space the requests out and retry a throttled one.
    for (let attempt = 0; ; attempt++) {
      try {
        const r = await fetch(`${ENSEMBL}/variation/human/${rs}?pops=1&content-type=application/json`);
        if ((r.status === 429 || r.status === 503) && attempt < 3) { await wait(1800); continue; }
        if (!r.ok) throw new Error(`${r.status}`);
        const d = await r.json();
        const alt = (d.mappings?.[0]?.allele_string || "/").split("/")[1];
        const freq = {};
        for (const p of d.populations || []) {
          if (!p.population.startsWith("gnomADe:")) continue;
          const key = p.population.split(":")[1];
          if (p.allele === alt) freq[key] = p.frequency;
        }
        const result = Object.keys(freq).length ? freq : null;
        cache.set(rs, result);
        return result;
      } catch (e) {
        if (attempt >= 3) { cache.set(rs, null); return null; }
        await wait(1500);
      }
    }
  }

  async function run() {
    const gene = geneSel.value, g = COVERAGE[gene];
    setStatus(live ? "Querying Ensembl…" : "Computing…");
    if (live) out.innerHTML = `<div class="empty">Re-fetching ${g.alleles.length} variant${g.alleles.length === 1 ? "" : "s"} from Ensembl. The population query takes roughly half a minute each, so this is slow by design.</div>`;

    const data = [];
    for (const a of g.alleles) {
      data.push({ ...a, freq: await frequencies(a.rs) });
      if (live) await wait(350); // stay well inside Ensembl's rate limit
    }

    const missing = data.filter((d) => !d.freq);
    const usable = data.filter((d) => d.freq);
    if (!usable.length) {
      setStatus("No frequency data", "err");
      out.innerHTML = `<div class="callout warn"><b>No gnomAD exome frequencies returned</b> for any defining variant of ${esc(gene)}. ${missing.length ? "That is itself informative: a variant outside the exome capture — a promoter or deep intronic variant — has no exome frequency to report." : ""}</div>`;
      return;
    }

    // Deleterious burden captured and missed, per population.
    const rows = ORDER.filter((p) => usable.some((d) => d.freq[p] != null)).map((p) => {
      let total = 0, missed = 0;
      for (const d of usable) {
        const w = FUNCTION_WEIGHT[d.fn] ?? 0;
        const f = d.freq[p];
        if (f == null || !w) continue;
        total += f * w;
        if (!tested.has(d.rs)) missed += f * w;
      }
      const captured = total ? (total - missed) / total : 1;
      // Probability a diplotype carries at least one missed allele, under HWE.
      const pMiss = 1 - Math.pow(1 - missed, 2);
      return { p, total, missed, captured, pMiss };
    });

    rows.sort((a, b) => b.pMiss - a.pMiss);
    const worst = rows[0], best = rows[rows.length - 1];
    const gap = worst && best ? worst.pMiss - best.pMiss : 0;
    const untested = data.filter((d) => !tested.has(d.rs) && (FUNCTION_WEIGHT[d.fn] ?? 0) > 0);

    setStatus(live ? "Live from Ensembl" : `Snapshot · ${FREQ_RETRIEVED}`, "ok");
    const maxPMiss = Math.max(...rows.map((r) => r.pMiss), 0.0001);

    out.innerHTML = `
      <div class="stat-row">
        <div class="stat"><small>Alleles assayed</small><b>${tested.size} of ${g.alleles.length}</b><span>${esc(gene)}</span></div>
        <div class="stat" style="${worst.pMiss > 0.01 ? "border-color:#ffc24b55" : ""}">
          <small>Worst affected</small>
          <b style="color:${worst.pMiss > 0.01 ? "#ffc24b" : "#4fe0a6"}">${(worst.pMiss * 100).toFixed(2)}%</b>
          <span>${esc(POPS[worst.p] || worst.p)}</span>
        </div>
        <div class="stat"><small>Least affected</small><b>${(best.pMiss * 100).toFixed(2)}%</b><span>${esc(POPS[best.p] || best.p)}</span></div>
        <div class="stat"><small>Disparity</small><b>${(gap * 100).toFixed(2)}<span style="font-size:13px">pp</span></b><span>between those two groups</span></div>
      </div>

      <div>
        <span class="f" style="display:block;margin-bottom:10px">Diplotypes carrying an unassayed reduced-function allele</span>
        ${rows.map((r) => `
          <span style="display:grid;grid-template-columns:minmax(130px,230px) 1fr auto;gap:12px;align-items:center;font-size:13px;margin-bottom:8px">
            <span class="faint">${esc(POPS[r.p] || r.p)}</span>
            <span class="meter"><i style="width:${Math.max(1.5, (r.pMiss / maxPMiss) * 100)}%;background:linear-gradient(90deg,#ffc24b,#ff7a7a)"></i></span>
            <b class="mono" style="font-size:12.5px">${(r.pMiss * 100).toFixed(2)}%</b>
          </span>`).join("")}
        <p class="faint" style="font-size:12.5px;margin:6px 0 0">These people are not reported as uncertain. They are reported as normal metabolisers.</p>
      </div>

      <div class="table-wrap"><table class="data plain">
        <thead><tr><th scope="col">Allele</th><th scope="col">Variant</th><th scope="col">Function</th><th scope="col">Assayed</th>
          ${ORDER.filter((p) => rows.some((r) => r.p === p)).map((p) => `<th scope="col">${esc(p)}</th>`).join("")}</tr></thead>
        <tbody>${data.map((d) => `<tr>
          <th scope="row">${esc(d.a)}</th>
          <td class="mono" style="font-size:12.5px">${esc(d.rs)}</td>
          <td>${esc(d.fn)}</td>
          <td style="color:${tested.has(d.rs) ? "#4fe0a6" : "#ffc24b"}">${tested.has(d.rs) ? "yes" : "no"}</td>
          ${ORDER.filter((p) => rows.some((r) => r.p === p)).map((p) => {
            const f = d.freq?.[p];
            return `<td class="num">${f == null ? '<span class="faint">—</span>' : (f * 100).toFixed(2)}</td>`;
          }).join("")}
        </tr>`).join("")}</tbody>
      </table>
      <p class="faint" style="font-size:12px;padding:10px 12px;margin:0">Alternate allele frequency, %, gnomAD exomes via Ensembl${live ? ", fetched live just now" : `, from the snapshot retrieved ${esc(FREQ_RETRIEVED)}`}.</p></div>

      ${missing.length ? `<div class="callout warn" style="font-size:14px"><b>No exome frequency for ${missing.map((m) => esc(m.a)).join(", ")}.</b> ${esc(g.note || "A variant outside the exome capture has no exome frequency to report, which is a limitation of the data source rather than of the allele.")}</div>` : g.note ? `<div class="callout" style="font-size:14px">${esc(g.note)}</div>` : ""}

      ${untested.length ? `<div class="callout" style="font-size:14px"><b>What is being missed.</b> ${untested.map((u) => `${esc(u.a)} (${esc(u.fn.toLowerCase())})`).join(", ")}. Switch ${untested.length === 1 ? "it" : "them"} on above and watch the disparity close.</div>` : ""}

      <div class="callout warn" style="font-size:14px">
        <b>How this is calculated, and what it assumes.</b> Each allele contributes its gnomAD alternate-allele frequency weighted by function — no-function counts fully, decreased-function at half. The percentage is the chance a diplotype carries at least one unassayed reduced-function allele under Hardy–Weinberg, treating the listed alleles as mutually exclusive. Real panels test haplotypes rather than single variants, gnomAD groups are coarse, and only the alleles listed here are considered. The figures are an illustration of the size and the direction of the gap, not a validated estimate of clinical misassignment.
      </div>`;
  }

  geneSel.addEventListener("change", () => { paintAlleles(); out.innerHTML = `<div class="empty">Press <b>Audit coverage</b> to fetch frequencies.</div>`; });
  list.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-rs]");
    if (!b) return;
    const on = b.getAttribute("aria-pressed") === "true";
    b.setAttribute("aria-pressed", String(!on));
    if (on) tested.delete(b.dataset.rs); else tested.add(b.dataset.rs);
  });
  root.querySelector("#cov-run").addEventListener("click", run);
  root.querySelector("#cov-all").addEventListener("click", () => {
    const g = COVERAGE[geneSel.value];
    tested = new Set(g.alleles.map((a) => a.rs));
    list.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "true"));
  });
  root.querySelector("#cov-all").innerHTML = `${icon("check")}<span>Assay everything</span>`;
  const liveBtn = root.querySelector("#cov-live");
  liveBtn.innerHTML = `${icon("repeat")}<span>Re-fetch from Ensembl</span>`;
  liveBtn.addEventListener("click", () => { live = true; run(); });

  paintAlleles();
  out.innerHTML = `<div class="empty">Press <b>Audit coverage</b> to fetch frequencies.</div>`;
}
