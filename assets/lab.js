// Computational Lab. Five tools. Ensembl, gnomAD (via Ensembl) and PubChem are queried live;
// the network tool tries STRING and falls back to a bundled set if the browser cannot reach it.
import { mountChrome, icon, esc } from "./ui.js";
import { PGX, PGX_NOTE, FREQ_VARIANTS, POPS, COMPOUNDS, RULES, NET_FALLBACK } from "./lab-data.js";
import { drawManhattan, drawQQ, drawExpression, STAT_CONTROLS } from "./lab-stats.js";
import { mountDiplotype } from "./lab-diplotype.js";
import { mountProtein } from "./lab-protein.js";
import { mountVcf } from "./lab-vcf.js";
import { mountFastq } from "./lab-fastq.js";
import { mountCoverage } from "./lab-coverage.js";

mountChrome("lab.html");
document.querySelectorAll("[data-ico]").forEach((el) => { el.innerHTML = icon(el.dataset.ico); });

const $ = (s) => document.querySelector(s);
const ENSEMBL = "https://rest.ensembl.org";
const setStatus = (el, text, cls = "") => { el.className = `live-dot ${cls}`; el.textContent = text; };
const num = (v, d = 2) => (v == null || isNaN(v) ? "—" : Number(v).toFixed(d));

// No request headers: a GET with custom headers triggers a CORS preflight that some
// public APIs (PubChem among them) do not answer. Ensembl takes its format from the query string.
async function getJSON(url, opts = {}) {
  // One retry: public APIs rate-limit, and a throttled response arrives without CORS headers,
  // which the browser surfaces as a network error rather than a status code.
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(url, opts);
      if (r.status === 429 && attempt < 2) { await wait(1500); continue; }
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return await r.json();
    } catch (e) {
      if (attempt >= 2) throw e;
      await wait(1200);
    }
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const spinner = (msg) => `<div class="empty">${esc(msg)}</div>`;
const errorBox = (e, what) => `<div class="callout warn"><b>Could not reach ${esc(what)}.</b> ${esc(String(e.message || e))}. This tool queries a public API directly from your browser, so a network restriction or an outage will stop it. Everything else on the page still works.</div>`;

/* ======================= 01 · Pharmacogenomics ======================= */
(function pgxTool() {
  const geneSel = $("#pgx-gene"), varList = $("#pgx-variants"), out = $("#pgx-out"), status = $("#pgx-status");
  if (!geneSel) return;
  let gene = "CYP2C19", variant = PGX.CYP2C19.variants[0];

  geneSel.innerHTML = Object.keys(PGX).map((g) => `<option value="${g}">${g}</option>`).join("");

  function paintVariants() {
    varList.innerHTML = PGX[gene].variants.map((v, i) =>
      `<button type="button" data-rs="${v.rs}" aria-pressed="${i === 0}">${v.rs} <small>${esc(v.allele)}</small></button>`).join("");
    variant = PGX[gene].variants[0];
  }
  function summary() {
    const g = PGX[gene];
    return `
      <div class="stat-row">
        <div class="stat"><small>Gene</small><b>${gene}</b><span>CPIC level ${g.cpic}</span></div>
        <div class="stat"><small>Allele</small><b>${esc(variant.allele)}</b><span>${esc(variant.rs)}</span></div>
        <div class="stat"><small>CPIC function</small><b style="font-size:16px">${esc(variant.fn)}</b><span>Curated from CPIC</span></div>
      </div>
      <p class="muted" style="margin:0;font-size:15px;line-height:1.6">${esc(g.role)}</p>
      <div class="chips">${g.drugs.map((d) => `<span class="chip">${esc(d)}</span>`).join("")}</div>
      <div class="callout" style="font-size:14.5px"><b>About this allele.</b> ${esc(variant.note)}</div>
      ${g.caveat ? `<div class="callout warn" style="font-size:14.5px"><b>Important caveat.</b> ${esc(g.caveat)}</div>` : ""}`;
  }
  function render(live) {
    out.innerHTML = summary() + (live || `<div class="empty">Press <b>Query Ensembl</b> to fetch this variant's current annotation.</div>`) +
      `<p class="faint" style="font-size:12.5px;line-height:1.6;margin:0">${esc(PGX_NOTE)}</p>
       <p class="faint" style="font-size:12.5px;line-height:1.6;margin:0"><b>Not clinical advice.</b> A metaboliser phenotype requires a full diplotype, clinical context and a qualified professional. This tool shows one allele at a time.</p>`;
  }

  geneSel.addEventListener("change", () => { gene = geneSel.value; paintVariants(); render(); });
  varList.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-rs]");
    if (!b) return;
    varList.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    variant = PGX[gene].variants.find((v) => v.rs === b.dataset.rs);
    render();
  });

  $("#pgx-fetch").addEventListener("click", async () => {
    setStatus(status, "Querying Ensembl…");
    render(spinner("Contacting the Ensembl REST API…"));
    try {
      const rec = await getJSON(`${ENSEMBL}/variation/human/${variant.rs}?content-type=application/json`);
      const m = (rec.mappings || [])[0] || {};
      let vep = [];
      try {
        const v = await getJSON(`${ENSEMBL}/vep/human/id/${variant.rs}?content-type=application/json`);
        vep = (v[0] && v[0].transcript_consequences) || [];
      } catch { /* VEP is optional; the record alone is still useful */ }

      const terms = {};
      vep.forEach((t) => (t.consequence_terms || []).forEach((c) => { terms[c] = (terms[c] || 0) + 1; }));
      const ranked = Object.entries(terms).sort((a, b) => b[1] - a[1]);
      const genes = [...new Set(vep.map((t) => t.gene_symbol).filter(Boolean))];

      setStatus(status, "Live from Ensembl", "ok");
      render(`
        <div class="table-wrap"><table class="data"><tbody>
          <tr><th scope="row">Assembly</th><td class="mono">${esc(m.assembly_name || "GRCh38")}</td></tr>
          <tr><th scope="row">Location</th><td class="mono">chr${esc(m.seq_region_name || "?")}:${(m.start || 0).toLocaleString()}</td></tr>
          <tr><th scope="row">Alleles</th><td class="mono">${esc(m.allele_string || "—")}</td></tr>
          <tr><th scope="row">Class</th><td>${esc(rec.var_class || "—")}</td></tr>
          <tr><th scope="row">Most severe</th><td class="mono">${esc(rec.most_severe_consequence || "—")}</td></tr>
          <tr><th scope="row">Genes annotated</th><td>${genes.length ? genes.map((g) => `<span class="chip">${esc(g)}</span>`).join(" ") : "—"}</td></tr>
          <tr><th scope="row">Transcript annotations</th><td class="mono">${vep.length}</td></tr>
        </tbody></table></div>
        ${ranked.length ? `<div>
          <span class="f" style="display:block;margin-bottom:8px">Consequence terms across transcripts</span>
          ${ranked.map(([t, n]) => `
            <span style="display:grid;grid-template-columns:minmax(120px,220px) 1fr auto;gap:12px;align-items:center;font-size:13px;margin-bottom:7px">
              <span class="mono faint">${esc(t)}</span>
              <span class="meter"><i style="width:${(n / ranked[0][1]) * 100}%"></i></span>
              <b class="mono" style="font-size:12.5px">${n}</b></span>`).join("")}
        </div>` : ""}
        <div class="callout" style="font-size:14px"><b>Reading this correctly.</b> The consequence terms above describe what the variant does to transcripts. They do not, on their own, establish the allele's effect on drug response — the CPIC function category above does that, and the two can disagree.</div>`);
    } catch (e) {
      setStatus(status, "Unavailable", "err");
      render(errorBox(e, "the Ensembl REST API"));
    }
  });

  paintVariants();
  render();
})();

/* ======================= 02 · Diplotype to phenotype ======================= */
mountDiplotype(document.getElementById("diplo"));

/* ======================= 03 · Variant to protein ======================= */
mountProtein(document.getElementById("protein"));
{
  const w = $("#pr-window"), v = $("#pr-window-v");
  if (w && v) w.addEventListener("input", () => { v.textContent = w.value; });
}

/* ======================= 04 · VCF normalisation ======================= */
mountVcf(document.getElementById("vcf"));

/* ======================= 05 · Read quality control ======================= */
mountFastq(document.getElementById("fastq"));

/* ======================= 06 · Coverage audit ======================= */
mountCoverage(document.getElementById("coverage"));

/* ======================= 07 · Population frequencies ======================= */
(function freqTool() {
  const sel = $("#freq-variant"), dsSel = $("#freq-dataset"), out = $("#freq-out"), status = $("#freq-status");
  if (!sel) return;
  sel.innerHTML = FREQ_VARIANTS.map((v) => `<option value="${v.rs}">${esc(v.label)}</option>`).join("");

  const intro = () => {
    const v = FREQ_VARIANTS.find((x) => x.rs === sel.value);
    return `<p class="muted" style="margin:0;font-size:15px">${esc(v.note)}</p>`;
  };
  const render = (body) => { out.innerHTML = intro() + (body || `<div class="empty">Press <b>Fetch frequencies</b> to query Ensembl.</div>`); };
  sel.addEventListener("change", () => render());

  $("#freq-fetch").addEventListener("click", async () => {
    const rs = sel.value, ds = dsSel.value;
    setStatus(status, "Querying…");
    render(spinner("Fetching population data from Ensembl… this query returns every population record for the variant and can take up to a minute."));
    try {
      const rec = await getJSON(`${ENSEMBL}/variation/human/${rs}?pops=1&content-type=application/json`);
      const want = `gnomADe:` , wantG = `gnomADg:`;
      const prefix = ds === "exomes" ? want : wantG;
      let pops = (rec.populations || []).filter((p) => p.population && p.population.startsWith(prefix));
      if (!pops.length) pops = (rec.populations || []).filter((p) => /gnomAD/i.test(p.population || ""));
      if (!pops.length) throw new Error("No gnomAD population records returned for this variant");

      const m = (rec.mappings || [])[0] || {};
      const alt = (m.allele_string || "/").split("/")[1];
      let rows = pops.filter((p) => p.allele === alt);
      if (!rows.length) rows = pops;
      const agg = {};
      rows.forEach((p) => {
        const key = p.population.split(":").pop();
        if (!(key in agg) || p.frequency > agg[key]) agg[key] = p.frequency;
      });
      const all = agg.ALL; delete agg.ALL;
      const sorted = Object.entries(agg).sort((a, b) => b[1] - a[1]);
      if (!sorted.length) throw new Error("No per-population frequencies available");
      const max = sorted[0][1], min = sorted[sorted.length - 1][1];

      setStatus(status, "Live from Ensembl", "ok");
      render(`
        <div class="stat-row">
          <div class="stat"><small>Allele shown</small><b>${esc(alt || "alt")}</b><span>${esc(m.allele_string || "")}</span></div>
          <div class="stat"><small>Highest</small><b>${(max * 100).toFixed(2)}%</b><span>${esc(POPS[sorted[0][0]] || sorted[0][0])}</span></div>
          <div class="stat"><small>Lowest</small><b>${(min * 100).toFixed(2)}%</b><span>${esc(POPS[sorted[sorted.length - 1][0]] || sorted[sorted.length - 1][0])}</span></div>
          <div class="stat"><small>Spread</small><b>${((max - min) * 100).toFixed(2)}<span style="font-size:13px">pp</span></b><span>${all != null ? `combined ${(all * 100).toFixed(2)}%` : "percentage points"}</span></div>
        </div>
        <div>${sorted.map(([k, v]) => `
          <span style="display:grid;grid-template-columns:minmax(130px,230px) 1fr auto;gap:12px;align-items:center;font-size:13px;margin-bottom:8px">
            <span class="faint">${esc(POPS[k] || k)}</span>
            <span class="meter"><i style="width:${(v / max) * 100}%"></i></span>
            <b class="mono" style="font-size:12.5px">${(v * 100).toFixed(2)}%</b></span>`).join("")}</div>
        <div class="callout warn" style="font-size:14px"><b>How not to read this.</b> These labels are broad continental groupings, assigned for dataset construction. A frequency difference between groups is a fact about population history, not a statement about any individual, and frequency is not effect.</div>`);
    } catch (e) {
      setStatus(status, "Unavailable", "err");
      render(errorBox(e, "the Ensembl REST API"));
    }
  });
  render();
})();

/* ======================= 08 · Molecular explorer ======================= */
(function molTool() {
  const pick = $("#mol-pick"), styleSel = $("#mol-style"), out = $("#mol-out"), status = $("#mol-status");
  if (!pick) return;
  const PUG = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
  pick.innerHTML = COMPOUNDS.map((c) => `<option value="${c.cid}">${esc(c.label)}</option>`).join("");
  let viewer = null, lastSDF = null;

  const shell = (body) => {
    const c = COMPOUNDS.find((x) => String(x.cid) === pick.value);
    out.innerHTML = `<p class="muted" style="margin:0;font-size:15px"><b style="color:#fff">Why this one.</b> ${esc(c.why)}</p>` + body;
  };
  pick.addEventListener("change", () => shell(`<div class="empty">Press <b>Load structure</b> to fetch from PubChem.</div>`));
  styleSel.addEventListener("change", () => { if (viewer && lastSDF) paint3D(lastSDF); });

  function paint3D(sdf) {
    const el = document.getElementById("mol-3d");
    if (!el || !window.$3Dmol) return;
    el.innerHTML = "";
    viewer = window.$3Dmol.createViewer(el, { backgroundColor: "#07070b" });
    viewer.addModel(sdf, "sdf");
    const s = styleSel.value;
    const style = s === "sphere" ? { sphere: { scale: 0.32 } } : s === "line" ? { line: { linewidth: 2 } } : { stick: { radius: 0.14 }, sphere: { scale: 0.22 } };
    viewer.setStyle({}, style);
    viewer.zoomTo();
    viewer.render();
  }

  async function ensure3Dmol() {
    if (window.$3Dmol) return true;
    return new Promise((res) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.4.2/3Dmol-min.js";
      s.onload = () => res(true);
      s.onerror = () => res(false);
      document.head.appendChild(s);
    });
  }

  $("#mol-fetch").addEventListener("click", async () => {
    const cid = pick.value;
    setStatus(status, "Querying PubChem…");
    shell(spinner("Fetching descriptors and 3D conformer…"));
    try {
      const props = "MolecularFormula,MolecularWeight,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,HeavyAtomCount,Charge,IUPACName,ConnectivitySMILES,Title";
      const data = await getJSON(`${PUG}/compound/cid/${cid}/property/${props}/JSON`);
      const P = data.PropertyTable.Properties[0];

      let sdf = null;
      try {
        const r = await fetch(`${PUG}/compound/cid/${cid}/SDF?record_type=3d`);
        if (r.ok) sdf = await r.text();
      } catch { /* 2D fallback below */ }
      if (!sdf) {
        const r2 = await fetch(`${PUG}/compound/cid/${cid}/SDF?record_type=2d`);
        if (r2.ok) sdf = await r2.text();
      }

      const checks = RULES.map((r) => {
        const v = P[r.prop];
        const ok = v == null ? null : r.test(Number(v));
        return { ...r, v, ok };
      });
      const fails = checks.filter((c) => c.ok === false).length;

      setStatus(status, "Live from PubChem", "ok");
      shell(`
        <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px" class="mol-grid">
          <div id="mol-3d" style="height:340px;border-radius:16px;overflow:hidden;border:1px solid var(--line);background:#07070b;position:relative"></div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div>
              <span class="f" style="display:block">PubChem record</span>
              <b style="font-size:19px;letter-spacing:-.01em">${esc(P.Title || P.IUPACName || "CID " + cid)}</b>
              <p class="faint mono" style="margin:4px 0 0;font-size:12px;word-break:break-all">${esc(P.SMILES || P.ConnectivitySMILES || P.CanonicalSMILES || "")}</p>
            </div>
            <div class="table-wrap"><table class="data"><tbody>
              <tr><th scope="row">Formula</th><td class="mono">${esc(P.MolecularFormula || "—")}</td></tr>
              <tr><th scope="row">MW</th><td class="num">${num(P.MolecularWeight)} g/mol</td></tr>
              <tr><th scope="row">XLogP</th><td class="num">${P.XLogP ?? "—"}</td></tr>
              <tr><th scope="row">TPSA</th><td class="num">${P.TPSA ?? "—"} Å²</td></tr>
              <tr><th scope="row">HBD / HBA</th><td class="num">${P.HBondDonorCount ?? "—"} / ${P.HBondAcceptorCount ?? "—"}</td></tr>
              <tr><th scope="row">Rotatable bonds</th><td class="num">${P.RotatableBondCount ?? "—"}</td></tr>
              <tr><th scope="row">Heavy atoms</th><td class="num">${P.HeavyAtomCount ?? "—"}</td></tr>
            </tbody></table></div>
          </div>
        </div>
        <div>
          <span class="f" style="display:block;margin-bottom:8px">Rule filters · ${fails === 0 ? "all pass" : `${fails} violation${fails > 1 ? "s" : ""}`}</span>
          <div class="stat-row">
            ${checks.map((c) => `<div class="stat"><small>${c.set}</small>
              <b style="font-size:15px" class="${c.ok === null ? "" : c.ok ? "rule-ok" : "rule-bad"}">${c.ok === null ? "no data" : c.ok ? "pass" : "fail"}</b>
              <span>${esc(c.name)} · ${c.v ?? "—"}</span></div>`).join("")}
          </div>
        </div>
        <div class="callout warn" style="font-size:14px"><b>What these rules are.</b> Lipinski and Veber are heuristics describing properties common among orally available drugs. They are not predictions of activity, potency or safety, and plenty of successful drugs violate them — several on this list do.</div>
        <p class="faint" style="font-size:12.5px;margin:0">Data from PubChem (NCBI). Structure rendered with 3Dmol.js. Drag to rotate, scroll to zoom.</p>`);

      if (sdf && await ensure3Dmol()) { lastSDF = sdf; paint3D(sdf); }
      else document.getElementById("mol-3d").innerHTML = `<div class="empty">3D viewer unavailable. Descriptors above are unaffected.</div>`;
    } catch (e) {
      setStatus(status, "Unavailable", "err");
      shell(errorBox(e, "PubChem"));
    }
  });
  shell(`<div class="empty">Press <b>Load structure</b> to fetch from PubChem.</div>`);
})();

/* ======================= 09 · Interaction network ======================= */
(function netTool() {
  const geneIn = $("#net-gene"), sizeSel = $("#net-size"), conf = $("#net-conf"), confV = $("#net-conf-v");
  const out = $("#net-out"), info = $("#net-info"), status = $("#net-status");
  if (!geneIn) return;
  let edges = [], hub = "CYP2C19", source = "";

  conf.addEventListener("input", () => { confV.textContent = (conf.value / 100).toFixed(2); if (edges.length) draw(); });

  async function load() {
    hub = geneIn.value.trim().toUpperCase() || "CYP2C19";
    const limit = sizeSel.value;
    setStatus(status, "Querying STRING…");
    out.innerHTML = spinner("Building the network…");
    try {
      const url = `https://string-db.org/api/json/interaction_partners?identifiers=${encodeURIComponent(hub)}&species=9606&limit=${limit}`;
      const data = await getJSON(url);
      if (!Array.isArray(data) || !data.length) throw new Error("No partners returned");
      edges = data.map((d) => [d.preferredName_B || d.preferredName_A, Number(d.score)]);
      source = "STRING (live)";
      setStatus(status, "Live from STRING", "ok");
    } catch (e) {
      const fb = NET_FALLBACK[hub] || NET_FALLBACK.CYP2C19;
      if (!NET_FALLBACK[hub]) hub = "CYP2C19";
      edges = fb.slice(0, Number(sizeSel.value));
      source = "bundled example set";
      setStatus(status, "Offline set", "err");
    }
    draw();
  }

  function draw() {
    const min = conf.value / 100;
    const shown = edges.filter(([, s]) => s >= min);
    const W = 760, H = 480, cx = W / 2, cy = H / 2;

    // Simple radial layout: higher confidence sits closer to the hub.
    const nodes = shown.map(([name, score], i) => {
      const a = (i / shown.length) * Math.PI * 2 - Math.PI / 2;
      // Two rings so labels do not collide when many partners share a similar score.
      const r = 96 + (i % 2) * 46 + (1 - (score - min) / Math.max(0.001, 1 - min)) * 90;
      return { name, score, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });

    const svg = `<svg class="net" viewBox="0 0 ${W} ${H}" role="img" aria-label="Interaction network for ${esc(hub)}">
      ${nodes.map((n) => `<line x1="${cx}" y1="${cy}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}" stroke-width="${(0.4 + n.score * 2).toFixed(2)}" opacity="${(0.25 + n.score * 0.5).toFixed(2)}"/>`).join("")}
      ${nodes.map((n) => `<g class="node" data-n="${esc(n.name)}" data-s="${n.score}">
          <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${(10 + n.score * 11).toFixed(1)}" fill="#2fa7a0" opacity="${(0.4 + n.score * 0.5).toFixed(2)}"/>
          <text x="${n.x.toFixed(1)}" y="${(n.y + 4).toFixed(1)}" text-anchor="middle" font-size="10">${esc(n.name)}</text>
        </g>`).join("")}
      <g class="node">
        <circle cx="${cx}" cy="${cy}" r="34" fill="#4d7dff" stroke="#fff" stroke-width="2"/>
        <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="12">${esc(hub)}</text>
      </g>
    </svg>`;

    const scores = shown.map((s) => s[1]);
    const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    out.innerHTML = svg + `
      <div class="stat-row">
        <div class="stat"><small>Partners shown</small><b>${shown.length}</b><span>of ${edges.length} retrieved</span></div>
        <div class="stat"><small>Degree of hub</small><b>${shown.length}</b><span>at threshold ${(conf.value / 100).toFixed(2)}</span></div>
        <div class="stat"><small>Mean confidence</small><b>${mean.toFixed(3)}</b><span>of shown edges</span></div>
        <div class="stat"><small>Source</small><b style="font-size:15px">${esc(source)}</b><span>Homo sapiens</span></div>
      </div>
      <div class="callout" style="font-size:14px"><b>Try this.</b> Raise the confidence threshold and watch which partners survive. The hub's degree is entirely a function of where you draw that line — which is the main reason raw degree centrality is a weak basis for calling a protein important.</div>
      ${source.includes("bundled") ? `<div class="callout warn" style="font-size:14px"><b>Using the bundled set.</b> The STRING API could not be reached from your browser, usually because of cross-origin restrictions. The relationships shown are an illustrative example set, not live STRING confidence scores. Try CYP2C19, APOE or TP53.</div>` : ""}`;

    info.innerHTML = `<div class="opt-list">${shown.slice(0, 8).map(([n, s]) =>
      `<button type="button"><span>${esc(n)}</span><small>${s.toFixed(2)}</small></button>`).join("")}</div>`;
  }

  $("#net-fetch").addEventListener("click", load);
  geneIn.addEventListener("keydown", (e) => { if (e.key === "Enter") load(); });
  load();
})();

/* ======================= 10 · Statistics studio ======================= */
(function statsTool() {
  const modes = $("#stat-mode"), controls = $("#stat-controls"), out = $("#stat-out");
  if (!modes) return;
  // ?stat=expr opens the studio on a particular view, so a project can link straight to its own figure.
  const wanted = new URLSearchParams(location.search).get("stat");
  let mode = ["manhattan", "qq", "expr"].includes(wanted) ? wanted : "manhattan";
  modes.querySelectorAll("button[data-m]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === mode)));

  function render() {
    controls.innerHTML = STAT_CONTROLS[mode] || "";
    const fn = { manhattan: drawManhattan, qq: drawQQ, expr: drawExpression }[mode];
    out.innerHTML = fn(controls);
    controls.querySelectorAll("input,select").forEach((el) => {
      el.addEventListener("input", () => { out.innerHTML = fn(controls); });
    });
  }
  modes.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-m]");
    if (!b) return;
    modes.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    mode = b.dataset.m;
    render();
  });
  render();
})();
