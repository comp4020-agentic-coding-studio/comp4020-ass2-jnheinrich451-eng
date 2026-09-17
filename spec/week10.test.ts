// Week 10's instrument, against numpy: what a correlation study can see.
//
// The week reports that no metric correlated strongly with human judgement,
// and then asks what those studies rarely say: at what N were the metric
// scores computed, and how many human trials paid for the ranking they were
// compared against. The instrument answers by simulating studies whose true
// ranking is known, which is the one thing a real correlation study never has.
//
// figures/week10-reference.py measures the same grid the page offers, over 400
// studies per setting. This suite holds the browser engine to those means, and
// holds the two claims the page makes: that the verdict changes with the
// budget alone, and that at a small budget the metric tracks the truth better
// than the study is able to see.
//
// The browser draws each measured error rate from a normal approximation to
// the binomial rather than a binomial; the fixture records that the smallest
// offered setting has trials x rate well above 100, where that approximation
// holds, and the agreement tests below are what prove it in practice.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { kendall, simulateStudy, type StudyParams } from "../src/lib/ranking";

interface Stat {
  mean: number;
  sd: number;
  p5: number;
  p95: number;
}

const reference = JSON.parse(readFileSync(resolve("spec/week10-reference.json"), "utf8")) as {
  studies: number;
  params: Omit<StudyParams, "models" | "trials" | "n">;
  grid: { models: number[]; trials: number[]; sizes: number[] };
  configs: Array<{
    models: number;
    trials: number;
    n: number;
    metricHuman: Stat;
    metricTruth: Stat;
    humanTruth: Stat;
  }>;
  verdictFlips: boolean;
  tracksBetterThanSeen: boolean;
  smallestTrialsTimesRate: number;
};

const RUNS = 200;
const at = (models: number, trials: number, n: number) =>
  reference.configs.find((c) => c.models === models && c.trials === trials && c.n === n)!;

/** Mean of each tau over RUNS simulated studies. */
function measure(models: number, trials: number, n: number, seed: number) {
  const params: StudyParams = { ...reference.params, models, trials, n };
  const totals = { metricHuman: 0, metricTruth: 0, humanTruth: 0 };
  for (let i = 0; i < RUNS; i++) {
    const study = simulateStudy(params, seed + i);
    totals.metricHuman += study.metricHuman;
    totals.metricTruth += study.metricTruth;
    totals.humanTruth += study.humanTruth;
  }
  return {
    metricHuman: totals.metricHuman / RUNS,
    metricTruth: totals.metricTruth / RUNS,
    humanTruth: totals.humanTruth / RUNS,
  };
}

describe("Kendall's tau", () => {
  it("is 1 for the same order and -1 for the reverse", () => {
    const a = [1, 2, 3, 4];
    expect(kendall(a, [10, 20, 30, 40])).toBe(1);
    expect(kendall(a, [40, 30, 20, 10])).toBe(-1);
  });

  it("counts one swap as the fraction of pairs it breaks", () => {
    // Four items, six pairs; swapping one adjacent pair leaves five
    // concordant and one discordant.
    expect(kendall([1, 2, 3, 4], [1, 2, 4, 3])).toBeCloseTo(4 / 6, 10);
  });
});

describe("the browser studies agree with numpy", () => {
  for (const config of reference.configs) {
    it(`matches the mean agreement at ${config.models} models, ${config.trials} trials, N = ${config.n}`, () => {
      const mine = measure(config.models, config.trials, config.n, 5000 + config.models * 7 + config.n);
      for (const key of ["metricHuman", "metricTruth", "humanTruth"] as const) {
        // Six standard errors of the mean over RUNS studies.
        const tolerance = (6 * config[key].sd) / Math.sqrt(RUNS);
        expect(
          Math.abs(mine[key] - config[key].mean),
          `${key} at ${config.models}/${config.trials}/${config.n}`,
        ).toBeLessThan(tolerance + 0.01);
      }
    });
  }
});

describe("what the page claims about budgets", () => {
  it("changes the verdict on budget alone, with the metric unchanged", () => {
    const cheap = at(10, 400, 5000);
    const rich = at(10, 40000, 50000);
    expect(cheap.metricHuman.p95).toBeLessThan(rich.metricHuman.p5);
    expect(reference.verdictFlips).toBe(true);
  });

  it("has the metric track the truth better than a small study can see", () => {
    const cheap = at(10, 400, 5000);
    expect(cheap.metricTruth.mean).toBeGreaterThan(cheap.metricHuman.mean);
    expect(reference.tracksBetterThanSeen).toBe(true);
  });

  it("keeps every offered setting inside the normal approximation's range", () => {
    expect(reference.smallestTrialsTimesRate).toBeGreaterThan(100);
  });

  it("makes a single study noisier than its own mean suggests", () => {
    // The instrument shows one study per press, so the spread of a single
    // study is the quantity a reader is actually looking at.
    const cheap = at(10, 400, 5000);
    expect(cheap.metricHuman.p95 - cheap.metricHuman.p5).toBeGreaterThan(0.3);
  });
});
