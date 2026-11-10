// Methods library: search and filter over the reference entries.
import { METHODS, CATEGORIES } from "./methods-data.js";
import { mountChrome, icon, esc } from "./ui.js";

mountChrome("methods.html");
document.getElementById("m-count").textContent = METHODS.length;
document.getElementById("mq-btn").innerHTML = icon("search");

const COLOURS = { struct: "#36b6c9", test: "#3f9be0", model: "#5b6cf0", surv: "#4d7dff", gen: "#2fa7a0", chem: "#7c8cff", net: "#8a96ad" };
const ICONS = { struct: "layers", test: "chart", model: "cpu", surv: "clock", gen: "dna", chem: "atom", net: "network" };

const tabs = document.getElementById("m-tabs");
const results = document.getElementById("m-results");
const q = document.getElementById("mq");
let cat = new URLSearchParams(location.search).get("cat") || "all";
let term = "";

tabs.innerHTML = CATEGORIES.map(([k, n]) => `<button type="button" data-c="${k}" aria-pressed="${k === cat}">${esc(n)}</button>`).join("");
tabs.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-c]");
  if (!b) return;
  cat = b.dataset.c;
  tabs.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  render();
});
q.addEventListener("input", () => { term = q.value.trim().toLowerCase(); render(); });

const hay = (m) => [m.name, m.short, m.solves, m.idea, m.read, m.use, ...m.assumptions, ...m.fails].join(" ").toLowerCase();

function card(m) {
  const c = COLOURS[m.cat];
  return `<details class="prop glass" id="${m.id}" style="--c:${c}">
    <summary>
      <span class="letter" style="font-size:15px">${icon(ICONS[m.cat])}</span>
      <span>
        <h3>${esc(m.name)}</h3>
        <p>${esc(m.solves)}</p>
      </span>
      <span class="plus">${icon("plus")}</span>
    </summary>
    <div class="inner">
      <h4>The idea</h4>
      <p>${esc(m.idea)}</p>
      <h4>What it assumes</h4>
      <ul>${m.assumptions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
      <h4>How it fails</h4>
      <ul>${m.fails.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      <h4>Reading the output honestly</h4>
      <p>${esc(m.read)}</p>
      <h4>Where I use it</h4>
      <p>${esc(m.use)}</p>
      <p class="faint" style="font-size:12.5px;margin-top:14px">${esc(m.ref)}</p>
    </div>
  </details>`;
}

function render() {
  const match = METHODS.filter((m) => (cat === "all" || m.cat === cat) && (!term || hay(m).includes(term)));
  if (!match.length) {
    results.innerHTML = `<div class="glass empty" style="border-radius:22px">Nothing matches that.</div>`;
    return;
  }
  if (cat !== "all" || term) {
    results.innerHTML = `<div class="timeline">${match.map(card).join("")}</div>`;
    return;
  }
  results.innerHTML = CATEGORIES.slice(1).map(([k, n]) => {
    const items = match.filter((m) => m.cat === k);
    if (!items.length) return "";
    return `<div class="group"><h2>${esc(n)}</h2><p>${items.length} ${items.length === 1 ? "method" : "methods"}</p>
      <div class="timeline">${items.map(card).join("")}</div></div>`;
  }).join("");
}
render();

if (location.hash) {
  const el = document.querySelector(location.hash);
  if (el && el.tagName === "DETAILS") { el.open = true; el.scrollIntoView({ block: "center" }); }
}
