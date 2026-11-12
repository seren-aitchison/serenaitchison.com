// Site content. Findings for published work come from the repositories' READMEs and notebook outputs.
// Status: pub = Published on GitHub, dev = In development, plan = Planned, prop = Research proposal, live = Live software.

export const PERSON = {
  name: "Seren Aitchison",
  initials: "SA",
  email: "seren.aitchison@gmail.com",
  github: "https://github.com/seren-aitchison",
  linkedin: "https://www.linkedin.com/in/seren-aitchison-8961741b9/",
  domain: "serenaitchison.com",
  degree: "BSc Medicinal Chemistry",
  uni: "Cardiff University",
  years: "2022–2025",
  grade: "2:1",
  dissertation: "Catalytic Synthesis and Characterisation of a Biobased Heterocyclic Scaffold with Medicinal Potential",
};

export const STATUS = {
  pub: { label: "Published", cls: "is-pub" },
  dev: { label: "In development", cls: "is-dev" },
  plan: { label: "Planned", cls: "is-plan" },
  prop: { label: "Proposal", cls: "is-prop" },
  live: { label: "Live", cls: "is-live" },
};

export const THEMES = {
  pgx: { name: "Pharmacogenomics", c: "#4d7dff", icon: "pill" },
  stat: { name: "Statistical genetics", c: "#3f9be0", icon: "chart" },
  omics: { name: "Genomics & omics", c: "#36b6c9", icon: "dna" },
  chem: { name: "Computational chemistry", c: "#7c8cff", icon: "atom" },
  sys: { name: "Systems biology", c: "#2fa7a0", icon: "network" },
  ml: { name: "Machine learning", c: "#5b6cf0", icon: "cpu" },
  cell: { name: "Single-cell & spatial", c: "#2fa7a0", icon: "beaker" },
  eng: { name: "Engineering", c: "#8a96ad", icon: "code" },
};

// repo: GitHub repo name. pub: true if the repository is public; otherwise the site shows "Code on request".
export const REPOS = {
  "pharmacogenomics-variant-interpretation": false,
  "population-frequency-analysis": false,
  "variant-consequence-annotation": false,
  "drug-gene-interaction-analysis": false,
  "gene-expression-analysis": false,
  "gwas-qc-mini": false,
  "gwas-visualisation-mini": true,
  "gwas-association-interpretation": true,
  "gwas-gene-annotation": true,
  "gwas-real-gene-annotation": true,
  "Gradify": true,
  "ForgeLab": false,
};
export const repoUrl = (r) => `https://github.com/seren-aitchison/${r}`;
