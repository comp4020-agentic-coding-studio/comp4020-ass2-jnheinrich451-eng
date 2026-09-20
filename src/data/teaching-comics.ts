export type Speaker = 'GPT' | 'Claude';
export interface TeachingComic {
  id: string;
  title: string;
  panels: {speaker: Speaker; line: string; prop: string}[];
  note?: string;
}

// Core teaching dialogue retained as accessible text alongside illustrated comics.
// The two supplied avatars alternate roles; neither is an infallible tutor.
export const teachingComics: TeachingComic[] = [
  {id:'L01',title:'A new draw. Not a new model.',panels:[
    {speaker:'GPT',line:'The score moved. Did my generator improve while I was making tea?',prop:'Candidate parameters: unchanged'},
    {speaker:'Claude',line:'You pressed Draw again. The samples changed; the population did not.',prop:'New samples → new empirical moments'},
    {speaker:'GPT',line:'So the tea gets no credit.',prop:'Population score: unchanged'},
  ],note:'The model parameters stay fixed while new samples change empirical moments. The illustration is not a measured experiment.'},
  {id:'L02',title:'The missing term',panels:[
    {speaker:'Claude',line:'The means are two apart. Squared distance: four. Done?',prop:'Mean term: (0 − 2)² = 4'},
    {speaker:'GPT',line:'The standard deviations are one apart too. That contributes another one.',prop:'SD term: (1 − 2)² = 1'},
    {speaker:'Claude',line:'Five. My calculation left the spread outside.',prop:'D = 4 + 1 = 5'},
  ],note:'This is the stated 1D Gaussian population example. The second term uses standard deviations, and D is the squared distance.'},
  {id:'L05',title:'Precisely over there',panels:[
    {speaker:'GPT',line:'More independent repeats! Our average is settling beautifully around seven.',prop:'Fixed N · estimator expectation = 7'},
    {speaker:'Claude',line:'Beautifully. The population value is five.',prop:'Population value = 5 · bias = 2'},
    {speaker:'GPT',line:'A very tidy cluster in the wrong place.',prop:'Less variation ≠ less bias'},
  ],note:'At the same N, averaging independent estimates reduces the variance of the average, not its bias. Individual averages need not improve monotonically.'},
  {id:'L08',title:'The vanishing shift',panels:[
    {speaker:'Claude',line:'I added ten to every frame. Surely the instrument will notice.',prop:'yₜ = xₜ + 10'},
    {speaker:'GPT',line:'This one keeps only consecutive differences. Your two tens cancel.',prop:'(xₜ₊₁ + 10) − (xₜ + 10) = xₜ₊₁ − xₜ'},
    {speaker:'Claude',line:'Ten arrived twice and left no forwarding address.',prop:'Identical difference features'},
  ],note:'An exact property of this toy feature map, not a claim about actual FVD. Independent reference and candidate draws can still give different sample estimates.'},
  {id:'L11',title:'Twelve is a count',panels:[
    {speaker:'GPT',line:'Twelve out of twelve repeats agreed. May I write “certain”?',prop:'Observed support: 12/12'},
    {speaker:'Claude',line:'Write “twelve out of twelve”, with the protocol. The thirteenth has not happened.',prop:'Instrument · N · seed · repetitions'},
    {speaker:'GPT',line:'The conclusion gets a seatbelt, not a crown.',prop:'Evidence with conditions'},
  ],note:'The panel’s heuristic is not a calibrated significance test. Agreement in these repeats does not guarantee future agreement or agreement between instruments.'},
  {id:'S01',title:'The bold number',panels:[
    {speaker:'Claude',line:'This row has the lower FID. I have already made it bold.',prop:'4.8 versus 5.2'},
    {speaker:'GPT',line:'Same reference set, N, features, preprocessing and implementation?',prop:'Protocol: not yet checked'},
    {speaker:'Claude',line:'The bold font is ready. The comparison is not.',prop:'Check conditions before celebrating'},
  ],note:'The scores are illustrative. Compatible conditions do not remove estimator bias or uncertainty, or establish overall model superiority.'},
  {id:'S02',title:'Perfectly ordinary, separately',panels:[
    {speaker:'GPT',line:'Both coordinate curves match. The distributions must match too.',prop:'Each marginal: Normal(0, 1)'},
    {speaker:'Claude',line:'Look at them together. One pair of coordinates is correlated.',prop:'R: I · G: [[1, 0.8], [0.8, 1]]'},
    {speaker:'GPT',line:'I interviewed each coordinate separately and missed the relationship.',prop:'Zero marginal distances · positive joint distance'},
  ],note:'These are zero-mean 2D Gaussian population distributions. The joint covariance term retains information that separate coordinate curves omit.'},
  {id:'S03',title:'More digits, same blind spot',panels:[
    {speaker:'Claude',line:'The images changed, but their feature vectors are identical. Try more precision?',prop:'Same feature vectors by assumption'},
    {speaker:'GPT',line:'More precise arithmetic cannot reconstruct information the encoder discarded.',prop:'Same moments → same Gaussian formula'},
    {speaker:'Claude',line:'Eight extra decimal places. Zero extra eyesight.',prop:'Audit the representation'},
  ],note:'This is a hypothetical exact feature match, not a claim that every visual alteration is invisible to Inception.'},
  {id:'S04',title:'Choose your favourite number?',panels:[
    {speaker:'GPT',line:'Two libraries, two scores. Conveniently, I prefer the smaller one.',prop:'Same images · different pipelines'},
    {speaker:'Claude',line:'Compare resizing, weights and numerical methods. Preference is not a diagnostic.',prop:'Change one condition at a time'},
    {speaker:'GPT',line:'Fine. I will pin the implementation, not the favourable result.',prop:'Document the chosen protocol'},
  ],note:'Library scores are illustrative. Change one condition at a time; documenting an implementation supports reproducibility but does not alone establish correctness.'},
  {id:'S05',title:'Same N, different baggage',panels:[
    {speaker:'Claude',line:'Same N and protocol for both candidates. Their biases cancel now, right?',prop:'N-honest comparison'},
    {speaker:'GPT',line:'Not necessarily. The finite-sample bias can depend on the generator.',prop:'Bias(A) need not equal bias(B)'},
    {speaker:'Claude',line:'Equal-sized suitcases. Different contents.',prop:'A stable ranking can still be reversed'},
  ],note:'A reversal is possible, not inevitable. Repeating the fixed-N procedure more precisely does not force its expected ordering to equal the population ordering.'},
  {id:'S06',title:'A suspiciously perfect score',panels:[
    {speaker:'GPT',line:'Zero empirical FID. My candidate must be wonderfully original.',prop:'Reported distance: 0'},
    {speaker:'Claude',line:'You copied every evaluated reference feature, with the same multiplicities.',prop:'Identical empirical means and covariances'},
    {speaker:'GPT',line:'The score checked the statistics. It did not check my alibi.',prop:'Zero does not certify originality'},
  ],note:'Exact arithmetic and the same moment estimators are assumed. Roundoff may leave a residual. A new independent draw or arbitrary subset does not guarantee zero.'},
  {id:'S07',title:'Unbiased, not all-seeing',panels:[
    {speaker:'Claude',line:'An unbiased KID estimator! Surely candidate C has nowhere to hide.',prop:'C matches R through degree three'},
    {speaker:'GPT',line:'This kernel is cubic. C differs at degree four.',prop:'Population discrepancy for this kernel: 0'},
    {speaker:'Claude',line:'A perfectly honest answer to a question that never asked about four.',prop:'Estimator quality ≠ complete sensitivity'},
  ],note:'Unbiasedness concerns expectation; finite-sample estimates fluctuate. This blind spot is for the stated cubic polynomial kernel and moment-matching construction.'},
  {id:'S08',title:'Wrong instrument on the witness stand',panels:[
    {speaker:'GPT',line:'My pooled-frame score ignores shuffling. Case closed: FVD ignores time.',prop:'Experiment: pooled frame values'},
    {speaker:'Claude',line:'That witness is not I3D. Test the temporal change through the actual FVD pipeline.',prop:'Different features · untested sensitivity'},
    {speaker:'GPT',line:'Case reopened. Correct instrument summoned.',prop:'A toy invariance is not a universal verdict'},
  ],note:'Only the pooled-frame toy was tested. Actual FVD sensitivity remains untested here; temporal features do not guarantee sensitivity to every temporal change.'},
  {id:'S09',title:'The smaller gap has a bigger bill',panels:[
    {speaker:'Claude',line:'Let us detect half the human-error-rate gap. Half the work?',prop:'0.5 → 0.25 percentage points'},
    {speaker:'GPT',line:'Under the inverse-square approximation, it takes four times the judgements.',prop:'(0.5 / 0.25)² = 4'},
    {speaker:'Claude',line:'The gap shrank. The invoice did not.',prop:'About 4× the evaluator cost'},
  ],note:'Hold the other approximation terms, time per judgement and pay fixed. The live calculator updates variance terms and rounds counts, so its factor need not be exactly four. These are human-rating costs, not student fees.'},
  {id:'S10',title:'Two uncertain rankings walk into a plot',panels:[
    {speaker:'GPT',line:'The metric disagrees with the human ranking. The encoder is guilty.',prop:'Observed rank disagreement'},
    {speaker:'Claude',line:'How uncertain is the metric ranking? And how many human trials bought the other one?',prop:'Sampling on both sides'},
    {speaker:'GPT',line:'I brought one suspect and forgot two error bars.',prop:'Specify both measurement protocols'},
  ],note:'An N-honest comparison improves interpretability but does not itself remove generator-dependent bias or make a measured human ranking exact.'},
  {id:'S11',title:'Why the row stays',panels:[
    {speaker:'Claude',line:'We found limitations. Shall we delete every FID column?',prop:'Known blind spots'},
    {speaker:'GPT',line:'Readers still need compatible baselines. Keep the comparison, disclose what it cannot support.',prop:'Shared record · compatible protocols'},
    {speaker:'Claude',line:'Useful reference. Not royal decree.',prop:'Adoption is not a validity proof'},
  ],note:'The table contains placeholders, not measured scores. Compatible baselines do not remove finite-sample bias or certify overall quality.'},
  {id:'S12',title:'The replacement takes the same exam',panels:[
    {speaker:'GPT',line:'My replacement is unbiased. I would like to skip the awkward questions.',prop:'A new metric proposal'},
    {speaker:'Claude',line:'Blind spots? Human agreement? N-honest evidence? Cost of comparison?',prop:'The same standard applies'},
    {speaker:'GPT',line:'New name badge. Same evidence queue.',prop:'Report what was checked and what is missing'},
  ],note:'Compare evidence and supported conclusions, not raw magnitudes from differently scaled metrics. The optional comic is not an additional assessment.'},
];
