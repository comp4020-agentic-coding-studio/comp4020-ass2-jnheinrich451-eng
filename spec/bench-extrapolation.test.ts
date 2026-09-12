// The week 5 extrapolator, against numpy.
//
// The lecture page makes two claims that arithmetic alone does not establish,
// so both are pinned here rather than asserted in prose:
//
//   1. the fitted intercept is a far better estimate of the true score than
//      any single rung of the ladder, and
//   2. it is not a precise one - its spread is comparable to the value it
//      estimates, which is why the page refuses to report it bare.
//
// numpy measured both (figures/bench-reference.py). Envelopes are six
// standard deviations wide over independent ladders: a correct engine cannot
// trip them by luck, and a fit run against N instead of 1/N misses by orders
// of magnitude.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { fitInverseN, ladder } from "../src/lib/bench";

const reference = JSON.parse(
  readFileSync(resolve("spec/bench-reference.json"), "utf8"),
) as {
  extrapolation: Array<{
    shift: number;
    v: number;
    d: number;
    sizes: number[];
    trials: number;
    truth: number;
    rungs: Array<{ n: number; lo: number; hi: number; mean: number }>;
    intercept: { mean: number; sd: number; lo: number; hi: number };
  }>;
};

describe("the extrapolator agrees with numpy", () => {
  it("recovers an exact line in 1/N", () => {
    // y = 3 + 250/N, no noise: any fit that is actually least squares in 1/N
    // returns the coefficients back.
    const points = [60, 100, 200, 400, 800].map((n) => ({ n, mean: 3 + 250 / n }));
    const { intercept, slope } = fitInverseN(points);
    expect(Math.abs(intercept - 3)).toBeLessThan(1e-9);
    expect(Math.abs(slope - 250)).toBeLessThan(1e-9);
  });

  it("puts every rung inside numpy's envelope", () => {
    for (const config of reference.extrapolation) {
      const runs = [11, 12, 13].map((seed) =>
        ladder(
          { kind: "gaussian", shift: config.shift, v: config.v },
          config.d,
          config.sizes,
          config.trials,
          seed,
        ),
      );
      for (let i = 0; i < config.rungs.length; i++) {
        const mean = runs.reduce((sum, run) => sum + run.rungs[i].mean, 0) / runs.length;
        const { n, lo, hi } = config.rungs[i];
        expect(mean, `d=${config.d} v=${config.v} rung N=${n}`).toBeGreaterThan(lo);
        expect(mean, `d=${config.d} v=${config.v} rung N=${n}, upper side`).toBeLessThan(hi);
      }
    }
  });

  it("lands the intercept inside numpy's envelope", () => {
    for (const config of reference.extrapolation) {
      const betas = [21, 22, 23, 24, 25].map(
        (seed) =>
          ladder(
            { kind: "gaussian", shift: config.shift, v: config.v },
            config.d,
            config.sizes,
            config.trials,
            seed,
          ).intercept,
      );
      const mean = betas.reduce((a, b) => a + b, 0) / betas.length;
      expect(mean, `intercept at d=${config.d} v=${config.v}`).toBeGreaterThan(
        config.intercept.lo,
      );
      expect(mean, `intercept at d=${config.d} v=${config.v}, upper side`).toBeLessThan(
        config.intercept.hi,
      );
    }
  });

  it("beats the shortest rung by more than an order of magnitude", () => {
    // The claim the lecture page makes in words. Averaged over ladders, the
    // intercept's distance from the truth is under a tenth of the first
    // rung's - in practice under a hundredth.
    for (const config of reference.extrapolation) {
      const runs = [31, 32, 33, 34, 35].map((seed) =>
        ladder(
          { kind: "gaussian", shift: config.shift, v: config.v },
          config.d,
          config.sizes,
          config.trials,
          seed,
        ),
      );
      const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
      const interceptError = Math.abs(mean(runs.map((r) => r.intercept)) - config.truth);
      const rungError = Math.abs(mean(runs.map((r) => r.rungs[0].mean)) - config.truth);
      expect(interceptError, `d=${config.d} v=${config.v}: intercept error`).toBeLessThan(
        rungError / 10,
      );
    }
  });

  it("does not pretend the intercept is precise", () => {
    // The second claim, and the one a tidier demonstration would hide: the
    // spread of the intercept is the same order as the value itself, so a
    // single extrapolated number is not a measurement until it carries this.
    for (const config of reference.extrapolation) {
      expect(config.intercept.sd, `d=${config.d} v=${config.v}`).toBeGreaterThan(
        config.truth / 4,
      );
    }
  });
});
