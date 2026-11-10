// Pharmacogenomics programme: the evidence layers, and what each published analysis contributes.
import { THEMES } from "./data.js";
import { WORK } from "./projects-data.js";
import { mountChrome, icon, esc, statusPill } from "./ui.js";

mountChrome("projects.html");

const LAYERS = [
  { n: "01", name: "Genomic annotation", q: "What does this variant do to transcripts?",
    ev: "Ensembl VEP, GRCh38 coordinates", c: "#36b6c9", icon: "dna",
    gap: "Consequence terms describe transcripts, not protein activity. A splicing defect can be annotated synonymous." },
  { n: "02", name: "Allele function", q: "What does this haplotype do to the enzyme?",
    ev: "CPIC allele function tables, functional studies", c: "#3f9be0", icon: "target",
    gap: "Requires knowing which variants sit on which chromosome. An untested variant defaults to reference and is silently called normal." },
  { n: "03", name: "Phenotype assignment", q: "What does this pair of alleles imply?",
    ev: "CPIC activity scores and function rules", c: "#4d7dff", icon: "layers",
    gap: "Activity scores are additive by convention, not by measurement. Copy number changes the answer and most assays do not see it." },
  { n: "04", name: "Clinical guidance", q: "What should be done about this drug?",
    ev: "CPIC guidelines, graded by evidence level", c: "#5b6cf0", icon: "doc",
    gap: "Guidance is drug-specific and gene-pair-specific. A phenotype alone recommends nothing." },
  { n: "05", name: "Outcome", q: "What actually happens to this patient?",
    ev: "Clinical context, not genetics", c: "#7c8cff", icon: "user",
    gap: "Dose, interactions, adherence, renal and hepatic function, and comorbidity all sit between a phenotype and a response." },
];

document.getElementById("layers").innerHTML = `<div class="timeline">` + LAYERS.map((l) => `
  <article class="t-item glass" style="--c:${l.c}">
    <div>
      <span class="icon" style="--c:${l.c};margin-bottom:12px">${icon(l.icon)}</span>
      <p class="when">Layer ${l.n}</p>
    </div>
    <div>
      <h3>${esc(l.name)}</h3>
      <p style="font-style:italic;color:#d6d6d6">${esc(l.q)}</p>
      <p style="margin-top:10px"><span class="chip">${esc(l.ev)}</span></p>
      <p style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line);font-size:14.5px"><b style="color:#ffc24b">Where it breaks.</b> ${esc(l.gap)}</p>
    </div>
  </article>`).join("") + `</div>`;

const PIECES = [
  { id: "pgx-cyp2c19", role: "Established the layer problem",
    text: "Took one variant the whole way from coordinate to graded statement, and found the case that makes the argument: the most frequent consequence term for CYP2C19*2 is synonymous, while the allele has no function." },
  { id: "vep-apoe", role: "Tested the annotation layer against a known answer",
    text: "Annotated a variant whose biology is not in doubt, and recorded that SIFT calls it tolerated. That fixes how much weight an in-silico prediction can carry." },
  { id: "pop-freq", role: "Showed why the reference population matters",
    text: "A 15.85-point spread in one allele's frequency across gnomAD groups. Which population you compare against changes what counts as unusual — directly relevant to interpreting a clinical variant." },
  { id: "drug-gene", role: "Structured the relationships by mechanism",
    text: "Separated metabolism, activation, transport, target and response. Warfarin's two pharmacogenes act by different mechanisms, and a flat association count destroys that distinction." },
];

document.getElementById("pieces").innerHTML = PIECES.map(({ id, role, text }) => {
  const p = WORK.find((x) => x.id === id), t = THEMES[p.theme];
  return `<article class="t-item glass" style="--c:${t.c}">
    <div>
      <p class="when">Project ${p.n}</p>
      <span class="icon" style="--c:${t.c};margin-top:10px">${icon(t.icon)}</span>
    </div>
    <div>
      <h3>${esc(role)}</h3>
      <p>${esc(text)}</p>
      <div style="display:flex;gap:12px;align-items:center;margin-top:16px;flex-wrap:wrap">
        ${statusPill(p.status)}
        <a class="study-link" href="project.html?p=${p.id}">${esc(p.title)} ${icon("chev")}</a>
      </div>
    </div>
  </article>`;
}).join("");
