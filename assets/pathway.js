// PhD and industry pathway pages: curated evidence lists drawn from the same project data.
import { THEMES } from "./data.js";
import { WORK, PROPOSALS } from "./projects-data.js";
import { mountChrome, icon, esc, statusPill } from "./ui.js";

mountChrome(location.pathname.split("/").pop() || "phd.html");
document.querySelectorAll("[data-ico]").forEach((el) => { el.innerHTML = icon(el.dataset.ico); });

const find = (id) => WORK.find((p) => p.id === id) || PROPOSALS.find((p) => p.id === id);

function rows(list, target) {
  const el = document.getElementById(target);
  if (!el) return;
  el.innerHTML = list.map(({ id, note, href }) => {
    const p = find(id);
    const t = THEMES[p.theme];
    const link = href || (WORK.includes(p) ? `project.html?p=${p.id}` : `research.html#${p.id}`);
    return `<a class="row" style="--c:${t.c}" href="${link}">
      <span class="icon sm" style="--c:${t.c}">${icon(t.icon)}</span>
      <span class="row-txt"><b>${esc(p.title.length > 44 ? p.title.slice(0, 42) + "…" : p.title)}</b><span>${esc(note)}</span></span>
      <span class="go">${icon("chev")}</span></a>`;
  }).join("");
}

/* ---------- PhD page ---------- */
const evidence = document.getElementById("evidence");
if (evidence) {
  const items = [
    { id: "gwas-real", lead: "Catching a silent failure", why: "An annotation pipeline reported no overlapping gene for a well-known MTHFR variant because the interval was wrong. Finding it required testing against a case whose answer was already known — which is the habit I would want a supervisor to see first." },
    { id: "vep-apoe", lead: "Reporting an inconvenient result", why: "SIFT predicts 'tolerated' for one of the best-characterised functional coding variants in human genetics. Rather than omit it, the project makes the disagreement the central finding and explains why conservation-based predictors behave this way." },
    { id: "pgx-cyp2c19", lead: "Keeping layers of evidence separate", why: "The most frequent VEP consequence for CYP2C19*2 is synonymous, which understates an allele whose loss of function is a splicing effect. The project keeps genomic annotation and pharmacogenomic interpretation in separate columns so the two cannot be conflated." },
    { id: "gene-expr", lead: "Declining to over-claim", why: "A fold-change analysis with a single value per condition supports no statistical test, and the project says so explicitly instead of implying significance. Knowing what a dataset cannot support is the part I would most want assessed." },
  ];
  evidence.innerHTML = items.map(({ id, lead, why }, i) => {
    const p = find(id), t = THEMES[p.theme];
    return `<article class="t-item glass" style="--c:${t.c}">
      <div>
        <p class="when">Evidence ${String(i + 1).padStart(2, "0")}</p>
        <span class="icon" style="--c:${t.c};margin-top:10px">${icon(t.icon)}</span>
      </div>
      <div>
        <h3>${esc(lead)}</h3>
        <p>${esc(why)}</p>
        <div class="actions-row" style="display:flex;gap:12px;align-items:center;margin-top:16px;flex-wrap:wrap">
          ${statusPill(p.status)}
          <a class="study-link" href="project.html?p=${p.id}">${esc(p.title)} ${icon("chev")}</a>
        </div>
      </div>
    </article>`;
  }).join("");

  rows([
    { id: "multi-omics", note: "Flagship proposal: integration and subtyping" },
    { id: "single-cell", note: "Proposal: cellular heterogeneity" },
    { id: "cancer-ml", note: "Proposal: biomarkers and survival analysis" },
    { id: "pgx-cyp2c19", note: "Published: evidence-graded interpretation" },
  ], "ucl-rows");

  rows([
    { id: "pgx-cyp2c19", note: "Published: pharmacogenomics" },
    { id: "drug-discovery", note: "Proposal: molecular discovery from my dissertation" },
    { id: "networks", note: "Proposal: network-based target investigation" },
    { id: "pop-freq", note: "Published: population genetics" },
  ], "syd-rows");
}

/* ---------- Industry page ---------- */
const roleGrid = document.getElementById("roles");
if (roleGrid) {
  const ROLES = [
    { role: "Bioinformatician", look: ["pgx-cyp2c19", "gwas-real", "pipeline"], c: "#36b6c9", icon: "dna" },
    { role: "Computational biologist", look: ["networks", "single-cell", "vep-apoe"], c: "#2fa7a0", icon: "network" },
    { role: "Computational chemist", look: ["drug-discovery", "pgx-cyp2c19"], c: "#7c8cff", icon: "atom" },
    { role: "Precision medicine scientist", look: ["pgx-cyp2c19", "pop-freq", "multi-omics"], c: "#4d7dff", icon: "pill" },
    { role: "ML / data scientist, R&D", look: ["cancer-ml", "literature", "forgelab"], c: "#5b6cf0", icon: "cpu" },
    { role: "Scientific software engineer", look: ["forgelab", "gradify", "pipeline"], c: "#8a96ad", icon: "code" },
  ];
  roleGrid.innerHTML = ROLES.map((r) => `
    <div class="theme-card glass" style="--c:${r.c}">
      <span class="icon" style="--c:${r.c}">${icon(r.icon)}</span>
      <h3>${esc(r.role)}</h3>
      <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px">
        ${r.look.map((id) => {
          const p = find(id);
          const link = WORK.includes(p) ? `project.html?p=${p.id}` : `research.html#${p.id}`;
          return `<li><a class="study-link" href="${link}">${icon("chev")} ${esc(p.title.length > 40 ? p.title.slice(0, 38) + "…" : p.title)}</a></li>`;
        }).join("")}
      </ul>
    </div>`).join("");
}
