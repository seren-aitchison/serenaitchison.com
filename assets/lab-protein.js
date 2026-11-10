// Variant → protein consequence. Runs VEP for a variant, picks the protein-coding
// consequence, fetches the translated sequence for that transcript, and shows the
// substitution in its real sequence context — verified against the fetched residue
// rather than asserted, so a mismatch is reported instead of hidden.
import { icon, esc } from "./ui.js";

const ENSEMBL = "https://rest.ensembl.org";

// Three-letter codes and a coarse property class, for reading a substitution.
const AA = {
  A: ["Ala", "hydrophobic"], R: ["Arg", "basic"], N: ["Asn", "polar"], D: ["Asp", "acidic"],
  C: ["Cys", "special"], Q: ["Gln", "polar"], E: ["Glu", "acidic"], G: ["Gly", "special"],
  H: ["His", "basic"], I: ["Ile", "hydrophobic"], L: ["Leu", "hydrophobic"], K: ["Lys", "basic"],
  M: ["Met", "hydrophobic"], F: ["Phe", "aromatic"], P: ["Pro", "special"], S: ["Ser", "polar"],
  T: ["Thr", "polar"], W: ["Trp", "aromatic"], Y: ["Tyr", "aromatic"], V: ["Val", "hydrophobic"],
  "*": ["Ter", "stop"],
};
const CLASS_COLOUR = {
  hydrophobic: "#4d7dff", polar: "#36b6c9", acidic: "#ff7a7a", basic: "#6ad7e5",
  aromatic: "#7c8cff", special: "#ffc24b", stop: "#ff7a7a",
};

// `offset` records a known difference between the numbering VEP returns (the full
// precursor translation) and the numbering used in the literature (the mature protein,
// after the signal peptide is cleaved). APOE's signal peptide is 18 residues long.
export const PROTEIN_EXAMPLES = [
  { rs: "rs429358", label: "rs429358 · APOE", offset: 18, known: "C112R",
    note: "The ε4-defining site, and the one SIFT calls tolerated. Known in the literature as C112R." },
  { rs: "rs7412", label: "rs7412 · APOE", offset: 18, known: "R158C",
    note: "The second APOE site. Together with rs429358 it defines the ε2/ε3/ε4 haplotypes." },
  { rs: "rs1801133", label: "rs1801133 · MTHFR", note: "C677T, Ala→Val. Affects folate metabolism and enzyme thermolability." },
  { rs: "rs1057910", label: "rs1057910 · CYP2C9*3", note: "Ile→Leu. A decreased-function allele relevant to warfarin dosing." },
  { rs: "rs4244285", label: "rs4244285 · CYP2C19*2", note: "Annotated synonymous — included deliberately, because the tool should show that there is no protein change to display." },
];

export function mountProtein(root) {
  if (!root) return;
  const pick = root.querySelector("#pr-pick");
  const out = root.querySelector("#pr-out");
  const status = root.querySelector("#pr-status");
  const win = root.querySelector("#pr-window");

  pick.innerHTML = PROTEIN_EXAMPLES.map((v) => `<option value="${v.rs}">${esc(v.label)}</option>`).join("");

  const intro = () => {
    const v = PROTEIN_EXAMPLES.find((x) => x.rs === pick.value);
    return `<p class="muted" style="margin:0;font-size:15px">${esc(v.note)}</p>`;
  };
  const render = (body) => { out.innerHTML = intro() + (body || `<div class="empty">Press <b>Map to protein</b> to run VEP and fetch the translated sequence.</div>`); };
  pick.addEventListener("change", () => render());

  const setStatus = (t, cls = "") => { status.className = `live-dot ${cls}`; status.textContent = t; };

  async function getJSON(url) {
    for (let i = 0; ; i++) {
      try {
        const r = await fetch(url);
        if (r.status === 429 && i < 2) { await new Promise((s) => setTimeout(s, 1500)); continue; }
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return await r.json();
      } catch (e) {
        if (i >= 2) throw e;
        await new Promise((s) => setTimeout(s, 1200));
      }
    }
  }

  root.querySelector("#pr-run").addEventListener("click", async () => {
    const rs = pick.value;
    setStatus("Querying Ensembl…");
    render(`<div class="empty">Running VEP, then fetching the protein sequence…</div>`);
    try {
      const vep = await getJSON(`${ENSEMBL}/vep/human/id/${rs}?content-type=application/json`);
      const cons = (vep[0] && vep[0].transcript_consequences) || [];

      // Prefer a consequence that actually changes the protein, on a canonical transcript.
      // VEP reports amino_acids for synonymous variants too, as a single unchanged residue.
      // Only a value containing "/" is an actual substitution.
      const coding = cons.filter((c) => c.amino_acids && c.amino_acids.includes("/") && c.protein_start);
      coding.sort((a, b) => (b.canonical || 0) - (a.canonical || 0));
      const hit = coding[0];

      if (!hit) {
        const terms = [...new Set(cons.flatMap((c) => c.consequence_terms || []))];
        setStatus("No protein change", "");
        render(`
          <div class="callout"><b>No protein consequence to show.</b> VEP returned ${cons.length} transcript annotations for ${esc(rs)}, none of which changes an amino acid. Consequence terms seen: ${terms.map((t) => `<code>${esc(t)}</code>`).join(", ")}.</div>
          <div class="callout warn" style="font-size:14px">This is the useful case. A variant can have no protein-level change and still abolish function — ${esc(rs)} is a splicing defect — so an empty result here is not evidence that a variant is benign.</div>`);
        return;
      }

      const [ref, alt] = hit.amino_acids.split("/");
      const pos = hit.protein_start;
      const tx = hit.transcript_id;

      // Fetch the translated sequence and check the reference residue really is there.
      let seq = null, verified = null;
      try {
        const s = await getJSON(`${ENSEMBL}/sequence/id/${tx}?type=protein;content-type=application/json`);
        seq = s.seq || null;
        if (seq) verified = seq[pos - 1] === ref;
      } catch { /* the substitution is still reportable without the sequence */ }

      const flank = Number(win.value);
      let context = "";
      if (seq) {
        const from = Math.max(0, pos - 1 - flank), to = Math.min(seq.length, pos + flank);
        const before = seq.slice(from, pos - 1), after = seq.slice(pos, to);
        context = `
          <div>
            <span class="f" style="display:block;margin-bottom:8px">Sequence context · ${esc(tx)} · residue ${pos} of ${seq.length}</span>
            <div class="mono" style="font-size:14px;line-height:2;word-break:break-all;padding:14px;border-radius:14px;background:rgba(0,0,0,.45);border:1px solid var(--line)">
              <span class="faint">…${esc(before)}</span><span style="padding:3px 7px;border-radius:6px;background:${CLASS_COLOUR[(AA[ref] || [])[1]] || "#4d7dff"};color:#06070c;font-weight:700">${esc(ref)}</span><span class="faint">${esc(after)}…</span>
            </div>
            <p class="faint" style="font-size:12.5px;margin:10px 0 0">Position ${pos} highlighted in the reference translation. The alternate allele substitutes <b style="color:#fff">${esc(alt)}</b> here.</p>
          </div>`;
      }

      const example = PROTEIN_EXAMPLES.find((x) => x.rs === rs);
      const prop = (x) => (AA[x] || ["?", "unknown"])[1];
      const three = (x) => (AA[x] || ["?"])[0];
      const changed = prop(ref) !== prop(alt);

      setStatus("Live from Ensembl", "ok");
      render(`
        <div class="stat-row">
          <div class="stat"><small>Substitution</small><b>${three(ref)}${pos}${three(alt)}</b><span>${esc(ref)} → ${esc(alt)}</span></div>
          <div class="stat"><small>Gene · transcript</small><b style="font-size:15px">${esc(hit.gene_symbol || "—")}</b><span class="mono">${esc(tx)}${hit.canonical ? " · canonical" : ""}</span></div>
          <div class="stat"><small>Consequence</small><b style="font-size:15px">${esc((hit.consequence_terms || []).join(", "))}</b><span>impact ${esc(hit.impact || "—")}</span></div>
          <div class="stat" style="border-color:${verified === false ? "#ff7a7a55" : "#4fe0a655"}">
            <small>Reference residue check</small>
            <b style="font-size:15px;color:${verified === false ? "#ff7a7a" : verified ? "#4fe0a6" : "#ffc24b"}">${verified === null ? "not checked" : verified ? "matches" : "mismatch"}</b>
            <span>${verified === null ? "sequence unavailable" : `VEP says ${esc(ref)} at ${pos}`}</span>
          </div>
        </div>

        <div class="table-wrap"><table class="data plain"><tbody>
          <tr><th scope="row">Reference</th><td>${three(ref)} (${esc(ref)}) — <span style="color:${CLASS_COLOUR[prop(ref)]}">${prop(ref)}</span></td></tr>
          <tr><th scope="row">Alternate</th><td>${three(alt)} (${esc(alt)}) — <span style="color:${CLASS_COLOUR[prop(alt)]}">${prop(alt)}</span></td></tr>
          <tr><th scope="row">Property change</th><td>${changed ? `<b style="color:#ffc24b">Yes</b> — ${prop(ref)} to ${prop(alt)}` : "No — both residues share a property class"}</td></tr>
          ${hit.sift_prediction ? `<tr><th scope="row">SIFT</th><td>${esc(hit.sift_prediction)}${hit.sift_score != null ? ` <span class="mono faint">(${hit.sift_score})</span>` : ""}</td></tr>` : ""}
          ${hit.polyphen_prediction ? `<tr><th scope="row">PolyPhen</th><td>${esc(hit.polyphen_prediction)}${hit.polyphen_score != null ? ` <span class="mono faint">(${hit.polyphen_score})</span>` : ""}</td></tr>` : ""}
          <tr><th scope="row">Transcripts affected</th><td>${coding.length} of ${cons.length} annotations change a residue</td></tr>
        </tbody></table></div>

        ${context}

        ${verified === false ? `<div class="callout warn"><b>Reference mismatch.</b> VEP reports ${esc(ref)} at position ${pos}, but the fetched translation has ${esc(seq[pos - 1] || "?")} there. That usually means the transcript's protein sequence and the annotation are out of step, or the position is being read against a different isoform. Reporting the disagreement is the right behaviour — silently trusting one side is how annotation errors propagate.</div>` : ""}

        ${example && example.offset ? `<div class="callout"><b>Two numbering systems, one residue.</b> VEP reports position <b>${pos}</b>, counting from the start of the full precursor translation. The literature calls this variant <b>${esc(example.known)}</b>, counting from the mature protein after the ${example.offset}-residue signal peptide is cleaved — ${pos} − ${example.offset} = ${pos - example.offset}. Same substitution, different reference point. Comparing a tool's output against a published position without checking which convention each uses is a reliable way to conclude, wrongly, that they disagree.</div>` : ""}

        <div class="callout" style="font-size:14px"><b>What a property change does and does not tell you.</b> A substitution crossing property classes — charged to hydrophobic, say — is more likely to disturb folding or an interaction surface. It is a prior, not a prediction. Position matters far more than chemistry: a conservative change in an active site can be catastrophic, and a radical one on a disordered surface loop often is not.</div>`);
    } catch (e) {
      setStatus("Unavailable", "err");
      render(`<div class="callout warn"><b>Could not reach the Ensembl REST API.</b> ${esc(String(e.message || e))}. This tool queries Ensembl directly from your browser, so a network restriction or an outage will stop it.</div>`);
    }
  });

  render();
}
