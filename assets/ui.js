// Shared chrome: icon set, top bar, footer, and small render helpers. Imported by every page.
import { PERSON, STATUS, THEMES, REPOS, repoUrl } from "./data.js";

/* ---------- Icons (24×24, stroke) ---------- */
const P = {
  dna: '<path d="M8 2.5c0 5 8 4.5 8 9.5s-8 4.5-8 9.5"/><path d="M16 2.5c0 5-8 4.5-8 9.5s8 4.5 8 9.5"/><path d="M8.8 6h6.4M7.6 9.5h8.8M7.6 14.5h8.8M8.8 18h6.4" opacity=".55"/>',
  pill: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9 9l6 6"/>',
  atom: '<circle cx="12" cy="12" r="2.4"/><ellipse cx="12" cy="12" rx="10" ry="4.3"/><ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(120 12 12)"/>',
  network: '<circle cx="5" cy="6" r="2.3"/><circle cx="19" cy="7" r="2.3"/><circle cx="12" cy="13" r="2.6"/><circle cx="6" cy="19" r="2.3"/><circle cx="18" cy="18.5" r="2.3"/><path d="M6.9 7.3 10 11.4M16.9 8.3 13.8 11.6M10.6 15.2 7.5 17.3M13.9 14.8l2.6 2"/>',
  chart: '<path d="M4 20V10M10 20V5M16 20v-7M22 20H2"/>',
  cpu: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/>',
  code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16"/>',
  flask: '<path d="M9 2h6M10.5 2v6.2L4.6 18.4A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.7-3.1L13.5 8.2V2"/><path d="M7.5 14h9"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v16H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M4 17.5A1.5 1.5 0 0 1 5.5 16H19"/>',
  doc: '<path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5z"/><path d="M14 2.5v5h5M9 13h6M9 17h4"/>',
  user: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
  mail: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3-.3 6.2-1.5 6.2-6.7a5.2 5.2 0 0 0-1.5-3.6 4.9 4.9 0 0 0-.1-3.6s-1.2-.3-3.9 1.5a13.4 13.4 0 0 0-7 0C5.1 1.3 3.9 1.6 3.9 1.6a4.9 4.9 0 0 0-.1 3.6A5.2 5.2 0 0 0 2.3 8.9c0 5.1 3.2 6.3 6.2 6.7a3.4 3.4 0 0 0-.9 2.5V22"/>',
  linkedin: '<rect x="2.5" y="2.5" width="19" height="19" rx="3"/><path d="M7 10v7M7 7v.01M11.5 17v-4a2.5 2.5 0 0 1 5 0v4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  arrow: '<path d="M5 12h13M12 5l7 7-7 7"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  ext: '<path d="M14 4h6v6M20 4 10 14M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5h5"/>',
  down: '<path d="M12 4v12M6.5 11.5 12 17l5.5-5.5M5 20h14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m4 12.5 5 5L20 6.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lock: '<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  globe: '<circle cx="12" cy="12" r="9.2"/><path d="M3 12h18M12 2.8c4.5 5 4.5 13.4 0 18.4-4.5-5-4.5-13.4 0-18.4"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  layers: '<path d="m12 2.8 9 5-9 5-9-5z"/><path d="m3 12.5 9 5 9-5M3 17l9 5 9-5"/>',
  beaker: '<path d="M6 3h12M9 3v7L5 19a1.8 1.8 0 0 0 1.6 2.6h10.8A1.8 1.8 0 0 0 19 19l-4-9V3"/>',
  spark: '<path d="M12 2.5 14 9l6.5 2-6.5 2-2 6.5-2-6.5L3.5 11 10 9z"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
  shield: '<path d="M12 2.6 20 6v6c0 4.6-3.2 8.4-8 9.4-4.8-1-8-4.8-8-9.4V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
  repeat: '<path d="M3 11a7 7 0 0 1 11.9-5M21 13a7 7 0 0 1-11.9 5"/><path d="M3 6v5h5M21 18v-5h-5"/>',
};
export function icon(name, cls = "") {
  const d = P[name] || P.spark;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${cls ? ` class="${cls}"` : ""}>${d}</svg>`;
}
export const BRAND = `<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b5bff"/><stop offset=".55" stop-color="#4d7dff"/><stop offset="1" stop-color="#6ad7e5"/></linearGradient></defs><rect x=".75" y=".75" width="30.5" height="30.5" rx="9" fill="#0b0b0b" stroke="rgba(255,255,255,.22)" stroke-width="1.5"/><g fill="none" stroke="url(#bg1)" stroke-width="2.1" stroke-linecap="round"><path d="M11 7c0 4.5 10 4.5 10 9s-10 4.5-10 9"/><path d="M21 7c0 4.5-10 4.5-10 9s10 4.5 10 9"/><path d="M12.4 11h7.2M12.4 21h7.2" opacity=".6"/></g></svg>`;

/* ---------- Navigation ---------- */
const NAV = [
  ["Research", "research.html"],
  ["Projects", "projects.html"],
  ["Lab", "lab.html"],
  ["Skills", "skills.html"],
  ["Writing", "writing.html"],
  ["About", "about.html"],
];
const MENU_EXTRA = [
  ["For PhD supervisors", "phd.html"],
  ["For industry", "industry.html"],
  ["Reproducibility", "reproducibility.html"],
  ["CV", "cv.html"],
  ["Contact", "contact.html"],
];

export function mountChrome(current = "") {
  const here = (h) => (h === current ? ' class="active"' : "");
  document.querySelectorAll("[data-chrome=bar]").forEach((el) => {
    el.className = "bar glass";
    el.innerHTML = `
      <a class="brand" href="index.html">${BRAND}<span>${PERSON.name}</span></a>
      <nav class="sections" aria-label="Sections">${NAV.map(([t, h]) => `<a href="${h}"${here(h)}>${t}</a>`).join("")}</nav>
      <div class="right">
        <a class="gem-chip" href="phd.html"><span class="gem" aria-hidden="true"></span><span>PhD</span></a>
        <a class="btn btn-primary btn-sm lg" href="cv.html">CV</a>
        <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-menu">${icon("menu")}</button>
      </div>
      <nav class="menu" id="site-menu" aria-label="Menu" hidden>
        ${NAV.map(([t, h]) => `<a href="${h}">${t}</a>`).join("")}
        <span class="menu-label">Pathways</span>
        ${MENU_EXTRA.map(([t, h]) => `<a href="${h}">${t}</a>`).join("")}
      </nav>`;
    const btn = el.querySelector("#menu-btn"), menu = el.querySelector("#site-menu");
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
    });
    document.addEventListener("click", (e) => {
      if (!el.contains(e.target)) { btn.setAttribute("aria-expanded", "false"); menu.hidden = true; }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { btn.setAttribute("aria-expanded", "false"); menu.hidden = true; } });
  });

  document.querySelectorAll("[data-chrome=footer]").forEach((el) => {
    el.className = "site glass";
    el.innerHTML = `
      <div class="foot-cols">
        <div class="foot-brand">
          <b>${PERSON.name}</b>
          <p>Medicinal chemistry, computational biology and machine learning. Research portfolio and computational laboratory.</p>
          <p class="avail" style="margin-top:14px"><i aria-hidden="true"></i> Open to doctoral research and computational biology positions</p>
        </div>
        <nav aria-label="Research"><b>Research</b>
          <a href="research.html">Interests</a><a href="research.html#proposals">Proposals</a><a href="projects.html">Projects</a><a href="writing.html">Writing</a><a href="reproducibility.html">Reproducibility</a>
        </nav>
        <nav aria-label="Pathways"><b>Pathways</b>
          <a href="phd.html">PhD supervisors</a><a href="phd.html#ucl">UCL</a><a href="phd.html#sydney">Sydney</a><a href="industry.html">Industry</a><a href="lab.html">Computational Lab</a>
        </nav>
        <nav aria-label="Profile"><b>Profile</b>
          <a href="about.html">About</a><a href="skills.html">Technical skills</a><a href="cv.html">CV</a><a href="contact.html">Contact</a>
          <a href="${PERSON.github}" rel="noopener">GitHub</a><a href="${PERSON.linkedin}" rel="noopener">LinkedIn</a>
        </nav>
      </div>
      <div class="foot-base">
        <p>Project status is stated on every page: published work, work in development, and research proposals are labelled separately.</p>
        <p>© <span class="yr">${new Date().getFullYear()}</span> ${PERSON.name} · ${PERSON.domain}</p>
      </div>`;
  });
}

/* ---------- Helpers ---------- */
export const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function statusPill(key) {
  const s = STATUS[key] || STATUS.plan;
  return `<span class="status ${s.cls}">${s.label}</span>`;
}

// A repository link, or a "code on request" note when the repo is private.
export function repoLink(repo, { small = false } = {}) {
  if (!repo) return "";
  const cls = small ? "study-link" : "btn btn-ghost btn-sm lg";
  if (REPOS[repo]) return `<a class="${cls}" href="${repoUrl(repo)}" rel="noopener">${icon("github")}<span>View code</span></a>`;
  return `<span class="${small ? "study-link" : "chip"}" title="This repository is private. Access can be shared on request.">${icon("lock")}<span>Code on request</span></span>`;
}

export function projectCard(p, { theme }) {
  const t = theme || THEMES[p.theme];
  return `<a class="card glass" style="--c:${t.c}" href="project.html?p=${p.id}">
    <span class="icon" style="--c:${t.c}">${icon(t.icon)}</span>
    <span class="body">
      ${statusPill(p.status)}
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.short)}</p>
      <span class="tags">${(p.tags || []).slice(0, 4).map((x) => `<span>${esc(x)}</span>`).join("")}</span>
      <span class="actions-row">
        <span class="pill-dark">${t.name}</span>
        <span class="study-link">Read ${icon("chev")}</span>
      </span>
    </span>
  </a>`;
}
