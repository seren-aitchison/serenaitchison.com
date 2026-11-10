// Project directory: search, theme filter, grouped results, proposals.
import { THEMES, STATUS } from "./data.js";
import { WORK, PROPOSALS } from "./projects-data.js";
import { mountChrome, icon, esc, projectCard, statusPill } from "./ui.js";

mountChrome("projects.html");

const counts = { pub: 0, live: 0, dev: 0, plan: 0 };
WORK.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
// Hide a count line entirely when it is zero, rather than advertising a zero.
const set = (id, v) => {
  const el = document.getElementById(id);
  if (!el) return;
  if (!v) { el.closest("span")?.remove(); return; }
  el.textContent = v;
};
set("c-pub", counts.pub); set("c-live", counts.live); set("c-dev", counts.dev || 0); set("c-prop", PROPOSALS.length);

const lede = document.getElementById("lede-counts");
if (lede) lede.textContent = `${WORK.length} projects and ${PROPOSALS.length} research proposals.`;

/* ---------- Filters ---------- */
const tabs = document.getElementById("theme-tabs");
const results = document.getElementById("results");
const q = document.getElementById("q");
const params = new URLSearchParams(location.search);
let theme = params.get("theme") || "all";
let term = "";

tabs.innerHTML = [["all", "All"], ...Object.entries(THEMES).map(([k, t]) => [k, t.name])]
  .map(([k, n]) => `<button type="button" data-t="${k}" aria-pressed="${k === theme}">${esc(n)}</button>`).join("");

tabs.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-t]");
  if (!b) return;
  theme = b.dataset.t;
  tabs.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  render();
});

q.addEventListener("input", () => { term = q.value.trim().toLowerCase(); render(); });
document.getElementById("q-btn").innerHTML = icon("search");

const haystack = (p) => [p.title, p.short, p.question, (p.tags || []).join(" "), THEMES[p.theme].name,
  (p.findings || []).map((f) => (Array.isArray(f) ? f.join(" ") : f)).join(" ")].join(" ").toLowerCase();

const GROUPS = [
  ["Pharmacogenomics and precision medicine", ["pgx"]],
  ["Genomics and statistical genetics", ["omics", "stat"]],
  ["Software engineering", ["eng"]],
];

function render() {
  const match = WORK.filter((p) => (theme === "all" || p.theme === theme) && (!term || haystack(p).includes(term)));
  if (!match.length) {
    results.innerHTML = `<div class="glass empty" style="border-radius:22px">No project matches that. <button class="text-link" type="button" id="clear">Clear filters</button></div>`;
    document.getElementById("clear").onclick = () => { q.value = ""; term = ""; theme = "all"; tabs.querySelectorAll("button").forEach((x, i) => x.setAttribute("aria-pressed", String(i === 0))); render(); };
    return;
  }
  results.innerHTML = GROUPS.map(([name, themes]) => {
    const items = match.filter((p) => themes.includes(p.theme));
    if (!items.length) return "";
    return `<div class="group">
      <h2>${esc(name)}</h2>
      <p>${items.length} ${items.length === 1 ? "project" : "projects"}</p>
      <div class="grid">${items.map((p) => projectCard(p, { theme: THEMES[p.theme] })).join("")}</div>
    </div>`;
  }).join("");
}
render();

/* ---------- Proposals ---------- */
const pg = document.getElementById("prop-grid");
if (pg) {
  pg.innerHTML = PROPOSALS.map((p) => {
    const t = THEMES[p.theme];
    return `<a class="card glass" style="--c:${t.c}" href="research.html#${p.id}">
      <span class="icon" style="--c:${t.c}">${icon(t.icon)}</span>
      <span class="body">
        ${statusPill("prop")}
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.question)}</p>
        <span class="tags">${p.tags.map((x) => `<span>${esc(x)}</span>`).join("")}</span>
        <span class="actions-row"><span class="pill-dark">${t.name}</span><span class="study-link">Read ${icon("chev")}</span></span>
      </span></a>`;
  }).join("");
}
