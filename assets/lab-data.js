// Curated reference data for the Lab tools.
// Allele function categories and gene–drug pairs follow CPIC. Variant coordinates are fetched live
// from Ensembl rather than stored here, so nothing on screen is a stale copy.

export const PGX = {
  CYP2C19: {
    role: "Hepatic enzyme; activates clopidogrel and metabolises several antidepressants and proton-pump inhibitors.",
    drugs: ["Clopidogrel", "Voriconazole", "Citalopram / escitalopram", "Proton-pump inhibitors"],
    cpic: "A",
    variants: [
      { rs: "rs4244285", allele: "*2", fn: "No function", note: "Splicing defect. The most common loss-of-function allele worldwide." },
      { rs: "rs4986893", allele: "*3", fn: "No function", note: "Premature stop codon; more frequent in East Asian populations." },
      { rs: "rs12248560", allele: "*17", fn: "Increased function", note: "Promoter variant associated with increased transcription." },
    ],
  },
  CYP2D6: {
    role: "Metabolises roughly a quarter of commonly prescribed drugs, including codeine and tamoxifen.",
    drugs: ["Codeine", "Tramadol", "Tamoxifen", "Tricyclic antidepressants"],
    cpic: "A",
    variants: [
      { rs: "rs3892097", allele: "*4", fn: "No function", note: "Splice-site defect; the most common non-functional allele in European populations." },
      { rs: "rs35742686", allele: "*3", fn: "No function", note: "Frameshift deletion." },
      { rs: "rs5030655", allele: "*6", fn: "No function", note: "Single-base deletion." },
    ],
    caveat: "CYP2D6 also has gene deletions, duplications and hybrid alleles that single-variant genotyping cannot detect. Phenotype assignment needs copy-number data.",
  },
  SLCO1B1: {
    role: "Hepatic uptake transporter. Reduced function raises statin plasma exposure.",
    drugs: ["Simvastatin", "Atorvastatin", "Rosuvastatin"],
    cpic: "A",
    variants: [
      { rs: "rs4149056", allele: "*5 / *15", fn: "Decreased function", note: "Associated with simvastatin-related myopathy risk." },
    ],
  },
  DPYD: {
    role: "Rate-limiting enzyme in the catabolism of fluoropyrimidine chemotherapy.",
    drugs: ["5-Fluorouracil", "Capecitabine"],
    cpic: "A",
    variants: [
      { rs: "rs3918290", allele: "*2A", fn: "No function", note: "Splice variant. Associated with severe fluoropyrimidine toxicity." },
      { rs: "rs55886062", allele: "*13", fn: "No function", note: "Missense variant with markedly reduced activity." },
      { rs: "rs67376798", allele: "c.2846A>T", fn: "Decreased function", note: "Partial loss of enzyme activity." },
    ],
  },
  TPMT: {
    role: "Inactivates thiopurine drugs. Reduced activity increases the risk of myelosuppression.",
    drugs: ["Azathioprine", "Mercaptopurine", "Thioguanine"],
    cpic: "A",
    variants: [
      { rs: "rs1142345", allele: "*3C", fn: "No function", note: "Present in *3A and *3C haplotypes." },
      { rs: "rs1800460", allele: "*3B", fn: "No function", note: "Usually found together with rs1142345 as *3A." },
      { rs: "rs1800462", allele: "*2", fn: "No function", note: "Less common loss-of-function allele." },
    ],
  },
  NUDT15: {
    role: "Hydrolyses active thiopurine metabolites. Loss of function raises toxicity risk independently of TPMT.",
    drugs: ["Azathioprine", "Mercaptopurine", "Thioguanine"],
    cpic: "A",
    variants: [
      { rs: "rs116855232", allele: "*3", fn: "No function", note: "A major determinant of thiopurine toxicity in East Asian populations, which TPMT testing alone misses." },
    ],
  },
  CYP2C9: {
    role: "Metabolises warfarin, phenytoin and several NSAIDs.",
    drugs: ["Warfarin", "Phenytoin", "NSAIDs"],
    cpic: "A",
    variants: [
      { rs: "rs1799853", allele: "*2", fn: "Decreased function", note: "Reduced catalytic activity." },
      { rs: "rs1057910", allele: "*3", fn: "Decreased function", note: "Substantially reduced activity; larger effect than *2." },
    ],
  },
  VKORC1: {
    role: "The target of warfarin rather than a metabolising enzyme.",
    drugs: ["Warfarin"],
    cpic: "A",
    variants: [
      { rs: "rs9923231", allele: "−1639G>A", fn: "Target sensitivity", note: "Promoter variant associated with lower warfarin dose requirement. A target variant, not a metabolism variant." },
    ],
  },
};

export const PGX_NOTE =
  "HLA-B*57:01 (abacavir) and HLA-B*15:02 (carbamazepine) are equally important CPIC pairs, but they are HLA alleles rather than single rsIDs, so they need a different typing approach and are not covered by this tool.";

export const FREQ_VARIANTS = [
  { rs: "rs429358", label: "rs429358 · APOE", note: "One of the two SNPs defining the APOE ε2/ε3/ε4 haplotypes." },
  { rs: "rs4244285", label: "rs4244285 · CYP2C19*2", note: "Loss-of-function allele affecting clopidogrel activation." },
  { rs: "rs1801133", label: "rs1801133 · MTHFR", note: "C677T; affects folate metabolism." },
  { rs: "rs4149056", label: "rs4149056 · SLCO1B1*5", note: "Associated with statin myopathy risk." },
  { rs: "rs116855232", label: "rs116855232 · NUDT15*3", note: "Frequency differs markedly between ancestry groups." },
  { rs: "rs9923231", label: "rs9923231 · VKORC1", note: "Warfarin dose-requirement variant." },
];

// Population group labels used by gnomAD.
export const POPS = {
  afr: "African / African American", amr: "Admixed American", asj: "Ashkenazi Jewish",
  eas: "East Asian", fin: "Finnish", nfe: "Non-Finnish European", sas: "South Asian",
  mid: "Middle Eastern", remaining: "Remaining", ALL: "Combined (all groups)",
};

// PubChem compound IDs. Names are taken from PubChem's own response, not from these labels.
export const COMPOUNDS = [
  { cid: 7362, label: "Furfural", why: "The biobased starting material for my dissertation's heterocyclic scaffold." },
  { cid: 7361, label: "Furfuryl alcohol", why: "Reduction product of furfural; a reference point for the same chemistry." },
  { cid: 60606, label: "Clopidogrel", why: "A prodrug requiring CYP2C19 activation — the pharmacogenomics worked example." },
  { cid: 54678486, label: "Warfarin", why: "Two pharmacogenes, acting by different mechanisms: CYP2C9 and VKORC1." },
  { cid: 54454, label: "Simvastatin", why: "SLCO1B1 transport and myopathy risk." },
  { cid: 5284371, label: "Codeine", why: "CYP2D6-dependent activation to morphine." },
  { cid: 3385, label: "Fluorouracil", why: "DPYD-dependent catabolism; a toxicity-driven pairing." },
  { cid: 5291, label: "Imatinib", why: "A targeted kinase inhibitor, for contrast with the small metabolites above." },
  { cid: 2244, label: "Aspirin", why: "A small, well-behaved reference compound." },
];

// Rule sets applied to PubChem descriptors. Heuristics for oral bioavailability, nothing more.
export const RULES = [
  { id: "mw", name: "Molecular weight ≤ 500", prop: "MolecularWeight", test: (v) => v <= 500, set: "Lipinski" },
  { id: "logp", name: "XLogP ≤ 5", prop: "XLogP", test: (v) => v <= 5, set: "Lipinski" },
  { id: "hbd", name: "H-bond donors ≤ 5", prop: "HBondDonorCount", test: (v) => v <= 5, set: "Lipinski" },
  { id: "hba", name: "H-bond acceptors ≤ 10", prop: "HBondAcceptorCount", test: (v) => v <= 10, set: "Lipinski" },
  { id: "tpsa", name: "TPSA ≤ 140 Å²", prop: "TPSA", test: (v) => v <= 140, set: "Veber" },
  { id: "rot", name: "Rotatable bonds ≤ 10", prop: "RotatableBondCount", test: (v) => v <= 10, set: "Veber" },
];

// Fallback network, used when the STRING API cannot be reached from the browser.
// Edges are illustrative relationships for the demonstration, not STRING confidence scores.
export const NET_FALLBACK = {
  CYP2C19: [
    ["CYP2C9", 0.93], ["CYP3A4", 0.91], ["CYP2C8", 0.88], ["CYP2D6", 0.86], ["POR", 0.85],
    ["CYP2B6", 0.82], ["NR1I2", 0.80], ["CYB5A", 0.78], ["ABCB1", 0.74], ["CYP1A2", 0.72],
    ["CYP2E1", 0.70], ["UGT1A1", 0.66], ["NR1I3", 0.64], ["CYP2A6", 0.62], ["GSTP1", 0.55],
  ],
  APOE: [
    ["LRP1", 0.95], ["LDLR", 0.94], ["APP", 0.90], ["CLU", 0.88], ["ABCA1", 0.87],
    ["TOMM40", 0.85], ["APOC1", 0.84], ["SORL1", 0.80], ["TREM2", 0.77], ["VLDLR", 0.75],
    ["LPL", 0.72], ["APOA1", 0.70], ["HSPG2", 0.64], ["PSEN1", 0.60],
  ],
  TP53: [
    ["MDM2", 0.99], ["CDKN1A", 0.98], ["ATM", 0.96], ["BAX", 0.94], ["CHEK2", 0.93],
    ["EP300", 0.91], ["BRCA1", 0.90], ["RB1", 0.86], ["CASP9", 0.82], ["SIRT1", 0.78],
    ["PTEN", 0.74], ["MYC", 0.70], ["E2F1", 0.68],
  ],
};

// ---------------------------------------------------------------------------
// Diplotype → phenotype. Implements the CPIC framework: each allele carries a
// function (and, for activity-score genes, a numeric value); a diplotype is the
// pair. Two assignment styles are used, matching CPIC's own:
//   "score"    sum the two activity values, then band the total
//   "function" map the pair of function categories directly
// Allele function assignments follow CPIC allele definition and function tables.
// This reproduces the published framework for teaching. It is not a clinical
// calling tool: real assignment needs the full tested allele set, phase, and
// copy number, and the current guideline should always be checked directly.
// ---------------------------------------------------------------------------

export const DIPLO = {
  CYP2D6: {
    mode: "score",
    drugs: "Codeine, tramadol, tamoxifen, tricyclic antidepressants",
    note: "CYP2D6 is the hardest pharmacogene to call. Gene deletions, duplications and hybrids with CYP2D7 mean copy number has to be measured, not assumed — a duplicated normal-function allele doubles its contribution.",
    alleles: [
      { a: "*1", v: 1, fn: "Normal function" },
      { a: "*2", v: 1, fn: "Normal function" },
      { a: "*1x2", v: 2, fn: "Normal function, duplicated" },
      { a: "*9", v: 0.5, fn: "Decreased function" },
      { a: "*17", v: 0.5, fn: "Decreased function" },
      { a: "*29", v: 0.5, fn: "Decreased function" },
      { a: "*41", v: 0.5, fn: "Decreased function" },
      { a: "*10", v: 0.25, fn: "Decreased function" },
      { a: "*3", v: 0, fn: "No function" },
      { a: "*4", v: 0, fn: "No function" },
      { a: "*5", v: 0, fn: "No function (gene deletion)" },
      { a: "*6", v: 0, fn: "No function" },
    ],
    bands: [
      { max: 0, label: "Poor metaboliser", cls: "bad" },
      { max: 1.0, label: "Intermediate metaboliser", cls: "warn" },
      { max: 2.25, label: "Normal metaboliser", cls: "ok" },
      { max: Infinity, label: "Ultrarapid metaboliser", cls: "warn" },
    ],
    consequence: {
      "Poor metaboliser": "For codeine and tramadol, little conversion to the active opioid, so reduced analgesia. For tamoxifen, reduced formation of endoxifen.",
      "Intermediate metaboliser": "Reduced conversion relative to normal metabolisers; the clinical significance depends on the drug and the score.",
      "Normal metaboliser": "Expected conversion. Standard dosing considerations apply.",
      "Ultrarapid metaboliser": "Rapid conversion of codeine and tramadol to active opioid, with a corresponding risk of toxicity. CPIC advises avoiding codeine in this group.",
    },
  },
  CYP2C19: {
    mode: "function",
    drugs: "Clopidogrel, voriconazole, SSRIs, proton-pump inhibitors",
    note: "CYP2C19 has an increased-function promoter allele (*17) as well as loss-of-function alleles, so the phenotype runs in both directions from normal.",
    alleles: [
      { a: "*1", fn: "Normal function" },
      { a: "*17", fn: "Increased function" },
      { a: "*2", fn: "No function" },
      { a: "*3", fn: "No function" },
    ],
    rules: [
      { has: ["Normal function", "Normal function"], label: "Normal metaboliser", cls: "ok" },
      { has: ["Normal function", "Increased function"], label: "Rapid metaboliser", cls: "warn" },
      { has: ["Increased function", "Increased function"], label: "Ultrarapid metaboliser", cls: "warn" },
      { has: ["Normal function", "No function"], label: "Intermediate metaboliser", cls: "warn" },
      { has: ["Increased function", "No function"], label: "Intermediate metaboliser", cls: "warn" },
      { has: ["No function", "No function"], label: "Poor metaboliser", cls: "bad" },
    ],
    consequence: {
      "Normal metaboliser": "Expected clopidogrel activation.",
      "Rapid metaboliser": "Increased activation of clopidogrel; for PPIs, lower exposure and potentially reduced effect.",
      "Ultrarapid metaboliser": "As rapid, more pronounced. PPI exposure may be substantially reduced.",
      "Intermediate metaboliser": "Reduced clopidogrel activation. CPIC recommends considering an alternative antiplatelet after acute coronary syndrome or PCI.",
      "Poor metaboliser": "Markedly reduced clopidogrel activation, and an alternative antiplatelet is recommended in that setting.",
    },
  },
  CYP2C9: {
    mode: "score",
    drugs: "Warfarin, phenytoin, NSAIDs",
    note: "Warfarin dosing depends on CYP2C9 together with VKORC1, which is a target variant rather than a metabolism variant — two genes acting by different mechanisms on one drug.",
    alleles: [
      { a: "*1", v: 1, fn: "Normal function" },
      { a: "*2", v: 0.5, fn: "Decreased function" },
      { a: "*8", v: 0.5, fn: "Decreased function" },
      { a: "*11", v: 0.5, fn: "Decreased function" },
      { a: "*3", v: 0, fn: "No function" },
      { a: "*6", v: 0, fn: "No function" },
    ],
    bands: [
      { max: 0.5, label: "Poor metaboliser", cls: "bad" },
      { max: 1.5, label: "Intermediate metaboliser", cls: "warn" },
      { max: Infinity, label: "Normal metaboliser", cls: "ok" },
    ],
    consequence: {
      "Poor metaboliser": "Substantially reduced clearance; for warfarin, a markedly lower dose requirement and higher bleeding risk during initiation.",
      "Intermediate metaboliser": "Reduced clearance and a lower dose requirement than normal metabolisers.",
      "Normal metaboliser": "Expected clearance.",
    },
  },
  DPYD: {
    mode: "score",
    drugs: "5-Fluorouracil, capecitabine",
    note: "This is a toxicity-avoidance gene rather than an efficacy one. Reduced DPD activity means fluoropyrimidine is cleared slowly, and severe toxicity can follow a standard dose.",
    alleles: [
      { a: "Reference", v: 1, fn: "Normal function" },
      { a: "c.2846A>T", v: 0.5, fn: "Decreased function" },
      { a: "c.1236G>A (HapB3)", v: 0.5, fn: "Decreased function" },
      { a: "*2A", v: 0, fn: "No function" },
      { a: "*13", v: 0, fn: "No function" },
    ],
    bands: [
      { max: 0.5, label: "Poor metaboliser", cls: "bad" },
      { max: 1.5, label: "Intermediate metaboliser", cls: "warn" },
      { max: Infinity, label: "Normal metaboliser", cls: "ok" },
    ],
    consequence: {
      "Poor metaboliser": "Very high risk of severe or fatal toxicity. CPIC advises avoiding fluoropyrimidines, or a strongly reduced dose with close monitoring.",
      "Intermediate metaboliser": "Increased toxicity risk; CPIC advises starting at a reduced dose with subsequent titration.",
      "Normal metaboliser": "Standard starting dose by the usual clinical criteria.",
    },
  },
  TPMT: {
    mode: "function",
    drugs: "Azathioprine, mercaptopurine, thioguanine",
    note: "TPMT and NUDT15 both govern thiopurine toxicity through different steps. Testing only TPMT misses a major risk allele that is common in East Asian populations.",
    alleles: [
      { a: "*1", fn: "Normal function" },
      { a: "*2", fn: "No function" },
      { a: "*3A", fn: "No function" },
      { a: "*3B", fn: "No function" },
      { a: "*3C", fn: "No function" },
    ],
    rules: [
      { has: ["Normal function", "Normal function"], label: "Normal metaboliser", cls: "ok" },
      { has: ["Normal function", "No function"], label: "Intermediate metaboliser", cls: "warn" },
      { has: ["No function", "No function"], label: "Poor metaboliser", cls: "bad" },
    ],
    consequence: {
      "Normal metaboliser": "Standard starting dose.",
      "Intermediate metaboliser": "Accumulation of active thioguanine nucleotides; CPIC advises a reduced starting dose.",
      "Poor metaboliser": "High risk of severe myelosuppression at conventional doses; a drastically reduced dose or an alternative agent is advised.",
    },
  },
  NUDT15: {
    mode: "function",
    drugs: "Azathioprine, mercaptopurine, thioguanine",
    note: "Loss of NUDT15 function raises thiopurine toxicity risk independently of TPMT, and is far more common in East Asian than European populations.",
    alleles: [
      { a: "*1", fn: "Normal function" },
      { a: "*2", fn: "No function" },
      { a: "*3", fn: "No function" },
    ],
    rules: [
      { has: ["Normal function", "Normal function"], label: "Normal metaboliser", cls: "ok" },
      { has: ["Normal function", "No function"], label: "Intermediate metaboliser", cls: "warn" },
      { has: ["No function", "No function"], label: "Poor metaboliser", cls: "bad" },
    ],
    consequence: {
      "Normal metaboliser": "Standard starting dose.",
      "Intermediate metaboliser": "Increased myelosuppression risk; CPIC advises a reduced starting dose.",
      "Poor metaboliser": "High risk of severe myelosuppression; a substantially reduced dose or alternative agent is advised.",
    },
  },
  SLCO1B1: {
    mode: "function",
    drugs: "Simvastatin, atorvastatin, rosuvastatin",
    note: "SLCO1B1 is a hepatic uptake transporter, so reduced function raises statin concentration in plasma rather than changing how fast it is metabolised. CPIC describes this gene by transporter function, not metaboliser status.",
    alleles: [
      { a: "*1", fn: "Normal function" },
      { a: "*5", fn: "Decreased function" },
      { a: "*15", fn: "Decreased function" },
      { a: "*17", fn: "Decreased function" },
    ],
    rules: [
      { has: ["Normal function", "Normal function"], label: "Normal function", cls: "ok" },
      { has: ["Normal function", "Decreased function"], label: "Decreased function", cls: "warn" },
      { has: ["Decreased function", "Decreased function"], label: "Poor function", cls: "bad" },
    ],
    consequence: {
      "Normal function": "Expected hepatic uptake; standard dosing considerations.",
      "Decreased function": "Higher statin plasma exposure and increased myopathy risk, particularly with simvastatin at higher doses.",
      "Poor function": "Substantially higher exposure; CPIC advises a lower dose or an alternative statin.",
    },
  },
};
