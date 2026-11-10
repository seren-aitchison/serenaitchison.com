// Interactive graphical summary of the dissertation workflow.
// Stages and techniques only — no yields, scores or results, because those are in the
// dissertation and not mine to approximate here.
import { icon, esc } from "./ui.js";

const STAGES = [
  {
    id: "feedstock", label: "Feedstock", n: "01", title: "Biobased feedstock", short: "Furfural",
    c: "#2fa7a0",
    body: "Furfural is produced from the pentose sugars in agricultural residues — corncobs, bagasse, oat hulls — rather than from petrochemical feedstock. Its aldehyde and furan ring give two handles for building heterocyclic systems.",
    why: "Starting from a renewable platform chemical makes the route interesting beyond the molecule itself: the same scaffold reached from crude oil would be chemically identical and strategically different.",
    tags: ["C₅H₄O₂", "Platform chemical", "Renewable"],
    lab: "lab.html#mol",
  },
  {
    id: "catalysis", label: "Catalysis", n: "02", title: "Catalytic step", short: "3 catalysts compared",
    c: "#7c8cff",
    body: "The key transformation was run over three heterogeneous catalysts with quite different surface chemistry: Amberlyst-26, an ion-exchange resin; γ-alumina, an amphoteric metal oxide; and calcium oxide, a strong solid base.",
    why: "Heterogeneous catalysts can be filtered off and reused, and they avoid leaving residual metal in the product — both of which matter if a route is ever to be scaled. Comparing a resin against two oxides means comparing genuinely different modes of activation, not three variations on one.",
    tags: ["Amberlyst-26", "γ-Al₂O₃", "CaO", "Heterogeneous"],
  },
  {
    id: "scaffold", label: "Scaffold", n: "03", title: "Heterocyclic scaffold", short: "The product",
    c: "#4d7dff",
    body: "The target was a heterocyclic scaffold with medicinal potential. Heterocycles dominate medicinal chemistry because a rigid ring presents substituents in a defined geometry and supplies hydrogen-bond donors and acceptors at fixed positions.",
    why: "A scaffold is a starting point rather than a drug. What makes one worth pursuing is whether it can be decorated — whether substituents can be varied around a stable core to explore a structure–activity relationship.",
    tags: ["Heterocycle", "Medicinal potential"],
  },
  {
    id: "characterisation", label: "Characterisation", n: "04", title: "Analytical characterisation", short: "TGA · TEM · GC",
    c: "#3f9be0",
    body: "Thermogravimetric analysis for thermal stability and loss of volatiles; transmission electron microscopy for catalyst morphology and particle structure; gas chromatography for what the reaction mixture actually contained.",
    why: "Three techniques answering three different questions. The point is corroboration: no single method establishes a result, and where two disagree the disagreement is itself the finding. This is the habit that transfers most directly to computational work.",
    tags: ["TGA", "TEM", "GC"],
  },
  {
    id: "docking", label: "Docking", n: "05", title: "Molecular docking", short: "Computational",
    c: "#5b6cf0",
    body: "The computational component explored how the scaffold might sit in a protein binding site: poses, orientation, and the interactions available to the ligand within the site.",
    why: "This is where the project became computational, and where the limits need stating. Docking produced a structural hypothesis about binding geometry. It is not a binding affinity, not validated activity, and the correlation between docking score and measured affinity is often poor.",
    tags: ["Pose prediction", "Interaction mapping"],
    warn: "Docking scores rank poses within a scoring function. Confirming any of it would need experimental binding data.",
    lab: "methods.html#dock",
  },
];

export function mountDissertation(root) {
  if (!root) return;
  const W = 980, H = 150;
  const boxW = 160, gap = (W - STAGES.length * boxW) / (STAGES.length - 1);

  const svg = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Dissertation workflow: furfural, catalytic step, heterocyclic scaffold, analytical characterisation, molecular docking" style="overflow:visible">
    <defs>
      <marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0 0 L10 5 L0 10 z" fill="rgba(255,255,255,.35)"/>
      </marker>
    </defs>
    ${STAGES.slice(0, -1).map((_, i) => {
      const x1 = (i + 1) * boxW + i * gap, x2 = x1 + gap - 4;
      return `<line x1="${x1 + 4}" y1="56" x2="${x2}" y2="56" stroke="rgba(255,255,255,.3)" stroke-width="1.5" marker-end="url(#arw)"/>`;
    }).join("")}
    ${STAGES.map((s, i) => {
      const x = i * (boxW + gap);
      return `<g class="ds-node" data-id="${s.id}" tabindex="0" role="button" aria-label="${esc(s.title)}" style="cursor:pointer">
        <rect x="${x}" y="18" width="${boxW}" height="76" rx="14" fill="${s.c}" fill-opacity=".14" stroke="${s.c}" stroke-opacity=".55"/>
        <text x="${x + 14}" y="42" fill="${s.c}" style="font:600 11px var(--mono);letter-spacing:.1em">${s.n}</text>
        <text x="${x + 14}" y="64" fill="#fff" style="font:600 13.5px var(--sans)">${esc(s.label)}</text>
        <text x="${x + 14}" y="82" fill="rgba(255,255,255,.6)" style="font:12px var(--sans)">${esc(s.short)}</text>
      </g>`;
    }).join("")}
  </svg>`;

  root.innerHTML = `
    <div class="glass" style="padding:24px;border-radius:22px;overflow-x:auto">${svg}</div>
    <div class="panel glass" id="ds-detail" style="margin-top:16px;border-radius:22px" aria-live="polite"></div>`;

  const detail = root.querySelector("#ds-detail");

  function show(id) {
    const s = STAGES.find((x) => x.id === id);
    root.querySelectorAll(".ds-node rect").forEach((r) => {
      const on = r.parentElement.dataset.id === id;
      r.setAttribute("fill-opacity", on ? ".3" : ".14");
      r.setAttribute("stroke-width", on ? "2" : "1");
    });
    detail.innerHTML = `
      <div class="panel-head">
        <h3 style="font-size:21px">${s.n} · ${esc(s.title)}</h3>
        <span class="chip" style="border-color:${s.c}66;color:${s.c}">${esc(s.short)}</span>
      </div>
      <p style="margin:0;color:#cfcfcf;line-height:1.7;font-size:15.5px">${esc(s.body)}</p>
      <p style="margin:0;color:var(--mute);line-height:1.7;font-size:15px"><b style="color:#fff">Why it matters.</b> ${esc(s.why)}</p>
      ${s.warn ? `<div class="callout warn" style="font-size:14.5px">${esc(s.warn)}</div>` : ""}
      <div class="chips">${s.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
      ${s.lab ? `<a class="study-link" href="${s.lab}" style="margin-top:4px">Explore this ${icon("chev")}</a>` : ""}`;
  }

  root.addEventListener("click", (e) => {
    const n = e.target.closest(".ds-node");
    if (n) show(n.dataset.id);
  });
  root.addEventListener("keydown", (e) => {
    const n = e.target.closest(".ds-node");
    if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); show(n.dataset.id); }
  });

  show("feedstock");
}
