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

const LETTER = {shift:'E', shuffle:'F'} as const;
const capitalise = (text:string) => text.charAt(0).toUpperCase() + text.slice(1);

/** One instrument's majority call across the repeats: a candidate, no ordering, or a tie. */
function majority(calls:Verdict[]):Verdict|'tie' {
  const c=tallyVerdicts(calls);
  const top=Math.max(c.shift,c.shuffle,c.neither);
  const leaders=(['shift','shuffle','neither'] as const).filter(k=>c[k]===top);
  return leaders.length===1 ? leaders[0] : 'tie';
}

function describe(calls:Verdict[]):string {
  const c=tallyVerdicts(calls);
  const m=majority(calls);
  return m==='shift' || m==='shuffle' ? `scored ${LETTER[m]} higher in ${c[m]} of ${calls.length}`
    : m==='neither' ? `gave no ordering in ${c.neither} of ${calls.length}`
    : `split its repeats with no majority`;
}

/**
 * The page's experiment summary, in words a reader need not decode: the
 * instrument by name, the counts against the claim, what they amount to, and
 * whether another instrument read the same recordings the other way. The
 * repeats show consistency under a demonstration heuristic, not certainty.
 */
export function claimVerdict(claim:'shift'|'shuffle', lens:Lens, verdicts:Record<Lens,Verdict[]>):string {
  const calls=verdicts[lens];
  const c=tallyVerdicts(calls);
  const opposite=claim==='shift'?'shuffle':'shift';
  const total=calls.length;
  const counts=`You claimed ${LETTER[claim]} scores higher. Under ${LENS_NAME[lens]}, ${c[claim]} of ${total} repeats agreed; ${c[opposite]} scored ${LETTER[opposite]} higher; ${c.neither} gave no ordering.`;
  const verdict = c.neither===total ? 'This instrument gives no evidence either way.'
    : c[claim]>c[opposite] ? 'Under this instrument the evidence supports your claim.'
    : c[claim]<c[opposite] ? 'Under this instrument the evidence contradicts your claim.'
    : 'Under this instrument the evidence is split, with no majority.';
  const lenses=['frame','temporal','joint'] as Lens[];
  const mine=majority(calls);
  const differing=lenses.filter(other=>other!==lens && majority(verdicts[other])!==mine);
  const supporting=lenses.filter(other=>majority(verdicts[other])===claim).length;
  const listed=differing.map(other=>`${capitalise(LENS_NAME[other])} ${describe(verdicts[other])}.`).join(' ');
  // The closing sentence follows from how many instruments back the claim,
  // so it can never say a claim holds somewhere when it holds nowhere.
  const closing = supporting===lenses.length ? 'All three instruments support the claim under this protocol.'
    : supporting===0 ? 'No instrument supports the claim under this protocol.'
    : 'The claim holds under some instruments and not others, so a report must name the one it used.';
  const others = differing.length===0 ? `The other two instruments read these recordings the same way. ${closing}` : `${listed} ${closing}`;
  return `${counts} ${verdict} ${others}`;
}
