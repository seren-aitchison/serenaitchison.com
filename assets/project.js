// Project detail page, laid out like a short paper: question, background, methods,
// findings, discussion, limitations, reproducibility.
import { THEMES } from "./data.js";
import { WORK } from "./projects-data.js";
import { mountChrome, icon, esc, statusPill, repoLink } from "./ui.js";
import { renderFigure } from "./figures.js";

mountChrome("projects.html");

const id = new URLSearchParams(location.search).get("p");
const p = WORK.find((x) => x.id === id);
const main = document.getElementById("main");

if (!p) {
  main.innerHTML = `<section class="page-hero center">
    <span class="eyebrow">Not found</span>
    <h1>No project with that name.</h1>
    <p class="lede">The link may be out of date.</p>
    <div class="actions"><a class="btn btn-primary lg" href="projects.html"><span>All projects</span> <span aria-hidden="true">→</span></a></div>
  </section>`;
} else {
  const t = THEMES[p.theme];
  document.title = `${p.title} · Seren Aitchison`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", p.short);
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", `https://serenaitchison.com/project.html?p=${p.id}`);

  const idx = WORK.indexOf(p);
  const next = WORK[(idx + 1) % WORK.length];
  const prev = WORK[(idx - 1 + WORK.length) % WORK.length];

  const sections = [
    ["question", "Research question"],
    ["background", "Scientific background"],
    ["methods", "Data and methodology"],
    p.findings ? ["findings", "Findings"] : null,
    p.discussion ? ["discussion", "Discussion"] : null,
    ["limitations", "Limitations"],
    ["repro", "Reproducibility"],
  ].filter(Boolean);

  const findingsBlock = () => {
    if (!p.findings) return "";
    const rows = p.findings.map((f) => Array.isArray(f)
      ? `<tr><th scope="row">${esc(f[0])}</th><td>${f[1]}</td></tr>`
      : `<tr><td colspan="2">${f}</td></tr>`).join("");
    return `<div class="table-wrap"><table class="data"><caption class="sr-only">Findings</caption><tbody>${rows}</tbody></table></div>`;
  };

  main.innerHTML = `
  <section class="page-hero">
    <p class="eyebrow">Project ${p.n} · ${esc(t.name)}</p>
    <h1>${esc(p.title)}</h1>
    <p class="lede">${esc(p.short)}</p>
    <div class="actions">
      ${statusPill(p.status)}
      ${repoLink(p.repo)}
      ${p.code ? `<a class="btn btn-ghost btn-sm lg" href="https://github.com/seren-aitchison/serenaitchison.com/tree/main/${p.code}" rel="noopener">${icon("github")}<span>Analysis code</span></a>` : ""}
      ${p.lab ? `<a class="btn btn-gem lg" href="${p.lab}"><span class="gem" aria-hidden="true"></span><span>Open in the Lab</span></a>` : ""}
      ${p.external ? `<a class="btn btn-ghost btn-sm lg" href="${p.external}" rel="noopener">${icon("ext")}<span>Visit the site</span></a>` : ""}
    </div>
    <div class="meta-strip">
      ${(p.tags || []).map((x) => `<span><b>${esc(x)}</b></span>`).join("")}
    </div>
  </section>

  ${p.pipeline ? `<section class="section" aria-label="Workflow">
    <div class="pipeline">
      ${p.pipeline.map(([a, b]) => `<div class="step"><small>${esc(a)}</small><b>${esc(b)}</b></div>`).join("")}
    </div>
  </section>` : ""}

  <div class="paper">
    <nav class="toc" aria-label="On this page">
      ${sections.map(([k, n], i) => `<a href="#${k}">${String(i + 1).padStart(2, "0")} · ${esc(n)}</a>`).join("")}
    </nav>
    <article class="prose">
      <section id="question">
        <h2><span class="n">01</span> Research question</h2>
        <p style="font-size:19px;color:#e8e8e8">${esc(p.question)}</p>
      </section>

      <section id="background">
        <h2><span class="n">02</span> Scientific background</h2>
        <p>${esc(p.background)}</p>
      </section>

      <section id="methods">
        <h2><span class="n">03</span> Data and methodology</h2>
        <ul>${p.methods.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
      </section>

      ${p.findings ? `<section id="findings">
        <h2><span class="n">04</span> Findings</h2>
        ${findingsBlock()}
        ${renderFigure(p.id)}
      </section>` : ""}

      ${p.discussion ? `<section id="discussion">
        <h2><span class="n">0${p.findings ? 5 : 4}</span> Discussion</h2>
        <p>${p.discussion}</p>
      </section>` : ""}

      <section id="limitations">
        <h2><span class="n">0${sections.findIndex((s) => s[0] === "limitations") + 1}</span> Limitations</h2>
        <div class="callout warn">
          <ul style="margin:0;padding-left:18px">${p.limitations.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
        </div>
      </section>

      <section id="repro">
        <h2><span class="n">0${sections.length}</span> Reproducibility</h2>
        <p>${esc(p.repro)}</p>
        ${p.next ? `<div class="callout"><b>Where this goes next.</b> ${esc(p.next)}</div>` : ""}
        <div class="actions">
          ${repoLink(p.repo)}
          ${p.code ? `<a class="btn btn-ghost lg" href="https://github.com/seren-aitchison/serenaitchison.com/tree/main/${p.code}" rel="noopener">${icon("github")}<span>Analysis code</span></a>` : ""}
          ${p.lab ? `<a class="btn btn-ghost lg" href="${p.lab}"><span>Try the live tool</span> <span aria-hidden="true">→</span></a>` : ""}
          <a class="text-link" href="reproducibility.html">How I handle reproducibility</a>
        </div>
      </section>
    </article>
  </div>

  <section class="section">
    <div class="two">
      <a class="row glass" style="--c:${THEMES[prev.theme].c};padding:18px" href="project.html?p=${prev.id}">
        <span class="go" style="transform:rotate(180deg)">${icon("chev")}</span>
        <span class="row-txt"><span>Previous</span><b>${esc(prev.title)}</b></span>
      </a>
      <a class="row glass" style="--c:${THEMES[next.theme].c};padding:18px;text-align:right" href="project.html?p=${next.id}">
        <span class="row-txt" style="align-items:flex-end"><span>Next</span><b>${esc(next.title)}</b></span>
        <span class="go">${icon("chev")}</span>
      </a>
    </div>
  </section>`;

  // Highlight the current section in the contents list.
  const links = [...main.querySelectorAll(".toc a")];
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.style.color = l.getAttribute("href") === `#${e.target.id}` ? "#fff" : "");
      links.forEach((l) => l.style.borderColor = l.getAttribute("href") === `#${e.target.id}` ? "var(--accent)" : "");
    });
  }, { rootMargin: "-100px 0px -70% 0px" });
  main.querySelectorAll(".prose section").forEach((s) => obs.observe(s));
}
