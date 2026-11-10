// Read-level QC. Parses FASTQ, decodes Phred+33, and reports the diagnostics that decide
// whether a run is usable: per-cycle quality, GC content, duplication, adapter content and
// N content. Example reads are generated in the browser from a seeded generator so each
// pattern is reproducible; pasted reads are analysed exactly the same way and never leave
// the page.
import { esc } from "./ui.js";

// Illumina TruSeq adapter read-through prefix — the sequence that appears when the
// insert is shorter than the read length and sequencing runs off the end of the fragment.
const ADAPTER = "AGATCGGAAGAG";

export const FASTQ_SCENARIOS = [
  { id: "clean", name: "A clean run", why: "What a healthy library looks like: quality high across the read with a mild decline at the 3′ end, GC near expectation, little duplication." },
  { id: "decay", name: "Quality collapse at the 3′ end", why: "Quality falls away sharply over the last cycles. Common, and usually handled by trimming rather than by discarding the run — but a variant supported only by bases in that region deserves no confidence." },
  { id: "adapter", name: "Adapter read-through", why: "Inserts shorter than the read length mean the sequencer runs off the end of the fragment and into the adapter. Left in, those bases map badly or soft-clip, and insert-size estimates are wrong." },
  { id: "duplicates", name: "Over-amplified library", why: "Heavy PCR duplication. Duplicates are not independent observations, so depth stops meaning what it appears to mean and allele fractions get distorted." },
  { id: "gcbias", name: "Skewed GC content", why: "GC distribution shifted away from expectation, which usually signals contamination, over-representation of one species or region, or a PCR bias problem." },
];

/* ---------------- read generation (seeded, so patterns reproduce) ---------------- */
function rng(seed) {
  let s = (seed * 2654435761) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
const BASES = "ACGT";

function generate(scenario, n, len, seed) {
  const r = rng(seed);
  const reads = [];
  const gcTarget = scenario === "gcbias" ? 0.68 : 0.41;
  const pool = [];
  for (let k = 0; k < Math.max(4, Math.floor(n / 12)); k++) pool.push(randomSeq(r, len, gcTarget));

  for (let i = 0; i < n; i++) {
    let seq;
    if (scenario === "duplicates" && r() < 0.62) seq = pool[Math.floor(r() * pool.length)];
    else seq = randomSeq(r, len, gcTarget);

    if (scenario === "adapter" && r() < 0.45) {
      const at = Math.floor(len * (0.45 + r() * 0.35));
      seq = seq.slice(0, at) + (ADAPTER + randomSeq(r, len, 0.5)).slice(0, len - at);
    }

    const qual = [];
    for (let c = 0; c < len; c++) {
      const frac = c / (len - 1);
      let q;
      if (scenario === "decay") q = 38 - 30 * Math.pow(frac, 3.2);
      else q = 37 - 7 * Math.pow(frac, 2.4);
      q += (r() - 0.5) * 5;
      if (c < 3) q -= 3;                       // first cycles are routinely noisier
      qual.push(Math.max(2, Math.min(41, Math.round(q))));
    }
    reads.push({ seq, qual });
  }
  return reads;
}

function randomSeq(r, len, gc) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += r() < gc ? (r() < 0.5 ? "G" : "C") : (r() < 0.5 ? "A" : "T");
  }
  return s;
}

const toFastq = (reads) => reads.map((x, i) =>
  `@read_${i + 1}\n${x.seq}\n+\n${x.qual.map((q) => String.fromCharCode(q + 33)).join("")}`).join("\n");

/* ---------------- parsing ---------------- */
function parseFastq(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length);
  const reads = [];
  const problems = [];
  for (let i = 0; i + 3 < lines.length + 3; i += 4) {
    const [h, seq, plus, q] = [lines[i], lines[i + 1], lines[i + 2], lines[i + 3]];
    if (h === undefined) break;
    if (!h.startsWith("@")) { problems.push(`Record ${reads.length + 1}: header does not start with @`); break; }
    if (seq === undefined || q === undefined) { problems.push(`Record ${reads.length + 1}: truncated — a FASTQ record needs four lines`); break; }
    if (plus === undefined || !plus.startsWith("+")) { problems.push(`Record ${reads.length + 1}: third line should start with +`); break; }
    if (seq.length !== q.length) { problems.push(`Record ${reads.length + 1}: sequence is ${seq.length} bases but quality string is ${q.length}`); continue; }
    reads.push({ seq: seq.toUpperCase(), qual: [...q].map((c) => c.charCodeAt(0) - 33) });
  }
  return { reads, problems };
}

/* ---------------- analysis ---------------- */
function analyse(reads) {
  const maxLen = Math.max(...reads.map((r) => r.seq.length));
  const perCycle = Array.from({ length: maxLen }, () => []);
  let gc = 0, total = 0, ns = 0, adapters = 0;
  const seen = new Map();
  const lengths = {};

  for (const r of reads) {
    r.qual.forEach((q, i) => perCycle[i].push(q));
    for (const b of r.seq) {
      total++;
      if (b === "G" || b === "C") gc++;
      else if (b === "N") ns++;
    }
    if (r.seq.includes(ADAPTER)) adapters++;
    seen.set(r.seq, (seen.get(r.seq) || 0) + 1);
    lengths[r.seq.length] = (lengths[r.seq.length] || 0) + 1;
  }

  const stats = perCycle.map((qs) => {
    const sorted = [...qs].sort((a, b) => a - b);
    const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
    return { mean: qs.reduce((a, b) => a + b, 0) / qs.length, q1: at(0.25), med: at(0.5), q3: at(0.75), lo: sorted[0], hi: sorted[sorted.length - 1] };
  });

  const dupReads = [...seen.values()].filter((c) => c > 1).reduce((a, c) => a + c, 0);
  const allQ = reads.flatMap((r) => r.qual);
  return {
    n: reads.length, maxLen, perCycle: stats,
    gcPct: (gc / total) * 100,
    nPct: (ns / total) * 100,
    adapterPct: (adapters / reads.length) * 100,
    dupPct: (dupReads / reads.length) * 100,
    meanQ: allQ.reduce((a, b) => a + b, 0) / allQ.length,
    q30Pct: (allQ.filter((q) => q >= 30).length / allQ.length) * 100,
    lengths,
  };
}

/* ---------------- rendering ---------------- */
function qualityChart(perCycle) {
  const W = 820, H = 300, pad = { l: 46, r: 16, t: 16, b: 40 };
  const ix = W - pad.l - pad.r, iy = H - pad.t - pad.b;
  const maxQ = 42;
  const x = (i) => pad.l + (i / Math.max(1, perCycle.length - 1)) * ix;
  const y = (q) => pad.t + iy - (q / maxQ) * iy;
  const band = (from, to, colour) => `<rect x="${pad.l}" y="${y(to)}" width="${ix}" height="${y(from) - y(to)}" fill="${colour}" opacity=".08"/>`;

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mean Phred quality by cycle, with interquartile range">
    ${band(30, maxQ, "#4fe0a6")}${band(20, 30, "#ffc24b")}${band(0, 20, "#ff7a7a")}
    ${[0, 10, 20, 30, 40].map((q) => `<line class="gridl" x1="${pad.l}" y1="${y(q)}" x2="${W - pad.r}" y2="${y(q)}"/><text x="${pad.l - 10}" y="${y(q) + 4}" text-anchor="end">${q}</text>`).join("")}
    <path d="${perCycle.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(s.q3).toFixed(1)}`).join(" ")} ${perCycle.map((s, i) => `L${x(perCycle.length - 1 - i).toFixed(1)} ${y(perCycle[perCycle.length - 1 - i].q1).toFixed(1)}`).join(" ")} Z" fill="#4d7dff" opacity=".22"/>
    <path d="${perCycle.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(s.mean).toFixed(1)}`).join(" ")}" fill="none" stroke="#6ad7e5" stroke-width="2"/>
    <line class="axis" x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${H - pad.b}"/>
    <line class="axis" x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}"/>
    <text class="lbl" x="${pad.l}" y="${H - 10}">Cycle (position in read)</text>
    <text class="lbl" x="16" y="${pad.t + iy / 2}" text-anchor="middle" transform="rotate(-90 16 ${pad.t + iy / 2})">Phred quality</text>
  </svg>`;
}

const verdict = (ok, warn, text) => `<b style="color:${ok ? "#4fe0a6" : warn ? "#ffc24b" : "#ff7a7a"}">${text}</b>`;

export function mountFastq(root) {
  if (!root) return;
  const pickEl = root.querySelector("#fq-scenario");
  const nEl = root.querySelector("#fq-n");
  const seedEl = root.querySelector("#fq-seed");
  const out = root.querySelector("#fq-out");
  const paste = root.querySelector("#fq-in");

  pickEl.innerHTML = FASTQ_SCENARIOS.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("");

  function run() {
    const pasted = paste.value.trim();
    let reads, source, note;

    if (pasted) {
      const parsed = parseFastq(pasted);
      if (!parsed.reads.length) {
        out.innerHTML = `<div class="callout warn"><b>No readable FASTQ records.</b> ${parsed.problems.length ? esc(parsed.problems[0]) : "Expected four lines per record: header, sequence, +, quality."}</div>`;
        return;
      }
      reads = parsed.reads;
      source = `${reads.length} pasted read${reads.length === 1 ? "" : "s"}`;
      note = parsed.problems.length
        ? `<div class="callout warn" style="font-size:14px"><b>Parse problems.</b> ${parsed.problems.map(esc).join(" · ")}</div>` : "";
    } else {
      const sc = FASTQ_SCENARIOS.find((s) => s.id === pickEl.value);
      reads = generate(sc.id, Number(nEl.value), 100, Number(seedEl.value));
      source = `${reads.length} simulated reads · ${esc(sc.name)}`;
      note = `<p class="muted" style="margin:0;font-size:15px">${esc(sc.why)}</p>`;
    }

    const a = analyse(reads);
    const tail = a.perCycle.slice(-10).reduce((s, c) => s + c.mean, 0) / Math.min(10, a.perCycle.length);
    const lenCount = Object.keys(a.lengths).length;

    out.innerHTML = `
      ${note}
      <div class="stat-row">
        <div class="stat"><small>Reads</small><b>${a.n}</b><span>${esc(source)}</span></div>
        <div class="stat"><small>Mean quality</small><b>${a.meanQ.toFixed(1)}</b><span>${a.q30Pct.toFixed(1)}% of bases ≥ Q30</span></div>
        <div class="stat"><small>Last 10 cycles</small><b style="color:${tail >= 30 ? "#4fe0a6" : tail >= 20 ? "#ffc24b" : "#ff7a7a"}">${tail.toFixed(1)}</b><span>mean Phred at the 3′ end</span></div>
        <div class="stat"><small>GC content</small><b>${a.gcPct.toFixed(1)}%</b><span>${Math.abs(a.gcPct - 41) > 10 ? "well away from expectation" : "near expectation"}</span></div>
      </div>

      ${qualityChart(a.perCycle)}
      <p class="faint" style="font-size:12.5px;margin:0">Line is the mean; the band is the interquartile range across reads at that cycle. Background shows the conventional Q20 and Q30 thresholds.</p>

      <div class="table-wrap"><table class="data plain"><tbody>
        <tr><th scope="row">Duplication</th><td>${a.dupPct.toFixed(1)}% of reads share a sequence with another — ${verdict(a.dupPct < 20, a.dupPct < 45, a.dupPct < 20 ? "normal" : a.dupPct < 45 ? "elevated" : "heavily over-amplified")}</td></tr>
        <tr><th scope="row">Adapter content</th><td>${a.adapterPct.toFixed(1)}% of reads contain <code>${ADAPTER}</code> — ${verdict(a.adapterPct < 5, a.adapterPct < 20, a.adapterPct < 5 ? "negligible" : a.adapterPct < 20 ? "trim before alignment" : "substantial read-through")}</td></tr>
        <tr><th scope="row">N content</th><td>${a.nPct.toFixed(2)}% of bases are N</td></tr>
        <tr><th scope="row">Read lengths</th><td>${lenCount === 1 ? `uniform at ${Object.keys(a.lengths)[0]} bases` : `${lenCount} distinct lengths, ${Math.min(...Object.keys(a.lengths).map(Number))}–${a.maxLen}`}</td></tr>
      </tbody></table></div>

      <div class="callout" style="font-size:14px"><b>What these numbers do and do not decide.</b> None of this is a pass or a fail. A 3′ quality decline is normal and is handled by trimming; heavy duplication can be a genuine property of a low-complexity library rather than a mistake; a shifted GC distribution means contamination in one context and an unusual target in another. QC describes the data so the next decision is informed — it does not make the decision.</div>`;
  }

  [pickEl, nEl, seedEl].forEach((el) => el.addEventListener("input", () => { paste.value = ""; run(); }));
  paste.addEventListener("input", run);
  root.querySelector("#fq-sample").addEventListener("click", () => {
    const sc = FASTQ_SCENARIOS.find((s) => s.id === pickEl.value);
    paste.value = toFastq(generate(sc.id, 4, 60, Number(seedEl.value)));
    run();
  });
  run();
}
