/**
 * Week 10's arithmetic: what a correlation study can see.
 *
 * A correlation study puts a metric's ranking beside a ranking people gave and
 * reports how well they agree. Both rankings are measurements. The metric's
 * carries week 5's bias, which falls like 1/N with a slope that differs per
 * model, and the human one comes from a finite number of forced choices, which
 * is what week 9 costs. So the agreement a study reports depends on three
 * budgets: how many models it covers, how many trials it paid for, and what N
 * the metric scores were computed at.
 *
 * Here the true ranking is known, which is the one thing a real study never
 * has, so the page can show the difference between what the metric knows and
 * what the study can see. Pinned to numpy in spec/week10.test.ts
 * (figures/week10-reference.py).
 *
 * The measured error rate is drawn from the normal approximation to the
 * binomial rather than a binomial. Every setting the page offers has trials
 * times rate above 100, where that holds; the fixture records the smallest,
 * and the agreement tests are what prove it.
 */

import { gaussian, rng } from "./bench";

export interface StudyParams {
  /** How many models the study covers. */
  models: number;
  /** Forced choices per model, as week 9 costs them. */
  trials: number;
  /** Sample size the metric scores were computed at. */
  n: number;
  /** Range of true quality across the models; lower is better. */
  spread: number;
  slopeLo: number;
  slopeHi: number;
  /** Human error rate for the best model, and how fast it falls with quality. */
  p0: number;
  k: number;
  /** Measurement noise on the metric. */
  sigma: number;
}

export interface StudyRow {
  quality: number;
  metric: number;
  human: number;
}

export interface StudyResult {
  rows: StudyRow[];
  /** Kendall's tau between the metric's ranking and the human ranking. */
  metricHuman: number;
  /** ...and between each ranking and the quality that generated both. */
  metricTruth: number;
  humanTruth: number;
}

/** Kendall's tau-a: concordant minus discordant pairs, over all pairs. */
export function kendall(a: number[], b: number[]): number {
  let concordant = 0;
  let discordant = 0;
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = i + 1; j < a.length; j++) {
      const s = Math.sign(a[i] - a[j]) * Math.sign(b[i] - b[j]);
      if (s > 0) concordant++;
      else if (s < 0) discordant++;
    }
  }
  return (concordant - discordant) / ((a.length * (a.length - 1)) / 2);
}

/** One study: score every model, rank it by people, and compare the rankings. */
export function simulateStudy(params: StudyParams, seed: number): StudyResult {
  const { models, trials, n, spread, slopeLo, slopeHi, p0, k, sigma } = params;
  const normal = gaussian(rng(seed));
  const uniform = rng((seed ^ 0x2f6b1c07) >>> 0);
  const rows: StudyRow[] = [];
  for (let i = 0; i < models; i++) {
    const quality = models === 1 ? 0 : (spread * i) / (models - 1);
    const slope = slopeLo + (slopeHi - slopeLo) * uniform();
    const rate = p0 - k * quality;
    rows.push({
      quality,
      metric: quality + slope / n + sigma * normal(),
      human: rate + Math.sqrt((rate * (1 - rate)) / trials) * normal(),
    });
  }
  // Every list is ranked so that "better" points the same way: a lower metric,
  // a higher human error rate, a lower true quality.
  const metric = rows.map((row) => row.metric);
  const human = rows.map((row) => -row.human);
  const quality = rows.map((row) => row.quality);
  return {
    rows,
    metricHuman: kendall(metric, human),
    metricTruth: kendall(metric, quality),
    humanTruth: kendall(human, quality),
  };
}
