/** Supporting activities, not replacements for the authored session or assessment. */
export interface WorkspaceActivity {
  title: string;
  predict: string;
  lab: {href: string; label: string};
  open: string;
  record: string;
  result: string;
  limitation: string;
}

const covariance: WorkspaceActivity = {
  title: 'The marginals can agree while the joint distance changes.',
  predict: 'Keep both coordinate means and variances fixed. Will changing correlation move the full squared distance, either marginal distance, or both?',
  lab: {href: '/math-lab/#correlation', label: 'Maths lab / 2D correlation'},
  open: 'Match the reference first, then compare positive and negative correlation.',
  record: 'Write down both population mean vectors and covariance matrices before each comparison. No sample size or seed is involved.',
  result: 'Keep the full squared distance beside both marginal distances. Compare each observation with your prediction.',
  limitation: 'This is a two-dimensional Gaussian population calculation, not sampled image-based FID. It illustrates Week 2’s covariance term; it does not replace the shared-bench derivation.',
};

const instrument: WorkspaceActivity = {
  title: 'A fixed instrument can respond to altered pixels.',
  predict: 'Will JPEG compression move the score even though the photograph depicts the same subject?',
  lab: {href: '/image-lab/', label: 'Image lab / pixels to features'},
  open: 'Measure the supplied identity control, then the JPEG-compressed candidate with the same reference crops.',
  record: 'Keep the reference and candidate counts, encoder identity, preprocessing and selected candidate mode with each run. Export the measurement record if you need to retain it.',
  result: 'Compare the mean and covariance contributions for identity and compression. State which changed, without assuming that all changes have the same cause.',
  limitation: 'The supplied eight crops overlap and come from one photograph. This is not a model-quality benchmark or the session’s second-feature-extractor experiment: the encoder stays fixed.',
};

const processing: WorkspaceActivity = {
  ...instrument,
  title: 'The processing belongs beside the score.',
  predict: 'Starting from identical pixels, what do you expect compression to change in the measured features and score?',
  open: 'Compare the supplied identity and JPEG modes. For a separate trial, choose 2–8 local images and change only one candidate crop or filter setting.',
  result: 'Put the before-and-after scores beside the precise pixel intervention. Explain what the comparison isolates and what it leaves coupled.',
  limitation: 'Tiny image sets cannot establish generator quality. This lab does not compare resize filters or public FID implementations; return to Week 4’s exercise for those checks.',
};

const sampling: WorkspaceActivity = {
  title: 'More repetitions need not remove estimator bias.',
  predict: 'If the distributions stay fixed, what should change when you change the seed, then increase repetitions? Distinguish variation from a persistent gap.',
  lab: {href: '/workspace/', label: 'Python workspace / sample-size experiment'},
  open: 'Run all starter cells. Change only the seed, run all again, then increase repetitions in a separate run.',
  record: 'Save the source cells and record seed, sample sizes, repetitions, moment estimator and reference-drawing protocol. Keep the population values as the baseline.',
  result: 'Copy the mean estimates and their discrepancies from the population values into a small comparison table. Check your prediction across runs rather than selecting one favourable seed.',
  limitation: 'The starter uses local one-dimensional Gaussians, not the course’s 2,048-dimensional A and B. It does not compute FID∞; neither a ranking reversal nor an exact bias correction is guaranteed.',
};

const copying: WorkspaceActivity = {
  title: 'A perfect score cannot certify originality.',
  predict: 'If the candidate copies the evaluated reference collection, what happens to empirical FID? What will shuffling that collection do to FID and the paired distance?',
  lab: {href: '/image-lab/', label: 'Image lab / identity and shuffle'},
  open: 'Use the supplied identity control and measure once. Shuffle candidate order, then restore it. No new feature extraction is needed for the shuffle.',
  record: 'Export the counts, identity mode, feature vectors and candidate ordering before and after shuffling. Keep a note of the source images; the export does not contain the original images.',
  result: 'Compare empirical FID with the separately labelled mean paired squared feature distance. Identify which quantity depends on displayed pairing.',
  limitation: 'Exact copying matches empirical moments; independent samples or an arbitrary subsample need not. A near-zero numerical score does not certify originality. Shuffling alone is not an A2 counterexample, and this is not the mixture C population construction.',
};

const order: WorkspaceActivity = {
  ...copying,
  title: 'Collection order and temporal order are different questions.',
  predict: 'Will reordering candidate images change collection FID, the paired feature distance, or both? Which prediction would require a temporal feature extractor instead?',
  open: 'Measure the supplied JPEG comparison, then shuffle and restore candidate order without changing any pixels.',
  record: 'Export the original and shuffled ordering with the same feature vectors, counts and preprocessing.',
  result: 'Compare both displayed quantities before and after shuffling. Bring that distinction back to the lecture’s pooled-frame and sequence instruments.',
  limitation: 'This lab compares unordered image collections, not videos. Image-order invariance does not establish that FVD ignores frame order; temporal sensitivity must be tested with the actual video features.',
};

const reporting: WorkspaceActivity = {
  ...processing,
  title: 'An exported number still needs an argument.',
  predict: 'Name one controlled pixel change and write what you expect it to do to the score. State what result would contradict your account.',
  open: 'Run an identity control and one altered candidate in Image lab, then export both measurement records.',
  record: 'Keep the counts, encoder identity, preprocessing, candidate order and intervention with both records. Separate measured settings from assumptions.',
  result: 'Draft two sentences: what the comparison showed, and whether it agreed with the prediction. Use the lecture’s reporting questions to defend those sentences.',
  limitation: 'An export is evidence, not a generated report or proof of human preference. These tiny image sets do not replace the final report’s shared-bench evaluation against FID and FID∞.',
};

export const workspaceActivities: Record<string, WorkspaceActivity> = {
  'sessions/02-frechet-distance': covariance,
  'sessions/03-the-instrument': instrument,
  'sessions/04-getting-it-right': processing,
  'sessions/05-the-bias': sampling,
  'sessions/06-blind-spots': copying,
  'lectures/week-02': covariance,
  'lectures/week-05': sampling,
  'lectures/week-08': order,
  'lectures/week-11': reporting,
  'assessments/measurement-log': {
    ...sampling,
    title: 'Practise the prediction before writing the log.',
    limitation: 'Label this as supplementary one-dimensional practice. It does not replace the twelve weekly entries or their required bench measurements and FID∞ comparisons. Record FID∞ as not computed for this starter, not as zero or as its population distance.',
  },
  'assessments/a1-reproduce-the-number': {
    ...processing,
    title: 'Rehearse the comparison before reproducing a paper.',
    limitation: 'This is preparation, not a reproduction of a published result. A1 still requires the cited paper, an account of setup differences and the rerunnable archive specified in the brief.',
  },
  'assessments/a2-break-the-number': copying,
  'assessments/final-report': reporting,
};
