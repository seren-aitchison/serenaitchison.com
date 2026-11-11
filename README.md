# serenaitchison.com

Research portfolio of Seren Aitchison: medicinal chemistry, computational biology and machine learning.

A static site with no build step — HTML, CSS and ES modules. What is deployed is the source.

## Structure

```
index.html              homepage: hero, workbench, pathways, capabilities, featured work
projects.html           searchable project directory, filterable by theme
project.html?p=<id>     project detail, laid out as a short paper
research.html           five research themes and thirteen independent proposals
programme.html          the pharmacogenomics synthesis: evidence layers, and what is missing
lab.html                the Computational Lab: ten interactive tools
skills.html             capability matrix, every entry linked to evidence
methods.html            reference library: 34 methods, with assumptions and failure modes
writing.html            longer method notes
about.html              background and the dissertation case study
phd.html                pathway for doctoral supervisors
ucl-crc.html            full proposal for the UCL colorectal plasticity PhD
industry.html           pathway for biotech and pharmaceutical hiring
cv.html                 CV with academic / industry emphasis, printable to PDF
contact.html            contact and email templates
reproducibility.html    data provenance, environments, seeds, live-API caveats

assets/
  base.css              design tokens, glass, buttons, top bar
  site.css              site components: hero, cards, bubbles, paper layout, lab, print
  data.js               personal details, status labels, theme colours, repo visibility
  projects-data.js      every project and proposal — the single source of content
  skills-data.js        capabilities and the capability matrix
  lab-data.js           curated CPIC pharmacogene reference, compounds, rule sets
  ui.js                 icons, top bar, footer, shared render helpers
  lab.js                the Lab tools
  lab-stats.js          Manhattan, QQ and expression plots
  lab-diplotype.js      CPIC diplotype → phenotype assignment
  lab-protein.js        variant → protein residue, with reference verification
  lab-vcf.js            VCF normalisation: split, trim, left-align, check REF
  lab-fastq.js          FASTQ parsing and read-level QC
  lab-coverage.js       pharmacogene panel coverage by population
  methods-data.js       the methods library
  *.js                  one small entry module per page
```

## Run locally

ES modules do not load from `file://`, so serve the folder:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## The Lab

Ten tools; most run on real data fetched from public APIs:

| Tool | Source | Notes |
|---|---|---|
| Pharmacogenomics explorer | Ensembl REST + VEP | Allele function and gene–drug pairs curated from CPIC |
| Diplotype to phenotype | — | CPIC activity scores and function rules for 7 genes, computed in the page |
| Variant to protein | Ensembl REST + VEP | Maps a variant to its residue and verifies the reference against the fetched translation |
| VCF normalisation | Ensembl REST | Splits multi-allelic records, trims, and left-aligns indels against GRCh38 |
| Read quality control | — | FASTQ parsing, Phred decoding, per-cycle quality, duplication and adapter content |
| Coverage audit | gnomAD snapshot + live refresh | Per-population rate of diplotypes carrying an unassayed reduced-function allele |
| Population frequencies | Ensembl REST (gnomAD) | The `pops=1` query is slow — up to a minute |
| Molecular explorer | PubChem PUG REST | 3D structures rendered with 3Dmol.js |
| Interaction networks | STRING | Falls back to a bundled example set if unreachable |
| Statistics studio | — | Computed in the page from a seeded generator |

All four external hosts send `Access-Control-Allow-Origin: *`. Requests are sent without custom
headers on purpose: adding one triggers a CORS preflight that PubChem does not answer.

Every API call retries twice, because a throttled response arrives without CORS headers and the
browser reports it as a network error rather than a status code.

## Tests

```bash
npm test
```

23 tests over the content and structure, run in CI on every push. Most of them exist to enforce
the honesty rules mechanically rather than by memory:

- a project marked **published** must report findings; a **proposal** must not carry findings or results
- every project must state limitations — the assertion fails if the list is empty
- projects built on simulated or illustrative data must say so in their visible text, not only in a footnote
- every repository referenced must appear in the visibility map, so a private repo can never render as a link
- every phenotype the diplotype tool can assign must have a written consequence, and the tool must keep its educational-use caveat
- every capability claimed must have evidence linked, and every link must resolve
- counts quoted in page copy ("10 published analyses") must match the data

A second CI job loads every page in Chromium and fails on an uncaught error, a console error,
a missing or duplicated `h1`, or a broken internal link.

## Content rules

Content lives in `assets/projects-data.js`, not in the HTML. Two rules it follows:

1. **Every project carries a status.** `pub` published · `live` in production · `dev` in
   development · `plan` planned · `prop` proposal. Proposals have no results section, because
   they have no results.
2. **Findings come from the work.** Numbers in a project's findings are taken from that
   repository's notebook output or README. Nothing is estimated or illustrative unless it says so.

Repository visibility is set in `assets/data.js`. A project whose repo is marked private renders
"Code on request" instead of a GitHub link, so no visitor hits a 404.

## Deploy

GitHub Pages from the repository root — Settings → Pages → *Deploy from a branch*, `main`, `/ (root)`.

Pages has to be switched on by hand once: neither the REST API nor `actions/configure-pages`
can create the site, because creating it needs admin rights that `GITHUB_TOKEN` does not carry.
After that first switch-on, every push to `main` publishes within a minute or so.

`CNAME` holds the custom domain and `.nojekyll` tells Pages to serve the files as they are.
Branch-based deployment reads `CNAME` from the repository root, so the custom domain is picked
up without touching settings again.

DNS for an apex domain needs four `A` records pointing at GitHub Pages
(185.199.108–111.153), plus a `CNAME` for `www` to `<username>.github.io`.
