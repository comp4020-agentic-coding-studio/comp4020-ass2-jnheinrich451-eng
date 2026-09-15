/**
 * Week 9's arithmetic: what it costs to separate two candidates by people.
 *
 * A forced-choice study ranks candidates by human error rate, so separating
 * two of them is a two-proportion comparison, and its sample size is the
 * standard pooled-test formula. The week's argument is that this number is
 * large, and grows as the square of the precision asked for: halve the
 * difference and every trial, hour and dollar quadruples.
 *
 * The four inverse normal constants are Python's, copied at full precision
 * and pinned by spec/rating-cost.test.ts, so the browser needs no inverse
 * normal of its own. The reader chooses among the conventional settings a
 * paper would use, which is also the honest scope of a closed-form calculator.
 * figures/rating-cost-reference.py simulates the experiment at the sizes this
 * returns and records that it delivers its stated power.
 */

export const Z = {
  alpha: { "0.05": 1.9599639845400536, "0.01": 2.5758293035489 },
  power: { "0.8": 0.8416212335729144, "0.9": 1.2815515655446008 },
} as const;

export interface Design {
  /** Human error rate of the first candidate, as a proportion. */
  rate: number;
  /** Difference in error rate to detect, as a proportion. */
  difference: number;
  alpha: 0.05 | 0.01;
  power: 0.8 | 0.9;
}

export interface Costing {
  secondsPerTrial: number;
  dollarsPerHour: number;
}

/** Trials each candidate needs, before rounding up. */
export function trialsPerCandidate({ rate, difference, alpha, power }: Design): number {
  const p1 = rate;
  const p2 = rate + difference;
  const pbar = (p1 + p2) / 2;
  const za = Z.alpha[String(alpha) as keyof typeof Z.alpha];
  const zb = Z.power[String(power) as keyof typeof Z.power];
  const numerator = za * Math.sqrt(2 * pbar * (1 - pbar)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return numerator ** 2 / difference ** 2;
}

/** The bill: whole trials for each candidate, and what they cost to run. */
export function costOf(design: Design, { secondsPerTrial, dollarsPerHour }: Costing) {
  const perCandidate = Math.ceil(trialsPerCandidate(design));
  const total = 2 * perCandidate;
  const hours = (total * secondsPerTrial) / 3600;
  return { perCandidate, total, hours, dollars: hours * dollarsPerHour };
}

/**
 * The inverse: the smallest difference a budget of trials per candidate can
 * separate at these settings. Bisection on a log scale, because the trials a
 * difference needs fall monotonically as the difference grows.
 */
export function smallestDetectable(
  budgetPerCandidate: number,
  rate: number,
  alpha: Design["alpha"],
  power: Design["power"],
): number {
  let lo = Math.log(1e-6);
  let hi = Math.log(Math.max(1e-6, 0.999 - rate));
  const need = (logD: number) => trialsPerCandidate({ rate, difference: Math.exp(logD), alpha, power });
  if (need(hi) > budgetPerCandidate) return Math.exp(hi);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (need(mid) > budgetPerCandidate) lo = mid;
    else hi = mid;
  }
  return Math.exp(hi);
}
