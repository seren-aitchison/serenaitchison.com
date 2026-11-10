// Research page: themes and the seven proposals.
import { THEMES } from "./data.js";
import { PROPOSALS } from "./projects-data.js";
import { mountChrome, icon, esc } from "./ui.js";

mountChrome("research.html");

const RESEARCH_THEMES = [
  {
    n: "01", c: "#36b6c9", icon: "layers", title: "Precision medicine and multi-omics",
    body: "Molecular heterogeneity between patients is the reason average treatment effects can hide opposite responses. I am interested in integrating data layers to recover subgroups that are biologically coherent rather than statistically convenient.",
    q: "When an integrated model finds a patient subgroup, how do we establish that the subgroup is real rather than an artefact of batch, platform or cohort composition?",
  },
  {
    n: "02", c: "#3f9be0", icon: "dna", title: "Computational genomics",
    body: "Variant annotation, transcriptomics, single-cell analysis and molecular subtyping. Most of my published work sits here, and it is where I have learned most about how annotation pipelines fail quietly.",
    q: "What does an annotation workflow systematically miss, and how would we detect that it had missed something?",
  },
  {
    n: "03", c: "#7c8cff", icon: "atom", title: "Computational drug discovery",
    body: "Molecular modelling, descriptors, docking and pharmacogenomics. My chemistry background makes me sceptical of computational outputs in a way I think is useful rather than obstructive.",
    q: "How far can structure- and descriptor-based models be trusted to prioritise compounds, and what is the honest boundary of their applicability?",
  },
  {
    n: "04", c: "#5b6cf0", icon: "cpu", title: "Machine learning in biology",
    body: "Predictive modelling, interpretable models, graph methods. I am more interested in models whose reasoning can be inspected and challenged than in marginal gains in accuracy.",
    q: "When a model attributes importance to a biological feature, how do we distinguish a real mechanism from a confound the model has learned to exploit?",
  },
  {
    n: "05", c: "#2fa7a0", icon: "target", title: "Translational and spatial biology",
    body: "Connecting molecular signatures to tissue organisation, disease progression and therapeutic response. The longer-term direction I would most like to move into, particularly spatial transcriptomics in tumours.",
    q: "What does spatial context add beyond dissociated single-cell data, and which biological questions actually require it?",
  },
];

document.getElementById("themes").innerHTML = `<div class="timeline">` + RESEARCH_THEMES.map((t) => `
  <article class="t-item glass" style="--c:${t.c}">
    <div>
      <span class="icon" style="--c:${t.c};margin-bottom:12px">${icon(t.icon)}</span>
      <p class="when">Theme ${t.n}</p>
    </div>
    <div>
      <h3>${esc(t.title)}</h3>
      <p>${esc(t.body)}</p>
      <p class="q" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line);font-style:italic;color:#d6d6d6">${esc(t.q)}</p>
    </div>
  </article>`).join("") + `</div>`;

document.getElementById("props").innerHTML = PROPOSALS.map((p, i) => {
  const t = THEMES[p.theme];
  return `<details class="prop glass" id="${p.id}" style="--c:${t.c}">
    <summary>
      <span class="letter">${String.fromCharCode(65 + i)}</span>
      <span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(t.name)} · proposal, not undertaken</p>
      </span>
      <span class="plus">${icon("plus")}</span>
    </summary>
    <div class="inner">
      <h4>Research question</h4>
      <p>${esc(p.question)}</p>
      <h4>Proposed approach</h4>
      <p>${esc(p.approach)}</p>
      <h4>The hard part</h4>
      <p>${esc(p.why)}</p>
      <h4>Methods and tools</h4>
      <p>${p.tags.map((x) => `<span class="chip">${esc(x)}</span>`).join(" ")}</p>
    </div>
  </details>`;
}).join("");

// Open a proposal if it is linked directly.
if (location.hash) {
  const el = document.querySelector(location.hash);
  if (el && el.tagName === "DETAILS") { el.open = true; el.scrollIntoView({ block: "center" }); }
}
