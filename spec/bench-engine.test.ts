// The browser bench against the numpy bench.
//
// Two implementations of one score is week 4's warning applied to ourselves,
// so the JavaScript engine is held to a fixture that numpy wrote
// (figures/bench-reference.py -> spec/bench-reference.json). Closed forms are
// deterministic and must agree to 1e-9. Estimates are random, so they are
// held inside envelopes six standard errors wide: a correct engine cannot
// trip them by luck, and a wrong trace term at d = 64 misses by far more
// than six standard errors.
//
// This suite imports the engine directly and needs no build, so it also
// fails loudly if the engine grows a dependency that only resolves in the
// browser.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { closedForm, eighSym, score } from "../src/lib/bench";

const reference = JSON.parse(
  readFileSync(resolve("spec/bench-reference.json"), "utf8"),
) as {
  closedForm: Array<{ shift: number; v: number; d: number; fid: number }>;
  estimator: Array<{ shift: number; v: number; d: number; n: number; lo: number; hi: number }>;
  candidateC: { d: number; n: number; lo: number; hi: number };
};

describe("the browser bench agrees with numpy", () => {
  it("matches every closed-form value to 1e-9", () => {
    for (const row of reference.closedForm) {
      expect(
        Math.abs(closedForm(row) - row.fid),
        `closed form at shift=${row.shift} v=${row.v} d=${row.d}`,
      ).toBeLessThan(1e-9);
    }
  });

  it("recovers a known eigensystem", () => {
    // [[2,1],[1,2]] has eigenvalues 1 and 3; a Jacobi solver that silently
    // stopped rotating would return the diagonal instead.
    const { values } = eighSym([
      [2, 1],
      [1, 2],
    ]);
    const sorted = [...values].sort((a, b) => a - b);
    expect(Math.abs(sorted[0] - 1)).toBeLessThan(1e-10);
    expect(Math.abs(sorted[1] - 3)).toBeLessThan(1e-10);
  });

  it("estimates inside numpy's six-sigma envelopes", () => {
    for (const env of reference.estimator) {
      const runs = [1, 2, 3].map(
        (seed) =>
          score({ kind: "gaussian", shift: env.shift, v: env.v }, env.d, env.n, seed).estimate,
      );
      const mean = runs.reduce((a, b) => a + b, 0) / runs.length;
      expect(
        mean,
        `estimate at shift=${env.shift} v=${env.v} d=${env.d} N=${env.n}`,
      ).toBeGreaterThan(env.lo);
      expect(mean, `same point, upper side`).toBeLessThan(env.hi);
    }
  });

  it("scores candidate C where numpy scores it", () => {
    const env = reference.candidateC;
    const runs = [7, 8, 9].map(
      (seed) => score({ kind: "mixture", a: 0.9 }, env.d, env.n, seed).estimate,
    );
    const mean = runs.reduce((a, b) => a + b, 0) / runs.length;
    expect(mean, "candidate C estimate").toBeGreaterThan(env.lo);
    expect(mean, "candidate C estimate, upper side").toBeLessThan(env.hi);
  });

  it("reproduces exactly from a seed", () => {
    const first = score({ kind: "gaussian", shift: 0.05, v: 1 }, 16, 200, 42).estimate;
    const second = score({ kind: "gaussian", shift: 0.05, v: 1 }, 16, 200, 42).estimate;
    expect(first).toBe(second);
  });
});
