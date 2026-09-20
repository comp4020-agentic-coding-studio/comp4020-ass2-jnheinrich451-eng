import questions from '../data/self-checks.json';

interface Common {
  id: string;
  title: string;
  route: string;
  code: string;
  question: string;
  explanation: string[];
  feedback: Partial<Record<string, string>>;
}
export type SelfCheck = Common & (
  {kind: 'choice'; options: {value: string; label: string}[]; answer: string} |
  {kind: 'number'; answer: number; tolerance: number; hint: string; fallback: string}
);
export const selfChecks = questions as SelfCheck[];
export const selfCheckFor = (route: string) => selfChecks.find(q => q.route === route);
export const unlockKey = (id: string) => `slop8412:self-check:v1:${id}`;

export function checkAnswer(question: SelfCheck, raw: string): {state: 'empty' | 'invalid' | 'correct' | 'incorrect'; message: string} {
  const input = raw.trim();
  if (!input) return {state: 'empty', message: question.kind === 'choice' ? 'Choose an answer first, or open the explanation below.' : 'Enter a number first, or open the explanation below.'};
  if (question.kind === 'choice') {
    if (!question.options.some(o => o.value === input)) return {state: 'invalid', message: 'Choose one of the listed options.'};
    return input === question.answer
      ? {state: 'correct', message: 'Correct. Your collection code is available below. Open the explanation for the reasoning.'}
      : {state: 'incorrect', message: `${question.feedback[input]} You can try again or review the explanation.`};
  }
  // Full-string decimal grammar: never coerce an empty string or evaluate code.
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(input) || !Number.isFinite(Number(input))) {
    return {state: 'invalid', message: 'Use one finite number, such as 4, 4.0 or 4e0, without units or a calculation.'};
  }
  const value = Number(input);
  const allowance = Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(question.answer)) * 4;
  if (Math.abs(value - question.answer) <= question.tolerance + allowance) {
    return {state: 'correct', message: 'Correct within the stated tolerance. Your collection code is available below.'};
  }
  return {state: 'incorrect', message: `${question.feedback[String(value)] ?? question.fallback} You can try again or review the explanation.`};
}
