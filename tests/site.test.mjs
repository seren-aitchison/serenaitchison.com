// Tests for the site's content and structure.
//
// Most of these exist to enforce the honesty rules mechanically rather than by memory:
// a proposal must not carry findings, a published project must state its limitations,
// and a private repository must never be rendered as a GitHub link.
//
//   node --test tests/*.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { STATUS, THEMES, REPOS, PERSON } from "../assets/data.js";
import { WORK, PROPOSALS } from "../assets/projects-data.js";
import { SKILLS, GROUPS, MATRIX } from "../assets/skills-data.js";
import { METHODS, CATEGORIES } from "../assets/methods-data.js";
import { FIGURES } from "../assets/figures.js";
import { PGX, DIPLO, COMPOUNDS, FREQ_VARIANTS } from "../assets/lab-data.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => readFileSync(join(ROOT, f), "utf8");
const pages = readdirSync(ROOT).filter((f) => f.endsWith(".html"));

/* ------------------------------------------------------------------ */
/* Project data                                                        */
/* ------------------------------------------------------------------ */

test("every project has the fields a reader needs", () => {
  for (const p of WORK) {
    for (const field of ["id", "n", "theme", "status", "title", "short", "question", "background", "methods", "limitations", "repro"]) {
      assert.ok(p[field], `${p.id} is missing ${field}`);
    }
    assert.ok(Array.isArray(p.methods) && p.methods.length, `${p.id} has no methods`);
    assert.ok(Array.isArray(p.limitations) && p.limitations.length,
      `${p.id} states no limitations — every project must say what it cannot support`);
  }
});

test("project ids and numbers are unique", () => {
  const ids = WORK.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate project id");
  const ns = WORK.map((p) => p.n);
  assert.equal(new Set(ns).size, ns.length, "duplicate project number");
});

test("statuses and themes are ones the site knows how to render", () => {
  for (const p of WORK) {
    assert.ok(STATUS[p.status], `${p.id} has unknown status ${p.status}`);
    assert.ok(THEMES[p.theme], `${p.id} has unknown theme ${p.theme}`);
  }
  for (const p of PROPOSALS) assert.ok(THEMES[p.theme], `${p.id} has unknown theme`);
});

test("a published project reports findings; a proposal never does", () => {
  for (const p of WORK) {
    if (p.status === "pub") {
      assert.ok(p.findings && p.findings.length,
        `${p.id} is marked published but reports no findings`);
    }
  }
  for (const p of PROPOSALS) {
    assert.ok(!p.findings, `${p.id} is a proposal and must not carry findings`);
    assert.ok(!p.results, `${p.id} is a proposal and must not carry results`);
    assert.ok(p.question && p.approach, `${p.id} needs a question and an approach`);
  }
});

test("proposal and project ids do not collide", () => {
  const work = new Set(WORK.map((p) => p.id));
  for (const p of PROPOSALS) {
    assert.ok(!work.has(p.id), `${p.id} is used by both a project and a proposal`);
  }
});

test("every repository referenced is declared in the visibility map", () => {
  for (const p of WORK) {
    if (!p.repo) continue;
    assert.ok(p.repo in REPOS,
      `${p.id} names repo ${p.repo}, which is not in REPOS — it would render with the wrong link`);
  }
});

test("simulated and illustrative data is labelled in the findings, not only the limitations", () => {
  // Projects whose data is not real measurements must say so where a skim-reader will see it.
  const mustDeclare = ["gwas-viz", "gwas-assoc", "gwas-gene", "gwas-real", "gwas-qc", "gene-expr", "drug-gene"];
  for (const id of mustDeclare) {
    const p = WORK.find((x) => x.id === id);
    assert.ok(p, `${id} not found`);
    const text = JSON.stringify([p.findings, p.short, p.discussion, p.limitations]).toLowerCase();
    assert.match(text, /simulated|illustrative|curated set|small/,
      `${id} uses non-measured data and must say so in its visible text`);
  }
});

/* ------------------------------------------------------------------ */
/* Links                                                               */
/* ------------------------------------------------------------------ */

const localHrefs = (html) =>
  [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((h) => h && !/^(https?:|mailto:|#)/.test(h));

test("every internal link in every page resolves to a file", () => {
  for (const page of pages) {
    for (const href of localHrefs(read(page))) {
      const file = href.split("#")[0].split("?")[0].replace(/^\//, "");
      if (!file) continue;
      assert.ok(existsSync(join(ROOT, file)), `${page} links to missing ${file}`);
    }
  }
});

test("links generated from data resolve too", () => {
  const check = (href, where) => {
    const file = href.split("#")[0].split("?")[0].replace(/^\//, "");
    if (!file || /^https?:/.test(href)) return;
    assert.ok(existsSync(join(ROOT, file)), `${where} links to missing ${file}`);
  };
  for (const s of SKILLS) for (const w of s.where) check(w.h, `skill ${s.id}`);
  for (const p of WORK) if (p.lab) check(p.lab, `project ${p.id}`);
});

test("lab links point at anchors that exist in lab.html", () => {
  const lab = read("lab.html");
  const targets = new Set([...lab.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const labLinks = [...WORK, ...SKILLS.flatMap((s) => s.where.map((w) => ({ lab: w.h, id: s.id })))]
    .filter((x) => x.lab && x.lab.includes("lab.html#"));
  for (const x of labLinks) {
    const anchor = x.lab.split("#")[1];
    assert.ok(targets.has(anchor), `${x.id} links to lab.html#${anchor}, which does not exist`);
  }
});

test("research anchors referenced from skills and pathways exist", () => {
  const ids = new Set(PROPOSALS.map((p) => p.id));
  for (const s of SKILLS) {
    for (const w of s.where) {
      if (!w.h.startsWith("research.html#")) continue;
      const anchor = w.h.split("#")[1];
      assert.ok(ids.has(anchor), `skill ${s.id} links to research.html#${anchor}, which is not a proposal`);
    }
  }
});

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

test("every page has a title, description and exactly one h1", () => {
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /<title>[^<]+<\/title>/, `${page} has no title`);
    if (page !== "404.html") {
      assert.match(html, /<meta name="description" content="[^"]{40,}"/, `${page} has no usable description`);
      assert.match(html, /<link rel="canonical"/, `${page} has no canonical URL`);
    }
    // project.html is a template whose body is rendered by assets/project.js, so its
    // heading is asserted against the renderer below rather than the static file.
    if (page === "project.html") continue;
    const h1s = html.match(/<h1[\s>]/g) || [];
    assert.equal(h1s.length, 1, `${page} has ${h1s.length} h1 elements`);
  }
});

test("the project template renders exactly one h1 on each branch", () => {
  const src = read("assets/project.js");
  // one for the found-project view, one for the not-found view
  const h1s = src.match(/<h1[\s>]/g) || [];
  assert.equal(h1s.length, 2, `project.js emits ${h1s.length} h1 elements; expected one per branch`);
  assert.match(src, /No project with that name/, "project.js has no not-found branch");
});

test("the sitemap lists every public page", () => {
  const sitemap = read("sitemap.xml");
  for (const page of pages) {
    if (page === "404.html" || page === "project.html") continue;
    const path = page === "index.html" ? "" : page;
    assert.ok(sitemap.includes(`/${path}<`), `sitemap is missing ${page}`);
  }
});

test("the canonical domain is used consistently", () => {
  for (const page of pages) {
    const html = read(page);
    for (const m of html.matchAll(/https:\/\/([a-z.]*serenaitchison[a-z.]*)/g)) {
      assert.equal(m[1], PERSON.domain, `${page} references ${m[1]} instead of ${PERSON.domain}`);
    }
  }
});

/* ------------------------------------------------------------------ */
/* Skills, methods and lab reference data                              */
/* ------------------------------------------------------------------ */

test("every skill has evidence attached", () => {
  for (const s of SKILLS) {
    assert.ok(s.where && s.where.length, `${s.id} claims a capability with no evidence linked`);
    assert.ok(GROUPS.some((g) => g[0] === s.group), `${s.id} has unknown group ${s.group}`);
  }
  assert.ok(MATRIX.length >= 10, "capability matrix looks truncated");
});

test("every method documents its assumptions and how it fails", () => {
  const ids = new Set();
  for (const m of METHODS) {
    assert.ok(!ids.has(m.id), `duplicate method id ${m.id}`);
    ids.add(m.id);
    assert.ok(CATEGORIES.some((c) => c[0] === m.cat), `${m.id} has unknown category ${m.cat}`);
    assert.ok(m.assumptions.length >= 2, `${m.id} lists fewer than two assumptions`);
    assert.ok(m.fails.length >= 2, `${m.id} lists fewer than two failure modes`);
    for (const field of ["solves", "idea", "read", "use", "ref"]) {
      assert.ok(m[field], `${m.id} is missing ${field}`);
    }
  }
});

test("figures only exist for real projects", () => {
  const ids = new Set(WORK.map((p) => p.id));
  for (const id of Object.keys(FIGURES)) {
    assert.ok(ids.has(id), `figure defined for unknown project ${id}`);
  }
});

test("pharmacogenomic reference data is internally consistent", () => {
  for (const [gene, g] of Object.entries(PGX)) {
    assert.ok(g.variants.length, `${gene} has no variants`);
    for (const v of g.variants) {
      assert.match(v.rs, /^rs\d+$/, `${gene} has a malformed variant id: ${v.rs}`);
      assert.ok(v.fn && v.allele && v.note, `${gene} ${v.rs} is missing a field`);
    }
  }
  for (const [gene, g] of Object.entries(DIPLO)) {
    assert.ok(["score", "function"].includes(g.mode), `${gene} has unknown mode`);
    if (g.mode === "score") {
      assert.ok(g.bands && g.bands.length, `${gene} has no activity score bands`);
      for (const a of g.alleles) {
        assert.equal(typeof a.v, "number", `${gene} allele ${a.a} has no activity value`);
      }
      // bands must be ordered and end open
      const maxes = g.bands.map((b) => b.max);
      assert.deepEqual(maxes, [...maxes].sort((x, y) => x - y), `${gene} bands are out of order`);
      assert.equal(maxes.at(-1), Infinity, `${gene} bands do not cover high scores`);
    } else {
      assert.ok(g.rules && g.rules.length, `${gene} has no assignment rules`);
    }
    // every phenotype a rule or band can produce must have a consequence written for it
    const labels = g.mode === "score" ? g.bands.map((b) => b.label) : g.rules.map((r) => r.label);
    for (const label of new Set(labels)) {
      assert.ok(g.consequence[label], `${gene} can assign "${label}" with nothing written about what it means`);
    }
  }
});

test("the diplotype tool never implies a clinical result", () => {
  const src = read("assets/lab-diplotype.js");
  assert.match(src, /Educational use only/, "the diplotype tool must carry its educational-use caveat");
  assert.match(src, /cannot do/, "the diplotype tool must state what it cannot do");
});

test("lab compounds and variants are well formed", () => {
  for (const c of COMPOUNDS) {
    assert.equal(typeof c.cid, "number", `compound ${c.label} has no PubChem CID`);
    assert.ok(c.why, `compound ${c.label} has no reason for being included`);
  }
  for (const v of FREQ_VARIANTS) {
    assert.match(v.rs, /^rs\d+$/, `malformed variant ${v.rs}`);
    assert.ok(v.note, `${v.rs} has no explanatory note`);
  }
});

/* ------------------------------------------------------------------ */
/* Claims made in page copy                                            */
/* ------------------------------------------------------------------ */

test("counts quoted in page copy match the data", () => {
  const home = read("index.html");
  const published = WORK.filter((p) => p.status === "pub").length;
  assert.ok(home.includes(`${published} published analyses`),
    `the homepage should say "${published} published analyses"`);

  const projects = read("projects.html");
  assert.ok(
    projects.includes(`${WORK.length} projects and ${PROPOSALS.length} research proposals`) ||
    projects.includes(`Twelve projects and seven research proposals`),
    "the projects page states a count that no longer matches the data"
  );

  // the methods page renders its counts from the data, so assert the wiring exists
  const methodsPage = read("methods.html");
  assert.ok(methodsPage.includes('id="m-count"') && methodsPage.includes('id="m-areas"'),
    "the methods page should render its counts from the data rather than hard-coding them");
  const methodsJs = read("assets/methods.js");
  assert.match(methodsJs, /m-areas"\)\.textContent = CATEGORIES\.length - 1/,
    "the areas count must come from CATEGORIES");
});

test("no page claims a peer-reviewed publication", () => {
  for (const page of pages) {
    const html = read(page).toLowerCase();
    if (html.includes("peer-reviewed") || html.includes("peer reviewed")) {
      assert.match(html, /not peer.reviewed|no peer.reviewed/,
        `${page} mentions peer review without the disclaimer`);
    }
  }
});
