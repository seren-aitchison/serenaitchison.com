// Skills page: the capability bubble field and the matrix table.
import { SKILLS, GROUPS, MATRIX } from "./skills-data.js";
import { mountChrome, icon, esc } from "./ui.js";

mountChrome("skills.html");

const tabs = document.getElementById("cap-tabs");
const field = document.getElementById("cap-bubbles");
const detail = document.getElementById("cap-detail");

tabs.innerHTML = GROUPS.map(([k, n], i) => `<button type="button" data-g="${k}" aria-pressed="${i === 0}">${esc(n)}</button>`).join("");
field.innerHTML = SKILLS.map((s, i) => `
  <button type="button" class="bubble ${s.size}" data-id="${s.id}" data-g="${s.group}"
    style="--c:${s.c};--t:${(5 + (i % 5) * 0.7).toFixed(1)}s;--d:-${(i % 7) * 0.8}s">
    <span class="b-ico">${icon(s.icon)}</span><span class="b-name">${esc(s.name)}</span>
  </button>`).join("");

function show(id) {
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
  if (b) show(b.dataset.id);
});
tabs.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-g]");
  if (!b) return;
  tabs.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  const g = b.dataset.g;
  field.querySelectorAll(".bubble").forEach((x) => x.classList.toggle("dim", g !== "all" && x.dataset.g !== g));
});
show("python");

document.getElementById("matrix").innerHTML = MATRIX.map(([area, tech]) =>
  `<tr><th scope="row">${esc(area)}</th><td>${esc(tech)}</td></tr>`).join("");
