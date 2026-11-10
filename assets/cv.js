// CV page. One set of facts, two emphases: academic leads with research reasoning,
// industry leads with engineering and delivery.
import { PERSON, THEMES, REPOS } from "./data.js";
import { WORK, PROPOSALS } from "./projects-data.js";
import { MATRIX } from "./skills-data.js";
import { mountChrome, icon, esc } from "./ui.js";

mountChrome("cv.html");
document.querySelectorAll("[data-ico]").forEach((el) => { el.innerHTML = icon(el.dataset.ico); });
document.getElementById("cv-email").textContent = PERSON.email;
document.getElementById("print").addEventListener("click", () => window.print());

const PROFILE = {
  academic: "Medicinal chemistry graduate developing independent research in computational biology and bioinformatics. Ten published computational analyses covering variant annotation, pharmacogenomics, population genetics and statistical genetics, each documented with its methods and limitations. Particular interest in precision medicine, multi-omics integration and the point where molecular detail becomes systems-level behaviour. Experimental background in catalytic synthesis, analytical characterisation and molecular docking. Seeking doctoral research in computational biology or precision medicine.",
  industry: "Computational scientist with a medicinal chemistry foundation and production software engineering experience. Builds genomic and pharmacogenomic analyses against live public APIs, and runs two production systems covering PostgreSQL schema design, sandboxed untrusted code execution, automated testing and continuous deployment. Comfortable across the full path from biological question to reproducible, maintainable implementation. Seeking a computational biology, bioinformatics or scientific software role.",
};
const TAGLINE = {
  academic: "Computational biology · bioinformatics · medicinal chemistry",
  industry: "Computational biology · scientific software · data engineering",
};

const ORDER = {
  academic: ["pgx-cyp2c19", "pop-freq", "vep-apoe", "gwas-real", "drug-gene", "gene-expr", "gwas-viz", "gwas-assoc", "gwas-gene", "gwas-qc"],
  industry: ["pgx-cyp2c19", "gwas-real", "vep-apoe", "gwas-qc", "pop-freq", "drug-gene", "gene-expr", "gwas-viz", "gwas-assoc", "gwas-gene"],
};

const repoNote = (p) => {
  if (!p.repo) return "";
  return REPOS[p.repo]
    ? ` <span class="mono faint">github.com/seren-aitchison/${esc(p.repo)}</span>`
    : ` <span class="mono faint">code on request</span>`;
};

function render(mode) {
  document.getElementById("cv-tagline").textContent = TAGLINE[mode];
  document.getElementById("cv-profile").textContent = PROFILE[mode];

  const research = ORDER[mode].map((id) => WORK.find((p) => p.id === id)).filter(Boolean);
  document.getElementById("cv-research").innerHTML = research.map((p) => {
    const detail = mode === "academic"
      ? (p.findings || []).slice(0, 2).map((f) => (Array.isArray(f) ? `${f[0]}: ${String(f[1]).replace(/<[^>]+>/g, "")}` : f)).join(" · ")
      : (p.tags || []).join(", ");
    return `<div style="margin-bottom:16px">
      <h4 style="margin:0;font-size:16px">${esc(p.title)}</h4>
      <p class="muted" style="margin:3px 0 0;font-size:14.5px;line-height:1.6">${esc(p.short)}</p>
      <p class="faint" style="margin:3px 0 0;font-size:13px;line-height:1.6">${esc(detail)}${detail && p.repo ? " · " : ""}${repoNote(p)}</p>
    </div>`;
  }).join("");

  const software = WORK.filter((p) => p.theme === "eng");
  document.getElementById("cv-software").innerHTML = software.map((p) => `
    <div style="margin-bottom:16px">
      <h4 style="margin:0;font-size:16px">${esc(p.title)}${p.external ? ` <span class="mono faint" style="font-weight:400">${esc(p.external.replace("https://", ""))}</span>` : ""}</h4>
      <p class="muted" style="margin:3px 0 0;font-size:14.5px;line-height:1.6">${esc(p.short)}</p>
      <ul style="margin:6px 0 0;padding-left:18px;color:#cfcfcf;line-height:1.65;font-size:14.5px">
        ${p.methods.slice(0, mode === "industry" ? 5 : 3).map((m) => `<li>${esc(m)}</li>`).join("")}
      </ul>
    </div>`).join("");

  const skills = mode === "industry"
    ? [...MATRIX].sort((a, b) => {
        const rank = (x) => (/Software|Data engineering|Programming|Machine/.test(x[0]) ? 0 : 1);
        return rank(a) - rank(b);
      })
    : MATRIX;
  document.getElementById("cv-skills").innerHTML = skills.map(([a, t]) =>
    `<tr><th scope="row" style="white-space:nowrap">${esc(a)}</th><td>${esc(t)}</td></tr>`).join("");

  const props = mode === "academic" ? PROPOSALS : PROPOSALS.filter((p) => ["pipeline", "cancer-ml", "drug-discovery", "literature"].includes(p.id));
  document.getElementById("cv-proposals").innerHTML = props.map((p) => `
    <div style="margin-bottom:12px">
      <h4 style="margin:0;font-size:15.5px">${esc(p.title)} <span class="faint" style="font-weight:400">· ${esc(THEMES[p.theme].name)}</span></h4>
      <p class="muted" style="margin:3px 0 0;font-size:14px;line-height:1.6">${esc(p.question)}</p>
    </div>`).join("");
}

const tabs = document.getElementById("cv-mode");
tabs.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-m]");
  if (!b) return;
  tabs.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  render(b.dataset.m);
});
render("academic");
