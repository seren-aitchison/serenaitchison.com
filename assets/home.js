// Homepage: workbench, rotating spotlight, theme tiles, status ring, capability bubbles, featured grid.
import { THEMES, STATUS } from "./data.js";
import { WORK, PROPOSALS } from "./projects-data.js";
import { SKILLS, GROUPS } from "./skills-data.js";
import { mountChrome, icon, esc, projectCard, statusPill } from "./ui.js";

mountChrome("index.html");

/* ---------------- Workbench ---------------- */
const VIEWS = [
  { id: "overview", name: "Overview", icon: "grid" },
  { id: "variant", name: "Variant", icon: "dna" },
  { id: "molecule", name: "Molecule", icon: "atom" },
  { id: "stats", name: "Statistics", icon: "chart" },
];
const side = document.getElementById("bench-side");
const main = document.getElementById("bench-main");

if (side && main) {
  side.innerHTML =
    `<span class="sep">Workbench</span>` +
    VIEWS.map((v, i) => `<button type="button" role="tab" data-v="${v.id}" aria-selected="${i === 0}">${icon(v.icon)}<span>${v.name}</span></button>`).join("") +
    `<span class="sep">Go to</span>` +
    [["Projects", "projects.html", "layers"], ["Lab", "lab.html", "beaker"], ["Research", "research.html", "book"], ["CV", "cv.html", "doc"]]
      .map(([t, h, ic]) => `<button type="button" onclick="location.href='${h}'">${icon(ic)}<span>${t}</span></button>`).join("");

  const pubCount = WORK.filter((p) => p.status === "pub").length;

  const panels = {
    overview: () => `
      <div class="panel glass">
        <div class="who">
          <span class="avatar">SA</span>
          <span><b>Seren Aitchison</b><span>Medicinal chemistry → computational biology</span></span>
        </div>
        <dl class="kv">
          <dt>Degree</dt><dd>BSc Medicinal Chemistry</dd>
          <dt>Institution</dt><dd>Cardiff University</dd>
          <dt>Focus</dt><dd>Pharmacogenomics, omics, ML</dd>
          <dt>Seeking</dt><dd>PhD / computational role</dd>
        </dl>
        <div class="chips"><span class="chip">Python</span><span class="chip">Ensembl</span><span class="chip">RDKit</span><span class="chip">SQL</span></div>
      </div>
      <div class="panel glass feature-card span2">
        <span class="pill-white" style="align-self:flex-start">Signature project</span>
        <h3 style="font-size:24px;letter-spacing:-.02em;margin:6px 0 0">Computational pharmacogenomics</h3>
        <p style="margin:0;color:rgba(255,255,255,.8);font-size:15px;line-height:1.55">Four published analyses becoming one evidence-graded platform: variant annotation from Ensembl, star-allele function from CPIC, and a clear line between what the annotation shows and what the evidence supports.</p>
        <div class="stat-row">
          <div class="stat"><small>VEP annotations</small><b>66</b><span>rs4244285, 5 consequence types</span></div>
          <div class="stat"><small>Frequency spread</small><b>15.85<span style="font-size:14px">pp</span></b><span>rs429358 across gnomAD groups</span></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:auto">
          <a class="btn btn-primary btn-sm lg" href="project.html?p=pgx-cyp2c19"><span>Read it</span></a>
          <a class="btn btn-ghost btn-sm lg" href="lab.html#pgx"><span>Open the explorer</span></a>
        </div>
      </div>
      <div class="panel glass">
        <div class="panel-head"><h3>Published</h3><span class="live-dot ok">${pubCount} analyses</span></div>
        <div class="feed">
          ${WORK.filter((p) => p.status === "pub").slice(0, 5).map((p) => `
            <a class="feed-row" href="project.html?p=${p.id}">
              <span class="icon sm" style="--c:${THEMES[p.theme].c}">${icon(THEMES[p.theme].icon)}</span>
              <span class="t"><b>${esc(p.title.length > 38 ? p.title.slice(0, 36) + "…" : p.title)}</b><span>${esc(THEMES[p.theme].name)}</span></span>
              <em>${p.n}</em>
            </a>`).join("")}
        </div>
      </div>
      <div class="panel glass span2">
        <div class="panel-head"><h3>Research themes</h3><a class="see" href="research.html">Open</a></div>
        <div class="rows">
          ${[["Precision medicine and multi-omics", "#36b6c9"], ["Computational genomics", "#3f9be0"], ["Computational drug discovery", "#7c8cff"]].map(([t, c]) => `
            <span class="row" style="--c:${c}"><span class="icon sm" style="--c:${c}">${icon("dna")}</span><span class="row-txt"><b>${t}</b></span></span>`).join("")}
        </div>
      </div>
      <div class="panel glass">
        <div class="panel-head"><h3>In the Lab</h3></div>
        <div class="rows">
          ${[["Pharmacogenomics", "lab.html#pgx", "pill"], ["Diplotypes", "lab.html#diplo", "target"], ["Molecules", "lab.html#mol", "atom"]].map(([t, h, ic]) => `
            <a class="row" style="--c:#4d7dff" href="${h}"><span class="icon sm" style="--c:#4d7dff">${icon(ic)}</span><span class="row-txt"><b>${t}</b></span><span class="go">${icon("chev")}</span></a>`).join("")}
        </div>
      </div>`,

    variant: () => `
      <div class="panel glass span2">
        <div class="panel-head"><h3>rs4244285 · CYP2C19*2</h3><span class="live-dot ok">Ensembl GRCh38</span></div>
        <dl class="kv">
          <dt>Location</dt><dd class="mono">chr10:94,781,859</dd>
          <dt>Alleles</dt><dd class="mono">G/A/C/T</dd>
          <dt>Class</dt><dd>SNP</dd>
          <dt>Gene</dt><dd>CYP2C19</dd>
          <dt>Drug</dt><dd>Clopidogrel</dd>
          <dt>Function</dt><dd>Reduced function</dd>
        </dl>
        <div class="callout" style="font-size:14px">The most frequent consequence term returned is <code>synonymous_variant</code>. The allele's loss of function is a splicing effect, so the transcript label alone understates it.</div>
      </div>
      <div class="panel glass">
        <div class="panel-head"><h3>Consequences</h3></div>
        ${bars([["synonymous", 36], ["syn + NMD", 18], ["3′ UTR + NMD", 6], ["non-coding exon", 3], ["intron", 3]], "#4d7dff")}
        <p class="tip"><span class="dot" aria-hidden="true"></span> 66 transcript annotations</p>
      </div>
      <div class="panel glass wide">
        <div class="panel-head"><h3>rs429358 (APOE) · C allele frequency by gnomAD group</h3><a class="see" href="lab.html#freq">Explore</a></div>
        ${bars([["afr", 22.66], ["fin", 19.12], ["nfe", 15.14], ["amr", 10.43], ["sas", 10.04], ["eas", 9.79], ["mid", 6.81]], "#36b6c9", "%")}
      </div>`,

    molecule: () => `
      <div class="panel glass">
        <div class="panel-head"><h3>Scaffold origin</h3></div>
        <p style="margin:0;color:var(--mute);font-size:14.5px;line-height:1.6">My dissertation synthesised and characterised a biobased heterocyclic scaffold derived from furfural, using catalytic routes and analytical characterisation, with docking to explore binding.</p>
        <div class="chips"><span class="chip">Furfural</span><span class="chip">Catalysis</span><span class="chip">TGA · TEM · GC</span><span class="chip">Docking</span></div>
        <a class="btn btn-ghost btn-sm lg" style="align-self:flex-start;margin-top:auto" href="about.html#dissertation"><span>Case study</span></a>
      </div>
      <div class="panel glass span2">
        <div class="panel-head"><h3>Descriptor profiling</h3><span class="live-dot">Lab tool</span></div>
        <p style="margin:0;color:var(--mute);font-size:14.5px;line-height:1.6">The molecular explorer pulls descriptors from PubChem and checks them against Lipinski and Veber rules, with the structure rendered in 3D.</p>
        <div class="stat-row">
          <div class="stat"><small>Rules checked</small><b>Lipinski</b><span>MW, logP, HBD, HBA</span></div>
          <div class="stat"><small>Plus</small><b>Veber</b><span>TPSA, rotatable bonds</span></div>
        </div>
        <a class="btn btn-primary btn-sm lg" style="align-self:flex-start;margin-top:auto" href="lab.html#mol"><span>Open the explorer</span></a>
      </div>
      <div class="panel glass wide">
        <div class="callout warn" style="font-size:14px"><b>A note on docking.</b> Docking scores rank poses. They are not binding affinities and they do not establish biological activity. Any project here that uses docking says so in its limitations.</div>
      </div>`,

    stats: () => `
      <div class="panel glass span2">
        <div class="panel-head"><h3>Differential expression · fold change</h3><a class="see" href="project.html?p=gene-expr">Project</a></div>
        ${bars([["EGFR", 2.0], ["BRCA1", 1.8], ["MYC", 1.75], ["AKT1", 1.19], ["MTHFR", 0.95], ["TP53", 0.93], ["ESR1", 0.5], ["PTEN", 0.5]], "#36b6c9", "×")}
        <p class="tip"><span class="dot" aria-hidden="true"></span> Descriptive only: one value per condition means no statistical test is possible</p>
      </div>
      <div class="panel glass">
        <div class="panel-head"><h3>Project status</h3></div>
        <div class="feed">
          ${Object.entries(STATUS).map(([k, s]) => {
            const n = k === "prop" ? PROPOSALS.length : WORK.filter((p) => p.status === k).length;
            return n ? `<span class="feed-row"><span class="t"><b>${s.label}</b></span><em>${n}</em></span>` : "";
          }).join("")}
        </div>
        <p class="tip"><span class="dot" aria-hidden="true"></span> Nothing is listed as finished unless it is</p>
      </div>`,
  };

  function bars(rows, c, unit = "") {
    const max = Math.max(...rows.map((r) => r[1]));
    return `<div style="display:flex;flex-direction:column;gap:9px">${rows.map(([n, v]) => `
      <span style="display:grid;grid-template-columns:92px 1fr auto;gap:10px;align-items:center;font-size:13px">
        <span class="mono faint">${esc(n)}</span>
        <span class="meter"><i style="width:${(v / max) * 100}%;background:linear-gradient(90deg,${c},#6ad7e5)"></i></span>
        <b class="mono" style="font-size:12.5px">${v}${unit}</b>
      </span>`).join("")}</div>`;
  }

  const render = (id) => { main.innerHTML = (panels[id] || panels.overview)(); };
  side.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]");
    if (!b) return;
    side.querySelectorAll("button[data-v]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    render(b.dataset.v);
  });
  render("overview");
}

/* ---------------- Rotating spotlight ---------------- */
const FEATURED = ["crc-plasticity", "crc-drivers", "pgx-cyp2c19", "gwas-real"];
const spot = document.getElementById("spotlight");
if (spot) {
  const items = FEATURED.map((id) => WORK.find((p) => p.id === id)).filter(Boolean);
  const dots = document.getElementById("spot-dots");
  const body = document.getElementById("spot-body");
  const sphere = document.getElementById("spot-sphere");
  let i = 0, timer;

  dots.innerHTML = items.map((p, n) => `<button type="button" role="tab" aria-current="${n === 0}" aria-label="${esc(p.title)}"></button>`).join("");

  function show(n, user) {
    i = (n + items.length) % items.length;
    const p = items[i], t = THEMES[p.theme];
    spot.style.setProperty("--c", t.c);
    spot.style.setProperty("--glow", hexRgb(t.c));
    sphere.innerHTML = icon(t.icon);
    body.className = "spot-body in";
    body.innerHTML = `
      <div class="spot-top">${statusPill(p.status)}<span class="pill-dark">${t.name}</span></div>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.short)}</p>
      <div class="spot-actions">
        <a class="btn btn-light btn-sm lg" href="project.html?p=${p.id}"><span>Read the project</span> <span aria-hidden="true">→</span></a>
        <span class="spot-domain">${p.n} / ${String(items.length).padStart(2, "0")}</span>
      </div>`;
    dots.querySelectorAll("button").forEach((b, n2) => b.setAttribute("aria-current", String(n2 === i)));
    setTimeout(() => body.classList.remove("in"), 600);
    if (user) { clearInterval(timer); timer = setInterval(() => show(i + 1), 7000); }
  }
  const hexRgb = (h) => [1, 3, 5].map((s) => parseInt(h.slice(s, s + 2), 16)).join(", ");
  dots.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) show([...dots.children].indexOf(b), true);
  });
  show(0);
  timer = setInterval(() => show(i + 1), 7000);
}

/* ---------------- Theme tiles ---------------- */
const tiles = document.getElementById("theme-tiles");
if (tiles) {
  tiles.innerHTML = Object.entries(THEMES).map(([k, t]) =>
    `<a href="projects.html?theme=${k}" style="--c:${t.c}" title="${esc(t.name)}" aria-label="${esc(t.name)}">${icon(t.icon)}</a>`).join("");
  const tip = tiles.parentElement.querySelector(".tip");
  const base = tip.innerHTML;
  tiles.addEventListener("mouseover", (e) => {
    const a = e.target.closest("a");
    if (a) tip.innerHTML = `<span class="dot" aria-hidden="true"></span> ${esc(a.title)}`;
  });
  tiles.addEventListener("mouseleave", () => { tip.innerHTML = base; });
}

/* ---------------- Status ring ---------------- */
const ring = document.getElementById("status-ring");
if (ring) {
  const counts = [
    ["pub", WORK.filter((p) => p.status === "pub").length, "#4fe0a6"],
    ["live", WORK.filter((p) => p.status === "live").length, "#4d7dff"],
    ["dev", WORK.filter((p) => p.status === "dev").length, "#ffc24b"],
    ["prop", PROPOSALS.length, "#6ad7e5"],
  ].filter((c) => c[1] > 0);
  const total = counts.reduce((a, c) => a + c[1], 0);
  const R = 76, C = 2 * Math.PI * R;
  let off = 0;
  const segs = counts.map(([, n, col]) => {
    const len = (n / total) * C - 3;
    const s = `<circle class="seg" cx="88" cy="88" r="${R}" stroke="${col}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}"/>`;
    off += (n / total) * C;
    return s;
  }).join("");
  ring.innerHTML = `<svg viewBox="0 0 176 176" aria-hidden="true"><circle class="track" cx="88" cy="88" r="${R}"/>${segs}</svg>
    <span class="ring-label"><b>${total}</b><span>pieces of work</span></span>`;
  document.getElementById("status-legend").innerHTML = counts.map(([k, n, col]) =>
    `<span style="--c:${col}"><i aria-hidden="true"></i>${STATUS[k].label}<b>${n}</b></span>`).join("");
}

/* ---------------- Start here ---------------- */
const rows = document.getElementById("start-rows");
if (rows) {
  rows.innerHTML = [
    ["crc-plasticity", "A finding, from public data"],
    ["crc-drivers", "When the signal is mostly stroma"],
    ["pgx-cyp2c19", "Where annotation stops being enough"],
    ["gwas-real", "A pipeline failing silently"],
  ].map(([id, why]) => {
    const p = WORK.find((x) => x.id === id), t = THEMES[p.theme];
    return `<a class="row" style="--c:${t.c}" href="project.html?p=${p.id}">
      <span class="icon sm" style="--c:${t.c}">${icon(t.icon)}</span>
      <span class="row-txt"><b>${esc(why)}</b><span>${esc(p.title)}</span></span>
      <span class="go">${icon("chev")}</span></a>`;
  }).join("");
}

/* ---------------- Capability bubbles ---------------- */
const tabs = document.getElementById("cap-tabs");
const field = document.getElementById("cap-bubbles");
const detail = document.getElementById("cap-detail");
if (tabs && field) {
  tabs.innerHTML = GROUPS.map(([k, n], i) => `<button type="button" data-g="${k}" aria-pressed="${i === 0}">${n}</button>`).join("");
  field.innerHTML = SKILLS.map((s, i) => `
    <button type="button" class="bubble ${s.size}" data-id="${s.id}" data-g="${s.group}"
      style="--c:${s.c};--t:${(5 + (i % 5) * 0.7).toFixed(1)}s;--d:-${(i % 7) * 0.8}s">
      <span class="b-ico">${icon(s.icon)}</span><span class="b-name">${esc(s.name)}</span>
    </button>`).join("");

  function showSkill(id) {
    const s = SKILLS.find((x) => x.id === id);
    field.querySelectorAll(".bubble").forEach((b) => b.classList.toggle("sel", b.dataset.id === id));
    detail.innerHTML = `
      <span class="icon" style="--c:${s.c}">${icon(s.icon)}</span>
      <span class="kind">${esc((GROUPS.find((g) => g[0] === s.group) || [, "Capability"])[1])}</span>
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.what)}</p>
      <span class="kind">Used in</span>
      <ul>${s.where.map((w) => `<li><a href="${w.h}">${esc(w.t)} <span>→</span></a></li>`).join("")}</ul>`;
  }
  field.addEventListener("click", (e) => {
    const b = e.target.closest(".bubble");
    if (b) showSkill(b.dataset.id);
  });
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-g]");
    if (!b) return;
    tabs.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const g = b.dataset.g;
    field.querySelectorAll(".bubble").forEach((x) => x.classList.toggle("dim", g !== "all" && x.dataset.g !== g));
  });
  showSkill("ensembl");
}

/* ---------------- Featured grid ---------------- */
const grid = document.getElementById("featured-grid");
if (grid) {
  grid.innerHTML = ["crc-plasticity", "crc-drivers", "pgx-cyp2c19", "gwas-real"]
    .map((id) => WORK.find((p) => p.id === id))
    .map((p) => projectCard(p, { theme: THEMES[p.theme] })).join("");
}

/* ---------------- Inline icon placeholders ---------------- */
document.querySelectorAll("[data-ico]").forEach((el) => { el.innerHTML = icon(el.dataset.ico); });
