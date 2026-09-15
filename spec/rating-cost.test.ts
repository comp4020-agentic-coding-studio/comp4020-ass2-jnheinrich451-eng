// The week 9 rating-cost calculator, against Python.
//
// Week 9's argument is a price: human evaluation lost to the score because
// separating two candidates costs hundreds of thousands of trials. The
// session states that price in prose and the calculator lets a reader move
// it, so both are held here to the same arithmetic.
//
// figures/rating-cost-reference.py evaluates the two-proportion sample size
// with Python's inverse normal, and simulates the experiment it sizes to
// check the formula delivers its stated power. This suite holds the browser's
// constants and formula to that, and holds the session's own sentences to the
// calculator on the same page, which is the check that would have caught its
// dollar figure drifting from its own arithmetic.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { Z, costOf, smallestDetectable, trialsPerCandidate } from "../src/lib/rating-cost";

type Level = 0.05 | 0.01;
type Power = 0.8 | 0.9;

const reference = JSON.parse(
  readFileSync(resolve("spec/rating-cost-reference.json"), "utf8"),
) as {
  constants: { alpha: Record<string, number>; power: Record<string, number> };
  grid: Array<{ rate: number; difference: number; alpha: Level; power: Power; perCandidate: number }>;
  workedExample: {
    rate: number;
    difference: number;
    alpha: Level;
    power: Power;
    secondsPerTrial: number;
    dollarsPerHour: number;
    perCandidate: number;
    total: number;
    hours: number;
    dollars: number;
  };
  simulated: Array<{ difference: number; n: number; achieved: number; nominal: number }>;
};

const body = readFileSync(resolve("src/content/sessions/09-human-evaluation.md"), "utf8")
  .split(/^---$/m)
  .slice(2)
  .join("---");

describe("the rating-cost calculator agrees with Python", () => {
  it("uses Python's inverse normal constants", () => {
    for (const [alpha, value] of Object.entries(reference.constants.alpha)) {
      expect(Math.abs(Z.alpha[alpha as `${Level}`] - value), `alpha ${alpha}`).toBeLessThan(1e-12);
    }
    for (const [power, value] of Object.entries(reference.constants.power)) {
      expect(Math.abs(Z.power[power as `${Power}`] - value), `power ${power}`).toBeLessThan(1e-12);
    }
  });

  it("matches every grid point to a part in a billion", () => {
    for (const point of reference.grid) {
      const mine = trialsPerCandidate(point);
      expect(
        Math.abs(mine - point.perCandidate) / point.perCandidate,
        `rate ${point.rate}, difference ${point.difference}, alpha ${point.alpha}, power ${point.power}`,
      ).toBeLessThan(1e-9);
    }
  });

  it("sizes an experiment that delivers the power it promises", () => {
    // The formula is a normal approximation. Simulating the forced-choice
    // experiment at the computed size is the check that it is the right
    // approximation for this test, not merely a consistent one.
    for (const run of reference.simulated) {
      expect(Math.abs(run.achieved - run.nominal), `difference ${run.difference}`).toBeLessThan(0.02);
    }
  });

  // "Quadruples" is the session's word, and it is true where the session uses
  // it. It is not true everywhere: the pooled rate moves with the difference,
  // so at large differences and low error rates halving multiplies the trials
  // by as little as 3.5. The first version of this test asserted 3.9 to 4.1
  // across the whole grid and failed at 3.84, which is why the calculator now
  // reports the factor it measured on every press instead of asserting one.
  const halving = (point: { rate: number; difference: number; alpha: Level; power: Power }) =>
    trialsPerCandidate({ ...point, difference: point.difference / 2 }) / trialsPerCandidate(point);

  it("quadruples the trials at the session's worked example", () => {
    const factor = halving(reference.workedExample);
    expect(factor).toBeGreaterThan(3.95);
    expect(factor).toBeLessThan(4.05);
  });

  it("stays near four for differences of a point or less", () => {
    for (const point of reference.grid.filter((p) => p.difference >= 0.005 && p.difference <= 0.01)) {
      const factor = halving(point);
      expect(factor, `rate ${point.rate}, difference ${point.difference}`).toBeGreaterThan(3.9);
      expect(factor).toBeLessThan(4.05);
    }
  });

  it("drifts from four at large differences, so the page reports the factor", () => {
    const factors = reference.grid.filter((p) => p.difference >= 0.005).map(halving);
    expect(Math.min(...factors)).toBeLessThan(3.8);
  });

  it("inverts: a budget buys back the difference that set it", () => {
    for (const point of reference.grid) {
      const budget = trialsPerCandidate(point);
      const recovered = smallestDetectable(budget, point.rate, point.alpha, point.power);
      expect(Math.abs(recovered - point.difference), `difference ${point.difference}`).toBeLessThan(1e-7);
    }
  });

  it("costs the worked example in hours and dollars", () => {
    const worked = reference.workedExample;
    const costing = costOf(worked, worked);
    expect(costing.total).toBe(worked.total);
    expect(Math.abs(costing.hours - worked.hours)).toBeLessThan(1e-9);
    expect(Math.abs(costing.dollars - worked.dollars)).toBeLessThan(1e-6);
  });
});

describe("the week 9 session agrees with its own calculator", () => {
  // The prose rounds; the calculator does not. Each sentence is held to the
  // calculator at the rounding the sentence itself uses.
  const worked = reference.workedExample;
  const costing = costOf(worked, worked);
  const roundTo = (value: number, step: number) => Math.round(value / step) * step;
  const figure = (value: number) => value.toLocaleString("en-US");

  it("states the trials per candidate", () => {
    expect(body).toContain(`roughly ${figure(roundTo(costing.perCandidate, 10_000))} trials each`);
  });

  it("states the total", () => {
    expect(body).toContain(`about ${figure(roundTo(costing.total, 10_000))} in total`);
  });

  it("states the hours", () => {
    expect(body).toContain(`around ${figure(roundTo(costing.hours, 10))} hours`);
  });

  it("states the dollars", () => {
    expect(body).toContain(`about ${figure(roundTo(costing.dollars, 100))} dollars`);
  });
});
