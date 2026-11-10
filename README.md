# serenaitchison.com

Research portfolio of Seren Aitchison: medicinal chemistry, computational biology and machine learning.

A static site with no build step — HTML, CSS and ES modules. What is deployed is the source.

## Structure

```
index.html              homepage: hero, workbench, pathways, capabilities, featured work
projects.html           searchable project directory, filterable by theme
project.html?p=<id>     project detail, laid out as a short paper
research.html           five research themes and seven independent proposals
lab.html                the Computational Lab: six interactive tools
skills.html             capability matrix, every entry linked to evidence
methods.html            reference library: 19 methods, with assumptions and failure modes
writing.html            longer method notes
about.html              background and the dissertation case study
phd.html                pathway for doctoral supervisors (incl. UCL and Sydney sections)
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

Six tools; three query public APIs directly from the visitor's browser:

| Tool | Source | Notes |
|---|---|---|
| Pharmacogenomics explorer | Ensembl REST + VEP | Allele function and gene–drug pairs curated from CPIC |
| Diplotype to phenotype | — | CPIC activity scores and function rules for 7 genes, computed in the page |
| Population frequencies | Ensembl REST (gnomAD) | The `pops=1` query is slow — up to a minute |
| Molecular explorer | PubChem PUG REST | 3D structures rendered with 3Dmol.js |
| Interaction networks | STRING | Falls back to a bundled example set if unreachable |
| Statistics studio | — | Computed in the page from a seeded generator |

All four external hosts send `Access-Control-Allow-Origin: *`. Requests are sent without custom
headers on purpose: adding one triggers a CORS preflight that PubChem does not answer.

Every API call retries twice, because a throttled response arrives without CORS headers and the
browser reports it as a network error rather than a status code.

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

GitHub Pages from the repository root. `CNAME` holds the custom domain and `.nojekyll` tells Pages
to serve the files as they are.

DNS for an apex domain needs four `A` records pointing at GitHub Pages
(185.199.108–111.153), plus a `CNAME` for `www` to `<username>.github.io`.
