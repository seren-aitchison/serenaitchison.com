// A reference library of computational methods. For each: the problem it solves, the idea behind it,
// the assumptions it makes, how it fails, and how to read its output. Written from working use.

export const CATEGORIES = [
  ["all", "All methods"],
  ["struct", "Structure and dimensionality"],
  ["test", "Statistical testing"],
  ["model", "Predictive modelling"],
  ["surv", "Time-to-event"],
  ["gen", "Genetics"],
  ["chem", "Chemistry"],
  ["net", "Networks"],
];

export const METHODS = [
  /* ---------------- Structure and dimensionality ---------------- */
  {
    id: "pca", cat: "struct", name: "Principal component analysis", short: "PCA",
    solves: "Reduce many correlated measurements to a few axes that carry most of the variance, without choosing which variables matter in advance.",
    idea: "Find the orthogonal directions along which the data varies most. Formally, the principal components are the eigenvectors of the covariance matrix, ordered by eigenvalue; equivalently they come from the singular value decomposition X = UΣVᵀ, where the columns of V are the component loadings and the squared singular values give the variance each component explains.",
    assumptions: [
      "Variance is the quantity of interest. A low-variance direction is assumed uninteresting, which is not always true — a small but consistent shift can matter more than a large noisy one.",
      "Linearity: components are linear combinations of the original variables.",
      "Scale matters. Without standardising, a variable measured in larger units dominates purely through its units.",
    ],
    fails: [
      "The first component is frequently a technical artefact — batch, library size, or sequencing depth — rather than biology. This is so common it is worth assuming until disproved.",
      "Outliers pull components towards themselves, because squared deviations reward extreme points.",
      "Components are orthogonal by construction, which biology is not. A single pathway can spread across several components.",
    ],
    read: "Report the proportion of variance explained for each component kept, and plot samples coloured by known technical covariates before interpreting anything as biological. If PC1 separates your batches, you have found your batch effect, not your subtypes.",
    use: "Standard first look at any expression matrix, and the usual precursor to clustering or UMAP.",
    ref: "Pearson (1901); Hotelling (1933).",
  },
  {
    id: "umap", cat: "struct", name: "UMAP and t-SNE", short: "Nonlinear embedding",
    solves: "Place high-dimensional points on a 2D plane so that similar points land near each other, for visual inspection.",
    idea: "Both build a graph of local neighbourhoods in the original space, then optimise a low-dimensional layout whose neighbourhood structure matches it. UMAP frames this as matching fuzzy simplicial sets with cross-entropy; t-SNE matches neighbour probability distributions with KL divergence. Both are optimisations over local relationships only.",
    assumptions: [
      "Local neighbourhoods carry the structure worth seeing.",
      "The data lies on a manifold that can be approximated locally — UMAP makes this explicit.",
      "A neighbourhood size has been chosen (n_neighbors, or perplexity), and it determines what counts as local.",
    ],
    fails: [
      "Distance between clusters is not interpretable. Two well-separated blobs are not necessarily more different than two adjacent ones.",
      "Cluster size and density on the plot are artefacts of the layout, not measurements of abundance or variance.",
      "Different random seeds give visually different plots. Structure that moves between seeds is not structure.",
    ],
    read: "Treat it as a way of seeing whether structure exists, never as a measurement. Any claim read off an embedding should be confirmed in the original space — marker genes, a statistical test, or stability across parameters.",
    use: "Visualising expression and single-cell data alongside clustering; also one of the fastest ways to spot a batch effect.",
    ref: "van der Maaten & Hinton (2008); McInnes, Healy & Melville (2018).",
  },
  {
    id: "cluster", cat: "struct", name: "Clustering: k-means, hierarchical, consensus", short: "Clustering",
    solves: "Partition samples or cells into groups without labels, as a hypothesis about structure.",
    idea: "k-means minimises within-cluster squared distance to k centroids, alternating assignment and update until stable. Hierarchical clustering instead builds a tree by repeatedly merging the closest pair under a linkage rule. Consensus clustering re-runs the procedure on resampled data many times and keeps the groupings that recur.",
    assumptions: [
      "k-means assumes roughly spherical, similarly sized clusters, because it uses Euclidean distance to a centroid.",
      "Hierarchical clustering assumes the linkage rule reflects something real; single, complete and average linkage can give substantially different trees from identical data.",
      "Both assume a number of clusters has been chosen, or a tree cut somewhere.",
    ],
    fails: [
      "Every clustering algorithm returns clusters. Receiving an answer is not evidence that groups exist.",
      "k is a decision, and reporting the number of clusters as a finding without reporting how k was chosen presents a decision as a result.",
      "Distance in high dimensions becomes less discriminating — points tend towards equidistance — so clustering on thousands of unfiltered features often finds little.",
    ],
    read: "Report k and how it was chosen, show stability under resampling, and give the clusters an external justification: known markers, clinical association, or replication in a second cohort. Consensus clustering across resamples is the honest minimum.",
    use: "Proposed for molecular subtyping in the multi-omics work.",
    ref: "Lloyd (1957/1982); Monti et al. (2003) for consensus clustering.",
  },
  {
    id: "leiden", cat: "struct", name: "Leiden and Louvain community detection", short: "Graph clustering",
    solves: "Find groups in a network — including a nearest-neighbour graph built from cells — without specifying how many.",
    idea: "Optimise modularity, which compares the density of edges inside a candidate community against what would be expected in a random graph with the same degrees. Louvain moves nodes greedily between communities then aggregates; Leiden adds a refinement step that guarantees communities are internally connected, which Louvain does not.",
    assumptions: [
      "The graph is a faithful summary of similarity. For single-cell data that means the k-nearest-neighbour construction already encoded the right notion of similar.",
      "Modularity is the right objective, and a resolution parameter has been set.",
    ],
    fails: [
      "Modularity has a resolution limit: communities smaller than a scale set by the graph size can be absorbed into larger ones and become invisible.",
      "Louvain can produce internally disconnected communities — a real defect, and the reason Leiden exists.",
      "The resolution parameter effectively sets the number of clusters. Tuning it until the cell-type count looks right is circular.",
    ],
    read: "State the resolution and show how the partition changes across a range of it. Cell types that persist across resolutions are more credible than ones that appear at a single setting.",
    use: "The standard clustering step in the proposed single-cell work.",
    ref: "Blondel et al. (2008); Traag, Waltman & van Eck (2019).",
  },

  /* ---------------- Statistical testing ---------------- */
  {
    id: "de", cat: "test", name: "Differential expression with count models", short: "DE testing",
    solves: "Decide which genes differ in expression between conditions, given RNA-seq counts and few replicates.",
    idea: "Model counts with a negative binomial distribution: a Poisson whose rate itself varies, giving the extra variance real data shows. Each gene gets a dispersion parameter, estimated by pooling information across genes, since a handful of replicates cannot estimate it reliably on its own. A generalised linear model then tests whether the condition coefficient differs from zero.",
    assumptions: [
      "Counts are negative binomially distributed, with mean-dependent dispersion.",
      "Most genes are not differentially expressed — this underpins the normalisation of library size.",
      "Dispersion can be shared across genes with similar expression, which is what makes small-n experiments tractable.",
    ],
    fails: [
      "Normalisation breaks when a large fraction of the transcriptome really does shift, as under global transcriptional amplification.",
      "Fold change without a variance estimate says nothing. With one sample per condition, no test is possible at all.",
      "Statistical significance for a tiny fold change is a statement about sample size, not biological importance. Shrunk log-fold-change estimates are the better quantity to rank by.",
    ],
    read: "Report the effect size and the adjusted p-value together, state the model used, and treat a gene list as a hypothesis set rather than a finding.",
    use: "The replacement for the illustrative fold-change workflow; the method the multi-omics proposal would use.",
    ref: "Robinson, McCarthy & Smyth (2010), edgeR; Love, Huber & Anders (2014), DESeq2.",
  },
  {
    id: "mt", cat: "test", name: "Multiple testing correction", short: "FDR and Bonferroni",
    solves: "Control the error rate when thousands or millions of hypotheses are tested at once.",
    idea: "Bonferroni divides the target error rate by the number of tests, controlling the probability of even one false positive (the family-wise error rate). Benjamini–Hochberg instead ranks p-values and finds the largest k with p₍k₎ ≤ k·α/m, controlling the expected proportion of false positives among the rejections — the false discovery rate.",
    assumptions: [
      "Bonferroni needs no independence assumption but is conservative when tests are correlated — as neighbouring variants and co-expressed genes always are.",
      "Benjamini–Hochberg assumes independence or positive regression dependence; the Benjamini–Yekutieli variant removes that at a cost in power.",
      "p-values are correctly calibrated under the null. If the underlying model is wrong, no correction rescues it.",
    ],
    fails: [
      "Correcting only the tests you report, after looking at the data, controls nothing.",
      "An FDR of 5% on 200 genes means roughly 10 of them are expected to be false. That is a property of the list, not of any single gene in it.",
      "Genome-wide significance at 5 × 10⁻⁸ is a Bonferroni-style correction for about a million effectively independent common variants. It is a convention for a particular setting, not a universal threshold.",
    ],
    read: "Say which correction was applied and to how many tests. Report adjusted values, and be explicit that an FDR threshold describes the list rather than licensing confidence in individual entries.",
    use: "Demonstrated interactively in the statistics studio, where raising the variant count with no true signals shows the problem directly.",
    ref: "Benjamini & Hochberg (1995); Benjamini & Yekutieli (2001).",
  },
  {
    id: "enrich", cat: "test", name: "Pathway and gene-set enrichment", short: "Enrichment",
    solves: "Ask whether a result concentrates in genes sharing an annotated function, rather than reading a long gene list by eye.",
    idea: "Over-representation analysis tests whether a gene set appears in a selected list more often than chance, usually with a hypergeometric test. GSEA avoids the selection step: it walks the full ranked list, accumulating a running score that rises at set members and falls elsewhere, and tests the resulting enrichment score against permutations.",
    assumptions: [
      "The background universe is correctly specified — all genes that could have been detected, not all genes that exist.",
      "Annotations are complete and unbiased, which they are not: well-studied genes have more annotations, so popular pathways enrich more readily.",
      "For GSEA, that the ranking metric is meaningful across the whole list.",
    ],
    fails: [
      "Using the wrong background inflates everything. Testing against the whole genome when only expressed genes could be detected is the most common version of this.",
      "Gene sets overlap heavily, so enriched pathways are correlated and the apparent number of independent findings is far lower than the list length.",
      "Enrichment is a statement about annotation, not activity. A pathway is not 'activated' because its members moved.",
    ],
    read: "State the background, the annotation source and version, and the correction. Prefer a few well-supported sets with a sensible biological story over a screenshot of forty redundant terms.",
    use: "Planned for interpreting subgroups in the multi-omics work.",
    ref: "Subramanian et al. (2005).",
  },

  /* ---------------- Predictive modelling ---------------- */
  {
    id: "reg", cat: "model", name: "Regularised regression", short: "Ridge, lasso, elastic net",
    solves: "Fit a regression when there are more features than samples — the normal situation in omics.",
    idea: "Add a penalty on coefficient size to the loss. Ridge penalises the sum of squares (L2), shrinking coefficients smoothly; lasso penalises the sum of absolute values (L1), which drives some coefficients exactly to zero and so selects features; elastic net mixes the two, keeping lasso's sparsity while handling correlated predictors more gracefully.",
    assumptions: [
      "Features are standardised, since the penalty applies to coefficient magnitude and is otherwise driven by units.",
      "A sparse or small-coefficient solution is appropriate — a real assumption about the biology, not a neutral default.",
      "The regularisation strength is tuned, properly, on data not used for final evaluation.",
    ],
    fails: [
      "Lasso selects arbitrarily among correlated predictors. With co-expressed genes it may keep one and drop the rest, and the one it keeps can change with a resample. Reading the selected gene as 'the important one' is a mistake.",
      "Tuning the penalty on the test set leaks information and inflates the reported performance.",
      "Coefficients are shrunk, so they are biased by design and should not be read as unbiased effect estimates.",
    ],
    read: "Report the penalty, how it was chosen, and the stability of the selected features across resamples. Selection frequency across bootstraps is far more informative than one model's chosen set.",
    use: "Proposed as a baseline in the cancer biomarker work, alongside tree ensembles.",
    ref: "Hoerl & Kennard (1970); Tibshirani (1996); Zou & Hastie (2005).",
  },
  {
    id: "trees", cat: "model", name: "Random forests and gradient boosting", short: "Tree ensembles",
    solves: "Model nonlinear relationships and interactions in tabular data without specifying a functional form.",
    idea: "A decision tree splits the feature space recursively to reduce impurity. Random forests build many deep trees on bootstrap samples with a random subset of features at each split and average them, cutting variance. Gradient boosting instead builds shallow trees sequentially, each fitted to the gradient of the loss left by the previous ones, cutting bias.",
    assumptions: [
      "Patterns are expressible as axis-aligned splits; a diagonal boundary needs many steps to approximate.",
      "Training and deployment data come from the same distribution.",
      "For boosting, that the learning rate and tree count are tuned together — they trade off directly.",
    ],
    fails: [
      "Impurity-based feature importance is biased towards high-cardinality and continuous features. Permutation importance is less misleading, and with correlated features both remain hard to read.",
      "Boosting overfits readily without early stopping.",
      "Neither extrapolates. A tree ensemble predicts a constant beyond the range of its training data, which matters when a model trained on one cohort meets another.",
    ],
    read: "Report the tuning procedure and give a calibration curve, not only discrimination. A model with good AUC and poor calibration will assign confident probabilities that do not mean what they say.",
    use: "Proposed for biomarker modelling and molecular property prediction.",
    ref: "Breiman (2001); Friedman (2001); Chen & Guestrin (2016), XGBoost.",
  },
  {
    id: "cv", cat: "model", name: "Cross-validation and validation design", short: "Model evaluation",
    solves: "Estimate how a model will perform on data it has not seen, using the data available.",
    idea: "Split repeatedly into training and held-out folds, fit on the first, evaluate on the second, and average. Nested cross-validation puts an inner loop inside the training fold for hyperparameter tuning, so the outer estimate is never influenced by selection.",
    assumptions: [
      "Folds are independent. Repeated measures from one patient, or cells from one donor, must be kept together or the estimate is optimistic.",
      "Preprocessing is learned inside the training fold. Scaling or feature selection on the whole dataset first leaks information and is one of the most common errors in published models.",
      "The distribution is stable; for time-ordered data, random folds let the model see the future.",
    ],
    fails: [
      "Tuning on the same folds used for reporting gives an optimistically biased estimate — the main reason nested CV exists.",
      "Single-split estimates on small datasets have very wide uncertainty; a single reported AUC without an interval is close to uninformative.",
      "Cross-validation measures generalisation within one dataset. It says nothing about a different cohort, platform or batch.",
    ],
    read: "Report the scheme, the grouping variable, and variability across folds, not just a mean. Independent external validation is a different and stronger claim than cross-validation, and the two should never be described in the same terms.",
    use: "The evaluation standard for any predictive model proposed on this site.",
    ref: "Stone (1974); Varma & Simon (2006) on nested CV.",
  },
  {
    id: "shap", cat: "model", name: "Feature attribution with SHAP", short: "Interpretability",
    solves: "Explain which inputs drove an individual prediction, for a model too complex to read directly.",
    idea: "Treat features as players in a cooperative game and distribute the prediction among them using Shapley values: each feature's average marginal contribution across all orderings. This is the unique attribution satisfying efficiency, symmetry, dummy and additivity; TreeSHAP computes it exactly for tree ensembles in polynomial time.",
    assumptions: [
      "A baseline or background distribution has been chosen — attributions are always relative to it.",
      "Most implementations assume feature independence when marginalising, which correlated biological features violate badly.",
      "That explaining the model is the goal.",
    ],
    fails: [
      "Correlated features split credit in ways that look arbitrary. A model may rely on one gene from a co-expressed module; SHAP reports that faithfully and a reader concludes that gene is the important one.",
      "Confounds are attributed as signal. If batch predicts outcome, batch-carrying features get high attribution — correct about the model, misleading about biology.",
      "Attributions are not causal. Nothing licenses an intervention claim from a model fitted to observational data.",
    ],
    read: "Use it first as a debugging tool: if top features are technical covariates, the model learned the wrong thing. Treat high-attribution features with a plausible mechanism as hypotheses for experimental follow-up, never as findings.",
    use: "Written up at length in the method notes, and planned for the biomarker work.",
    ref: "Shapley (1953); Lundberg & Lee (2017).",
  },

  /* ---------------- Time-to-event ---------------- */
  {
    id: "km", cat: "surv", name: "Kaplan–Meier estimation", short: "Survival curves",
    solves: "Estimate a survival curve when some participants have not had the event by the end of follow-up.",
    idea: "Censoring makes the mean survival time unavailable, so instead estimate survival as a product of conditional probabilities: at each event time, multiply by the fraction of those still at risk who survived it. S(t) = ∏(1 − dᵢ/nᵢ) over event times up to t.",
    assumptions: [
      "Censoring is non-informative: those censored at a time have the same future risk as those remaining. This is the assumption that matters most and is rarely testable.",
      "Survival is comparable across those recruited at different times.",
      "Event times are accurate, and the event is well defined.",
    ],
    fails: [
      "Informative censoring — patients leaving the study because they are deteriorating — biases the curve optimistically.",
      "The tail is estimated from very few people still at risk and can move dramatically on one event. Curves should carry a numbers-at-risk table.",
      "Splitting a continuous biomarker at its optimal cut-point and then comparing curves produces significant-looking separations from noise.",
    ],
    read: "Always show numbers at risk beneath the curve, report median survival with a confidence interval, and state how any grouping variable was dichotomised — and whether that cut-point was chosen using the outcome.",
    use: "Proposed for the cancer biomarker work.",
    ref: "Kaplan & Meier (1958).",
  },
  {
    id: "cox", cat: "surv", name: "Cox proportional hazards", short: "Cox regression",
    solves: "Relate covariates to time-to-event without specifying the shape of the baseline risk.",
    idea: "Model the hazard as h(t|x) = h₀(t)·exp(βᵀx). The baseline hazard h₀(t) stays unspecified and cancels out of the partial likelihood, so β is estimated from the ordering of events alone. exp(β) is the hazard ratio per unit of the covariate.",
    assumptions: [
      "Proportional hazards: the hazard ratio is constant over time. This is the assumption the model is named for and it is frequently violated.",
      "Log-linearity of the covariate effect on the log hazard.",
      "Non-informative censoring, as for Kaplan–Meier.",
      "Enough events for the number of covariates — a rule of thumb is about ten events per parameter, and omics data makes this easy to breach.",
    ],
    fails: [
      "Treatments whose effect emerges late, and curves that cross, violate proportionality outright. Fitting anyway yields a hazard ratio that is a time-average of something non-constant, and so means little.",
      "A hazard ratio is routinely misread as a risk ratio or as a statement about survival time. It is neither.",
      "Fitting thousands of candidate genes one at a time, then reporting the best, needs correction that is often omitted.",
    ],
    read: "Test proportionality — Schoenfeld residuals — and say so. Where it fails, use time-varying coefficients, stratification, or report restricted mean survival time instead, which stays interpretable without the assumption.",
    use: "Proposed for survival modelling in the biomarker work.",
    ref: "Cox (1972); Grambsch & Therneau (1994) on diagnostics.",
  },

  /* ---------------- Genetics ---------------- */
  {
    id: "hwe", cat: "gen", name: "Hardy–Weinberg equilibrium", short: "HWE",
    solves: "Provide an expected relationship between allele and genotype frequencies, used in practice as a genotyping quality check.",
    idea: "In a large, randomly mating population with no selection, mutation or migration, allele frequencies p and q give genotype frequencies p², 2pq and q², stable across generations. Observed genotype counts are compared with these expectations by chi-square or an exact test.",
    assumptions: [
      "Random mating, large population, no selection, migration or mutation at the locus.",
      "No population stratification — a mixture of two populations with different allele frequencies departs from HWE even when each component satisfies it (the Wahlund effect).",
    ],
    fails: [
      "A departure is usually a genotyping artefact, not biology: poor clustering, a null allele, or a probe spanning a variant. Treating it as a finding is the error; treating it as a QC flag is the use.",
      "In a case-control sample, selection on the phenotype can produce a real departure in cases at a genuinely associated locus, which is why HWE filtering is normally applied in controls.",
      "With very large samples, trivial departures become significant.",
    ],
    read: "Report the threshold used and which samples it was applied to. State it as quality control rather than as a result.",
    use: "Standard filtering in GWAS quality control.",
    ref: "Hardy (1908); Weinberg (1908); Wigginton et al. (2005) for the exact test.",
  },
  {
    id: "ld", cat: "gen", name: "Linkage disequilibrium", short: "LD",
    solves: "Describe correlation between nearby variants, which is why genotyping a subset of SNPs can capture most common variation.",
    idea: "LD is non-random association of alleles at different loci. D = p(AB) − p(A)p(B) measures it raw; D′ normalises by its maximum given the allele frequencies, and r² is the squared correlation — the quantity that matters for power, since the sample size needed to detect an effect through a proxy scales as 1/r².",
    assumptions: [
      "LD patterns are population-specific. A tag SNP chosen in one population may not tag the same variant in another, which is a central reason GWAS findings transfer poorly across ancestries.",
      "Recombination has had time to break associations between distant loci.",
    ],
    fails: [
      "The lead SNP in an association signal is usually not causal — it is simply the best-tagged marker in a correlated block. Interpreting it as the functional variant without fine-mapping is a standard overreach.",
      "LD inflates the apparent number of independent signals, so counting significant SNPs overstates the number of loci.",
      "Long-range LD regions, such as the MHC, behave unlike the rest of the genome and are usually handled separately.",
    ],
    read: "Report lead variants with their LD block and state that causal variants require fine-mapping and functional work. The effective-number-of-tests argument behind 5 × 10⁻⁸ rests directly on LD.",
    use: "Context for the GWAS annotation projects, and a limitation stated in each of them.",
    ref: "Lewontin (1964); International HapMap Consortium (2005).",
  },
  {
    id: "pgx-phen", cat: "gen", name: "Star alleles and phenotype assignment", short: "Pharmacogenomic phenotype",
    solves: "Translate genotype at a pharmacogene into a metaboliser phenotype that prescribing guidance can act on.",
    idea: "Variants are grouped into haplotypes — star alleles — each assigned a function (normal, decreased, no function, increased). A diplotype is the pair of alleles; for CYP2D6 each allele carries an activity value, the two are summed into an activity score, and the score maps to a phenotype band. CPIC publishes both the allele function tables and the score-to-phenotype mapping.",
    assumptions: [
      "The star alleles tested cover the functionally important variation in the population being tested — frequently untrue outside European-ancestry reference panels.",
      "Phase is known or inferred, since a diplotype requires knowing which variants sit on which chromosome.",
      "Activity scores are additive, which is a modelling convention rather than a measured property.",
    ],
    fails: [
      "Single-variant genotyping cannot detect gene deletions, duplications or hybrid genes. CYP2D6 in particular has copy-number variation that changes the activity score outright.",
      "An untested variant defaults to the reference allele, so a rare loss-of-function variant is silently called normal — and this bias falls hardest on under-represented populations.",
      "Phenotype is not response. Metaboliser status is one input alongside dose, interactions, adherence, renal and hepatic function.",
    ],
    read: "State the allele set tested, the guideline version, and that a phenotype assignment is a prediction from genotype rather than a measurement. Keep genomic annotation, allele function and clinical recommendation as three separate layers.",
    use: "The structure behind the pharmacogenomics explorer, which deliberately shows one allele at a time rather than implying a diplotype call.",
    ref: "CPIC guidelines; Caudle et al. (2020) on standardised terms.",
  },

  /* ---------------- Chemistry ---------------- */
  {
    id: "desc", cat: "chem", name: "Molecular descriptors and similarity", short: "Descriptors",
    solves: "Turn a molecular structure into numbers a model can use, and define what makes two molecules similar.",
    idea: "Descriptors range from simple counts (molecular weight, hydrogen-bond donors, rotatable bonds) through calculated properties (logP, topological polar surface area) to fingerprints — bit vectors encoding which substructures are present. Similarity between fingerprints is usually the Tanimoto coefficient: shared bits divided by total bits set in either.",
    assumptions: [
      "The similar property principle: structurally similar molecules tend to have similar activity. Broadly useful, routinely violated at activity cliffs.",
      "The fingerprint's substructure vocabulary captures what matters for the property of interest.",
      "Calculated logP is an estimate from a model, not a measurement.",
    ],
    fails: [
      "A small structural change can abolish activity — an activity cliff — which similarity-based reasoning cannot anticipate.",
      "Tanimoto values are not comparable across fingerprint types or lengths; 0.7 means different things with different encodings.",
      "Descriptors say nothing about conformation, tautomer or protonation state at physiological pH, all of which can govern binding.",
    ],
    read: "State the fingerprint type and parameters alongside any similarity value, and treat rule-based filters such as Lipinski and Veber as rough guides to oral bioavailability rather than predictions of activity.",
    use: "Implemented in the molecular explorer, which pulls descriptors from PubChem and checks them against both rule sets.",
    ref: "Lipinski et al. (1997); Veber et al. (2002); Rogers & Hahn (2010) on ECFP.",
  },
  {
    id: "dock", cat: "chem", name: "Molecular docking", short: "Docking",
    solves: "Predict how a small molecule might sit in a binding site, and rank candidates for follow-up.",
    idea: "Search over ligand poses — position, orientation and torsions — inside a defined site, scoring each with a function approximating the binding free energy from terms for steric fit, hydrogen bonding, hydrophobic contact and torsional strain. The search is a global optimisation; the score is an empirical approximation.",
    assumptions: [
      "The receptor is usually rigid, so induced fit is not modelled.",
      "Solvent is treated implicitly at best, though ordered water frequently mediates binding.",
      "Entropy is approximated crudely, because computing it properly is expensive.",
      "The binding site is known and correctly defined.",
    ],
    fails: [
      "Pose prediction is markedly more reliable than affinity prediction. Scoring functions correlate weakly with measured affinity, especially across chemically diverse compounds.",
      "Reporting a docking score in kcal/mol invites it to be read as a measurement. It is not one.",
      "Protonation and tautomeric state at physiological pH are decisions made during preparation, and they change the result.",
    ],
    read: "Report docking output as a structural hypothesis: a plausible pose and the interactions it would make. Redock a known ligand with a crystal structure to show the protocol can recover a correct pose before trusting it on anything new.",
    use: "Used in my dissertation and discussed at length in the method notes; central to the drug discovery proposal.",
    ref: "Trott & Olson (2010), AutoDock Vina; Warren et al. (2006) on scoring function performance.",
  },

  /* ---------------- Networks ---------------- */
  {
    id: "central", cat: "net", name: "Network centrality", short: "Centrality",
    solves: "Rank nodes in a biological network by structural importance.",
    idea: "Degree counts a node's connections. Betweenness counts shortest paths passing through it, identifying bottlenecks. Eigenvector centrality and PageRank weight a node by the importance of its neighbours, solving a fixed-point equation over the adjacency structure.",
    assumptions: [
      "The network is an adequate model of the biology, which demands that edges mean one consistent thing.",
      "Shortest paths are meaningful routes for biological influence — a strong assumption for a protein interaction graph.",
      "The network is reasonably complete.",
    ],
    fails: [
      "Study bias dominates. Well-researched proteins have more recorded interactions, so centrality partly measures literature attention rather than biology. TP53 is central in every network partly because everyone has studied it.",
      "Centrality depends entirely on the confidence threshold used to build the graph, and node rankings reorder as it moves.",
      "Aggregated databases mix physical complexes, co-expression and text-mined associations into one edge type, after which path length has no consistent meaning.",
    ],
    read: "State the source, the confidence threshold and the edge types included. Show how rankings change across thresholds, and treat high centrality as a hypothesis rather than evidence of functional importance.",
    use: "Demonstrated in the network explorer, where moving the confidence slider visibly reorders the hubs.",
    ref: "Freeman (1977); Barabási & Oltvai (2004); Gillis, Ballouz & Pavlidis (2014) on study bias.",
  },
];
