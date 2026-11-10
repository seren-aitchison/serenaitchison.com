// Diplotype → phenotype calculator. Implements CPIC's two assignment styles:
// an activity score summed across the two alleles, or a direct mapping from the
// pair of function categories. Teaching tool, not a clinical calling tool.
import { DIPLO } from "./lab-data.js";
import { icon, esc } from "./ui.js";

const CLS = { ok: "#4fe0a6", warn: "#ffc24b", bad: "#ff7a7a" };

export function mountDiplotype(root) {
  if (!root) return;
  const geneSel = root.querySelector("#dp-gene");
  const a1 = root.querySelector("#dp-a1");
  const a2 = root.querySelector("#dp-a2");
  const out = root.querySelector("#dp-out");
  const info = root.querySelector("#dp-note");

  geneSel.innerHTML = Object.keys(DIPLO).map((g) => `<option value="${g}">${g}</option>`).join("");

  function fillAlleles() {
    const g = DIPLO[geneSel.value];
    const opts = g.alleles.map((al) =>
      `<option value="${esc(al.a)}">${esc(al.a)} — ${esc(al.fn)}${al.v != null ? ` (${al.v})` : ""}</option>`).join("");
    a1.innerHTML = opts;
    a2.innerHTML = opts;
    a2.selectedIndex = Math.min(1, g.alleles.length - 1);
    info.innerHTML = `<p class="faint" style="font-size:12.5px;line-height:1.6;margin:0">${esc(g.note)}</p>`;
  }

  function assign(g, x, y) {
    if (g.mode === "score") {
      const score = x.v + y.v;
      const band = g.bands.find((b) => score <= b.max);
      return { score, label: band.label, cls: band.cls };
    }
    const pair = [x.fn, y.fn].map((f) => f.replace(/,.*$/, ""));
    const rule = g.rules.find((r) =>
      (r.has[0] === pair[0] && r.has[1] === pair[1]) || (r.has[0] === pair[1] && r.has[1] === pair[0]));
    return rule
      ? { label: rule.label, cls: rule.cls }
      : { label: "Not covered by this tool's rule set", cls: "warn", unknown: true };
  }

  function render() {
    const g = DIPLO[geneSel.value];
    const x = g.alleles.find((al) => al.a === a1.value);
    const y = g.alleles.find((al) => al.a === a2.value);
    if (!x || !y) return;
    const r = assign(g, x, y);
    const colour = CLS[r.cls];
    const consequence = g.consequence[r.label];

    out.innerHTML = `
      <div class="stat-row">
        <div class="stat"><small>Diplotype</small><b>${esc(x.a)} / ${esc(y.a)}</b><span>${esc(geneSel.value)}</span></div>
        ${g.mode === "score"
          ? `<div class="stat"><small>Activity score</small><b>${r.score}</b><span>${x.v} + ${y.v}</span></div>`
          : `<div class="stat"><small>Allele functions</small><b style="font-size:15px">${esc(x.fn)}</b><span>${esc(y.fn)}</span></div>`}
        <div class="stat" style="border-color:${colour}55;background:${colour}12">
          <small>Assigned phenotype</small>
          <b style="font-size:17px;color:${colour}">${esc(r.label)}</b>
          <span>CPIC framework</span>
        </div>
      </div>

      ${g.mode === "score" ? scoreScale(g, r.score, colour) : ""}

      ${consequence ? `<div class="callout" style="font-size:14.5px"><b>What this means for the drug.</b> ${esc(consequence)}</div>` : ""}

      <div class="table-wrap"><table class="data">
        <thead><tr><th scope="col">Allele</th><th scope="col">Function</th>${g.mode === "score" ? '<th scope="col">Activity value</th>' : ""}</tr></thead>
        <tbody>
          <tr><th scope="row">${esc(x.a)}</th><td>${esc(x.fn)}</td>${g.mode === "score" ? `<td class="num">${x.v}</td>` : ""}</tr>
          <tr><th scope="row">${esc(y.a)}</th><td>${esc(y.fn)}</td>${g.mode === "score" ? `<td class="num">${y.v}</td>` : ""}</tr>
        </tbody>
      </table></div>

      <div class="chips"><span class="chip">${esc(g.drugs)}</span></div>

      <div class="callout warn" style="font-size:14px">
        <b>What this calculation cannot do.</b> It assigns a phenotype from two alleles you chose. Real assignment requires knowing which alleles were actually tested — an untested variant silently defaults to the reference allele — plus phase, and for CYP2D6 copy number. Phenotype is also not response: dose, interactions, adherence, and renal and hepatic function all sit between genotype and outcome. Educational use only; check the current CPIC guideline before relying on any of it.
      </div>`;
  }

  function scoreScale(g, score, colour) {
    const max = Math.max(...g.bands.filter((b) => isFinite(b.max)).map((b) => b.max)) + 0.75;
    const pos = Math.min(100, (score / max) * 100);
    return `<div>
      <span class="f" style="display:block;margin-bottom:10px">Activity score bands</span>
      <div style="position:relative;height:34px">
        <div class="meter" style="height:10px;background:linear-gradient(90deg,${CLS.bad},${CLS.warn} 35%,${CLS.ok} 70%);opacity:.35"></div>
        <div style="position:absolute;left:${pos}%;top:-4px;transform:translateX(-50%);width:3px;height:18px;border-radius:3px;background:${colour};box-shadow:0 0 10px ${colour}"></div>
        <div style="position:absolute;left:${pos}%;top:16px;transform:translateX(-50%);font:600 12px var(--mono);color:${colour};white-space:nowrap">${score}</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">
        ${g.bands.map((b, i) => {
          const lo = i === 0 ? 0 : g.bands[i - 1].max;
          const range = !isFinite(b.max) ? `> ${lo}` : i === 0 ? (b.max === 0 ? `= 0` : `≤ ${b.max}`) : `> ${lo} to ${b.max}`;
          return `<span class="chip" style="border-color:${CLS[b.cls]}44"><b style="color:${CLS[b.cls]}">${esc(b.label)}</b> <span class="mono faint">${range}</span></span>`;
        }).join("")}
      </div>
    </div>`;
  }

  geneSel.addEventListener("change", () => { fillAlleles(); render(); });
  a1.addEventListener("change", render);
  a2.addEventListener("change", render);
  root.querySelector("#dp-swap").addEventListener("click", () => {
    const t = a1.value; a1.value = a2.value; a2.value = t; render();
  });
  root.querySelector("#dp-swap").innerHTML = `${icon("repeat")}<span>Swap alleles</span>`;

  fillAlleles();
  a1.value = DIPLO.CYP2D6.alleles[0].a;
  a2.value = "*4";
  render();
}
