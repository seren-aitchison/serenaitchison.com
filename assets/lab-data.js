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
