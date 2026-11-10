// VCF normalisation: split multi-allelic records, trim shared bases, and left-align
// indels against the real reference sequence fetched from Ensembl. Also checks the REF
// field against the reference, which is what bcftools norm --check-ref does.
//
// The algorithm is the one described by Tan, Abecasis & Kang (2015) and implemented in
// vt normalize: right-trim while the last bases agree, extend left when either allele
// empties, then left-trim any shared prefix.
import { icon, esc } from "./ui.js";

const ENSEMBL = "https://rest.ensembl.org";
const WINDOW = 150; // bases fetched either side; enough for any realistic repeat shift

export const VCF_EXAMPLES = [
  {
    label: "Right-shifted deletion in a homopolymer",
    why: "A one-base deletion inside a GGGG run in MTHFR, written at the rightmost position. Normalisation moves it three bases left. Two files describing this same deletion at different positions will not join on position, and nothing errors.",
    text: "1\t11796226\t.\tGG\tG\t.\t.\t.",
  },
  {
    label: "Padded SNV",
    why: "The APOE ε4 site written with an unnecessary shared leading base. Trimming recovers the canonical single-base substitution at 44,908,684.",
    text: "19\t44908683\t.\tGT\tGC\t.\t.\t.",
  },
  {
    label: "Multi-allelic record",
    why: "CYP2C19*2 at a site with three alternate alleles on one line. Most downstream tools expect one alternate per record; splitting is the first step and it has to preserve the per-allele fields.",
    text: "10\t94781859\trs4244285\tG\tA,C,T\t.\t.\t.",
  },
  {
    label: "Insertion in the same repeat",
    why: "An insertion into the MTHFR GGGG run, again written right-shifted. Insertions and deletions in repeats are where position-based matching fails most often.",
    text: "1\t11796226\t.\tG\tGG\t.\t.\t.",
  },
  {
    label: "Wrong REF base",
    why: "A record claiming A at a position where the reference has T. Position-based lookups will still 'work' and return a confidently wrong annotation, which is why checking REF against the reference is worth doing.",
    text: "19\t44908684\t.\tA\tC\t.\t.\t.",
  },
  {
    label: "Already normalised",
    why: "rs429358 in canonical form. A normaliser should leave it exactly as it is — doing nothing is the correct output.",
    text: "19\t44908684\trs429358\tT\tC\t.\t.\t.",
  },
];

export function mountVcf(root) {
  if (!root) return;
  const input = root.querySelector("#vcf-in");
  const pick = root.querySelector("#vcf-example");
  const out = root.querySelector("#vcf-out");
  const status = root.querySelector("#vcf-status");

  pick.innerHTML = VCF_EXAMPLES.map((e, i) => `<option value="${i}">${esc(e.label)}</option>`).join("");
  const setExample = () => {
    const e = VCF_EXAMPLES[Number(pick.value)];
    input.value = e.text;
    out.innerHTML = `<p class="muted" style="margin:0;font-size:15px">${esc(e.why)}</p>
      <div class="empty">Press <b>Normalise</b> to fetch the reference and work through it.</div>`;
  };
  pick.addEventListener("change", setExample);

  const setStatus = (t, cls = "") => { status.className = `live-dot ${cls}`; status.textContent = t; };

  async function reference(chrom, from, to) {
    const r = await fetch(`${ENSEMBL}/sequence/region/human/${chrom}:${from}..${to}?content-type=application/json`);
    if (!r.ok) throw new Error(`Ensembl returned ${r.status} for ${chrom}:${from}-${to}`);
    return (await r.json()).seq.toUpperCase();
  }

  // vt normalize, with every step recorded so the trace can be shown.
  function normalise(pos, ref, alt, baseAt) {
    const steps = [];
    let shifted = 0;
    for (let guard = 0; guard < 1000; guard++) {
      if (ref.length && alt.length && ref[ref.length - 1] === alt[alt.length - 1]) {
        ref = ref.slice(0, -1); alt = alt.slice(0, -1);
        steps.push({ op: "Right-trim", why: "last bases agree", pos, ref, alt });
      }
      if (!ref.length || !alt.length) {
        pos -= 1; shifted += 1;
        const b = baseAt(pos);
        if (!b) { steps.push({ op: "Stopped", why: "ran past the fetched reference window", pos, ref, alt }); break; }
        ref = b + ref; alt = b + alt;
        steps.push({ op: "Extend left", why: "an allele emptied, so take one base from the reference", pos, ref, alt });
      } else break;
    }
    while (ref.length > 1 && alt.length > 1 && ref[0] === alt[0]) {
      ref = ref.slice(1); alt = alt.slice(1); pos += 1;
      steps.push({ op: "Left-trim", why: "shared leading base is redundant", pos, ref, alt });
    }
    return { pos, ref, alt, steps, shifted };
  }

  root.querySelector("#vcf-run").addEventListener("click", async () => {
    const lines = input.value.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    if (!lines.length) { out.innerHTML = `<div class="callout warn">Nothing to normalise. Paste a VCF data line, or choose an example.</div>`; return; }

    setStatus("Fetching reference…");
    out.innerHTML = `<div class="empty">Fetching reference sequence from Ensembl…</div>`;

    try {
      const records = [];
      for (const line of lines) {
        const f = line.split(/\s+/);
        if (f.length < 5) { records.push({ error: `Not a VCF data line (needs at least CHROM POS ID REF ALT): ${line}` }); continue; }
        const [chrom, posS, id, refRaw, altRaw] = f;
        const pos = Number(posS);
        if (!Number.isFinite(pos)) { records.push({ error: `POS is not a number: ${posS}` }); continue; }

        const from = Math.max(1, pos - WINDOW), to = pos + WINDOW;
        const seq = await reference(chrom.replace(/^chr/i, ""), from, to);
        const baseAt = (p) => (p < from || p > to ? null : seq[p - from]);

        const refField = refRaw.toUpperCase();
        const actual = seq.slice(pos - from, pos - from + refField.length);
        const refOk = actual === refField;

        // One record per alternate allele.
        for (const altOne of altRaw.toUpperCase().split(",")) {
          const n = normalise(pos, refField, altOne, baseAt);
          records.push({
            chrom, id, input: { pos, ref: refField, alt: altOne },
            multi: altRaw.includes(","), refOk, actual,
            out: n, unchanged: n.pos === pos && n.ref === refField && n.alt === altOne,
          });
        }
      }

      setStatus("Live from Ensembl", "ok");
      const changed = records.filter((r) => !r.error && !r.unchanged).length;
      const badRef = records.filter((r) => !r.error && !r.refOk).length;

      out.innerHTML = `
        <div class="stat-row">
          <div class="stat"><small>Records out</small><b>${records.filter((r) => !r.error).length}</b><span>from ${lines.length} input line${lines.length === 1 ? "" : "s"}</span></div>
          <div class="stat"><small>Changed</small><b>${changed}</b><span>${changed ? "representation differed" : "already canonical"}</span></div>
          <div class="stat" style="${badRef ? "border-color:#ff7a7a55;background:#ff7a7a12" : ""}">
            <small>REF check</small>
            <b style="color:${badRef ? "#ff7a7a" : "#4fe0a6"}">${badRef ? `${badRef} mismatch` : "all match"}</b>
            <span>against GRCh38</span>
          </div>
        </div>

        ${records.map((r) => r.error
          ? `<div class="callout warn">${esc(r.error)}</div>`
          : recordBlock(r)).join("")}

        <div>
          <span class="f" style="display:block;margin-bottom:8px">Normalised output</span>
          <pre style="margin:0"><code>${records.filter((r) => !r.error).map((r) =>
            `${esc(r.chrom)}\t${r.out.pos}\t${esc(r.id)}\t${esc(r.out.ref)}\t${esc(r.out.alt)}\t.\t.\t.`).join("\n")}</code></pre>
        </div>

        <div class="callout" style="font-size:14px"><b>Why this matters more than it looks.</b> Nothing above errors in a normal pipeline. An un-normalised indel simply fails to match the same variant in an annotation database, and gets reported as novel — so a known variant quietly becomes an unknown one. Normalising both sides before any join is the fix, and it has to happen against the same reference build, because a position without its build is ambiguous.</div>`;
    } catch (e) {
      setStatus("Unavailable", "err");
      out.innerHTML = `<div class="callout warn"><b>Could not fetch reference sequence.</b> ${esc(String(e.message || e))}. This tool reads the reference from Ensembl in your browser, so a network restriction or an outage will stop it.</div>`;
    }
  });

  function recordBlock(r) {
    const before = `${r.input.pos}  ${r.input.ref} → ${r.input.alt}`;
    const after = `${r.out.pos}  ${r.out.ref} → ${r.out.alt}`;
    return `<div style="border:1px solid var(--line);border-radius:16px;padding:16px;background:rgba(255,255,255,.015)">
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px">
        <span class="chip">chr${esc(r.chrom)}</span>
        ${r.id && r.id !== "." ? `<span class="chip">${esc(r.id)}</span>` : ""}
        ${r.multi ? `<span class="status is-dev">split from multi-allelic</span>` : ""}
        ${r.unchanged ? `<span class="status is-pub">already normalised</span>` : `<span class="status is-prop">shifted ${r.out.shifted ? `${r.out.shifted} bp left` : "and trimmed"}</span>`}
        ${r.refOk ? "" : `<span class="status is-dev" style="background:rgba(255,122,122,.14);color:#ff7a7a">REF mismatch</span>`}
      </div>

      ${r.refOk ? "" : `<div class="callout warn" style="font-size:14px;margin-bottom:12px"><b>REF does not match the reference.</b> The record says <code>${esc(r.input.ref)}</code> at ${r.input.pos}, but GRCh38 has <code>${esc(r.actual)}</code> there. Normalisation still runs, and still produces output — which is exactly the problem. A tool that does not check this will annotate the wrong allele without complaint.</div>`}

      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;margin-bottom:${r.out.steps.length ? "14px" : "0"}">
        <div><span class="f" style="display:block;margin-bottom:4px">As written</span><code class="mono" style="font-size:14px">${esc(before)}</code></div>
        <span style="color:var(--faint)">→</span>
        <div><span class="f" style="display:block;margin-bottom:4px">Normalised</span><code class="mono" style="font-size:14px;color:${r.unchanged ? "var(--mute)" : "#6ad7e5"}">${esc(after)}</code></div>
      </div>

      ${r.out.steps.length ? `<details><summary style="cursor:pointer;font-size:13.5px;color:var(--mute)">${r.out.steps.length} step${r.out.steps.length === 1 ? "" : "s"} — show the working</summary>
        <div class="table-wrap" style="margin-top:10px"><table class="data plain"><thead><tr>
          <th scope="col">Step</th><th scope="col">Why</th><th scope="col">POS</th><th scope="col">REF</th><th scope="col">ALT</th>
        </tr></thead><tbody>
          ${r.out.steps.map((s) => `<tr><th scope="row">${esc(s.op)}</th><td class="faint">${esc(s.why)}</td>
            <td class="mono">${s.pos}</td><td class="mono">${esc(s.ref || "–")}</td><td class="mono">${esc(s.alt || "–")}</td></tr>`).join("")}
        </tbody></table></div></details>` : ""}
    </div>`;
  }

  root.querySelector("#vcf-clear").addEventListener("click", () => { input.value = ""; input.focus(); });
  root.querySelector("#vcf-clear").innerHTML = `${icon("close")}<span>Clear</span>`;
  setExample();
}
