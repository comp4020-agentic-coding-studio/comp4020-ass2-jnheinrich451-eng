import type {Lens, RecordingParams, Verdict} from './bench';

export const LENS_NAME: Record<Lens,string> = {
  frame:'frame marginals', temporal:'frame-to-frame differences', joint:'whole-sequence scoring',
};
export const HEURISTIC_NOTE = 'Demonstration heuristic v1: threshold = 1.6 × max(b1, b2) + 4 × |b1 − b2| + 0.001, using two independent R-against-R baseline draws per run. Below this threshold means not flagged by this rule, not statistically indistinguishable or proven invisible.';
export const tallyVerdicts = (calls: Verdict[]) => ({
  shift:calls.filter(c=>c==='shift').length,
  shuffle:calls.filter(c=>c==='shuffle').length,
  neither:calls.filter(c=>c==='neither').length,
});
export function verdictSummary(lens:Lens, calls:Verdict[]):string {
  const count=tallyVerdicts(calls);
  return `${LENS_NAME[lens]}: E ranked higher in ${count.shift}/${calls.length} runs; F in ${count.shuffle}/${calls.length}; no ordering under the heuristic in ${count.neither}/${calls.length}.`;
}
export function reportOutcome(claim:'shift'|'shuffle', calls:Verdict[]):string {
  const counts=tallyVerdicts(calls);
  const opposite=claim==='shift'?'shuffle':'shift';
  return counts.neither===calls.length
    ? 'The heuristic gave no ordering in any repeat.'
    : counts[claim]>counts[opposite]
      ? `More repeats supported the claim that ${claim==='shift'?'E':'F'} scores higher than contradicted it.`
      : counts[claim]<counts[opposite]
        ? 'More repeats contradicted the claim than supported it.'
        : 'Supporting and contradicting counts tied; there is no majority verdict.';
}
export function reportSentence(params:RecordingParams, lens:Lens, claim:'shift'|'shuffle', verdicts:Record<Lens,Verdict[]>):string {
  const calls=verdicts[lens];
  const outcome=reportOutcome(claim,calls);
  return `Protocol: synthetic AR(1) recordings; N = ${params.n} independent sequences per set; d = ${params.d} frames; rho = ${params.rho}; E shift = ${params.shift}; F permutes each sequence; base seed = ${params.seed}; ${calls.length} repeats. `+
    `Engine: bench.ts / splitmix32 / sample covariance (feature-row count minus 1 denominator); repeat seed = (base seed + 104729 × (repeat index + 1)) modulo 2^32. `+
    `${verdictSummary(lens,calls)} ${outcome} `+
    (['frame','temporal','joint'] as Lens[]).filter(other=>other!==lens).map(other=>verdictSummary(other,verdicts[other])).join(' ')+
    ` ${HEURISTIC_NOTE} These finite repeats do not establish certainty or instrument-independent quality.`;
}
