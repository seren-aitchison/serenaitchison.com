// Figures for project pages. Every number here is the project's own result, taken from its
// notebook output or README — nothing is illustrative unless the caption says so.
import { esc } from "./ui.js";

const C = { blue: "#4d7dff", cyan: "#36b6c9", teal: "#2fa7a0", violet: "#7c8cff", ok: "#4fe0a6", bad: "#ff7a7a", warn: "#ffc24b" };

function figure(caption, svg, note) {
  return `<figure style="margin:0 0 8px">
    ${svg}
    <figcaption style="margin-top:12px;font-size:13.5px;color:var(--faint);line-height:1.6"><b style="color:var(--mute)">Figure.</b> ${caption}</figcaption>
    ${note ? `<p style="margin:10px 0 0;font-size:13.5px;color:var(--faint);line-height:1.6">${note}</p>` : ""}
  </figure>`;
}

// Horizontal bars with a shared scale.
function barsH(rows, { unit = "", colour = C.blue, w = 720, labelW = 150, ref = null, fmt = (v) => v } = {}) {
  const rowH = 34, pad = { t: 10, b: 28, r: 70 };
  const h = pad.t + rows.length * rowH + pad.b;
  const max = Math.max(...rows.map((r) => r.v), ref || 0) * 1.08;
  const x = (v) => labelW + (v / max) * (w - labelW - pad.r);
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(rows.map((r) => `${r.k}: ${fmt(r.v)}${unit}`).join(", "))}">
    ${rows.map((r, i) => {
      const y = pad.t + i * rowH;
      const col = r.c || colour;
      return `<rect x="${labelW}" y="${y + 6}" width="${(x(r.v) - labelW).toFixed(1)}" height="${rowH - 14}" rx="4" fill="${col}" opacity="${r.dim ? 0.45 : 0.85}"/>
        <text x="${labelW - 12}" y="${y + rowH / 2 + 3}" text-anchor="end" class="lbl" style="font-size:12.5px">${esc(r.k)}</text>
        <text x="${(x(r.v) + 9).toFixed(1)}" y="${y + rowH / 2 + 4}">${fmt(r.v)}${unit}</text>`;
    }).join("")}
    ${ref != null ? `<line x1="${x(ref)}" y1="${pad.t}" x2="${x(ref)}" y2="${h - pad.b}" stroke="${C.bad}" stroke-dasharray="5 4" stroke-width="1.2"/>` : ""}
    <line class="axis" x1="${labelW}" y1="${pad.t}" x2="${labelW}" y2="${h - pad.b}"/>
  </svg>`;
}

export const FIGURES = {
  /* ---- The reanalysis figure, rendered from the file the analysis produced ---- */
  "crc-plasticity": () => figure(
    "Fetal-like programme occupancy across tumour regions and patients. <b>A</b> Paired tumour core and border per patient — the lines are flat. <b>B</b> Share of variance between patients versus between regions, by signature. <b>C</b> Tumour versus matched normal epithelium, same patients.",
    `<img src="assets/figures/crc-plasticity.svg" alt="Three panels. A: paired core and border scores per patient, showing near-flat lines with wide separation between patients. B: variance shares, with the fetal-like programme at 99% between patients. C: scores rising from normal to border to core in every patient." style="width:100%;height:auto;display:block;border-radius:14px;background:transparent">`,
    "Produced by <code>analysis/crc-plasticity/figure.py</code> from GSE144735. The flatness in panel A is the finding: two regions of one tumour are more alike than two tumours are to each other. Panel B's specificity control matters — YAP target variance is far more regional than the state it drives."
  ),

  /* ---- Population frequency: gnomAD exome frequencies for rs429358 C ---- */
  "pop-freq": () => figure(
    "C allele frequency of rs429358 (APOE) across gnomAD exome population groups, as returned by the Ensembl variation endpoint. The combined category is excluded because it is not an independent group.",
    barsH([
      { k: "African / African American", v: 22.66, c: C.cyan },
      { k: "Finnish", v: 19.12, c: C.cyan },
      { k: "Non-Finnish European", v: 15.14, c: C.cyan },
      { k: "Admixed American", v: 10.43, c: C.cyan },
      { k: "South Asian", v: 10.04, c: C.cyan },
      { k: "East Asian", v: 9.79, c: C.cyan },
      { k: "Middle Eastern", v: 6.81, c: C.cyan },
    ], { unit: "%", labelW: 190, fmt: (v) => v.toFixed(2) }),
    "The spread between highest and lowest is 15.85 percentage points. This describes population history, not individual risk, and the labels are broad continental groupings rather than descriptions of anyone's ancestry."
  ),

  /* ---- VEP: transcript consequences for rs429358 ---- */
  "vep-apoe": () => figure(
    "Transcript-level consequences returned by Ensembl VEP for rs429358, counted across all annotated transcripts.",
    barsH([
      { k: "missense_variant", v: 30, c: C.blue },
      { k: "downstream_gene_variant", v: 16, c: C.teal },
      { k: "intron_variant", v: 5, c: C.teal },
      { k: "3_prime_UTR_variant", v: 3, c: C.teal },
      { k: "upstream_gene_variant", v: 1, c: C.teal },
    ], { labelW: 210 }),
    "The missense annotations are on APOE; the downstream ones are on TOMM40, which sits next to it. One variant, two genes — gene assignment is a choice, not a fact. SIFT calls this substitution <b style=\"color:#ffc24b\">tolerated</b>, which is the finding worth dwelling on."
  ),

  /* ---- CYP2C19: consequence terms ---- */
  "pgx-cyp2c19": () => figure(
    "Consequence terms returned by Ensembl VEP for rs4244285 (CYP2C19*2), counted across 66 transcript annotations at the time the notebook was run.",
    barsH([
      { k: "synonymous_variant", v: 36, c: C.blue },
      { k: "synonymous + NMD", v: 18, c: C.blue },
      { k: "3′ UTR + NMD", v: 6, c: C.teal },
      { k: "non_coding_transcript_exon", v: 3, c: C.teal },
      { k: "intron_variant", v: 3, c: C.teal },
    ], { labelW: 210 }),
    "Every annotation is on CYP2C19, and the most frequent term is <b style=\"color:#fff\">synonymous</b> — which on its face suggests no effect on the protein. The allele's loss of function is a splicing effect, so a workflow that stopped at this chart would reach the wrong conclusion. Counts track the Ensembl release and will drift."
  ),

  /* ---- Expression fold changes ---- */
  "gene-expr": () => figure(
    "Fold change (treatment ÷ control) for each gene in the illustrative dataset. The dashed line marks no change.",
    barsH([
      { k: "EGFR", v: 2.0, c: C.ok },
      { k: "BRCA1", v: 1.8, c: C.ok },
      { k: "MYC", v: 1.75, c: C.ok },
      { k: "AKT1", v: 1.19, c: C.blue },
      { k: "MTHFR", v: 0.95, c: C.blue },
      { k: "TP53", v: 0.93, c: C.blue },
      { k: "ESR1", v: 0.5, c: C.bad },
      { k: "PTEN", v: 0.5, c: C.bad },
    ], { unit: "×", labelW: 90, ref: 1, fmt: (v) => v.toFixed(2) }),
    "Colour marks direction only. With one value per condition there is no variance to estimate, so no p-value, no correction and no claim of significance — and none is made."
  ),

  /* ---- GWAS real gene annotation ---- */
  "gwas-real": () => {
    const rows = [
      ["rs429358", "19:44,908,684", "1 × 10⁻¹⁰", "APOE", true],
      ["rs7412", "19:44,908,822", "2 × 10⁻⁸", "APOE", true],
      ["rs1801133", "1:11,796,321", "4 × 10⁻⁴", "MTHFR", false],
    ];
    return figure(
      "Variants mapped to genes using GRCh38 coordinates retrieved live from Ensembl, with an illustrative significance threshold applied.",
      `<div class="table-wrap"><table class="data plain">
        <thead><tr><th scope="col">Variant</th><th scope="col">Position</th><th scope="col">p (simulated)</th><th scope="col">Gene</th><th scope="col">Passes 5 × 10⁻⁸</th></tr></thead>
        <tbody>${rows.map(([v, pos, p, g, sig]) => `<tr>
          <th scope="row" class="mono">${v}</th><td class="mono">${pos}</td><td class="mono">${p}</td><td>${g}</td>
          <td style="color:${sig ? C.ok : C.warn}">${sig ? "Yes" : "No"}</td></tr>`).join("")}</tbody>
      </table></div>
      <div class="table-wrap" style="margin-top:14px"><table class="data plain">
        <thead><tr><th scope="col">Gene interval used</th><th scope="col">Coordinates (GRCh38)</th><th scope="col">Span</th><th scope="col">rs1801133 captured</th></tr></thead>
        <tbody>
          <tr><th scope="row">MTHFR — approximate</th><td class="mono">1:11,785,721–11,788,721</td><td class="num">3.0 kb</td><td style="color:${C.bad}">No overlapping gene</td></tr>
          <tr><th scope="row">MTHFR — from Ensembl</th><td class="mono">1:11,785,723–11,806,455</td><td class="num">20.7 kb</td><td style="color:${C.ok}">Mapped correctly</td></tr>
        </tbody>
      </table></div>`,
      "The second table is the point of the project. With a truncated interval the pipeline confidently reported <b style=\"color:#ff7a7a\">no overlapping gene</b> for a well-known MTHFR variant — a silent false negative that looks exactly like a true negative. The p-values are simulated and no disease association is claimed."
    );
  },

  /* ---- Drug–gene mechanism categories ---- */
  "drug-gene": () => figure(
    "Drug–gene associations in the curated set, grouped by the mechanism linking them.",
    `<div class="table-wrap"><table class="data plain">
      <thead><tr><th scope="col">Drug</th><th scope="col">Gene</th><th scope="col">Mechanism</th><th scope="col">What it changes</th></tr></thead>
      <tbody>
        <tr><th scope="row" rowspan="2">Clopidogrel</th><td>CYP2C19</td><td>Activation</td><td>Formation of the active metabolite</td></tr>
        <tr><td>ABCB1</td><td>Transport</td><td>Movement across membranes</td></tr>
        <tr><th scope="row" rowspan="2">Warfarin</th><td>CYP2C9</td><td>Metabolism</td><td>Rate of clearance</td></tr>
        <tr><td>VKORC1</td><td>Target</td><td>The protein the drug acts on</td></tr>
        <tr><th scope="row" rowspan="2">Codeine</th><td>CYP2D6</td><td>Metabolism</td><td>Conversion to morphine</td></tr>
        <tr><td>OPRM1</td><td>Response</td><td>Receptor-level response</td></tr>
        <tr><th scope="row">Simvastatin</th><td>SLCO1B1</td><td>Transport</td><td>Hepatic uptake, and plasma exposure</td></tr>
      </tbody>
    </table></div>`,
    "Warfarin shows why mechanism matters: CYP2C9 governs how fast the drug is cleared while VKORC1 is the protein it acts on. Collapsing both into an 'associated gene' count discards exactly the information a prescriber or a modeller needs. Association counts here are a property of this small curated set, not a measure of real-world importance."
  ),
};

export function renderFigure(id) {
  const fn = FIGURES[id];
  return fn ? fn() : "";
}
