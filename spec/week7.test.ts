// Week 7's instrument, against numpy: does anything see C?
//
// Week 7 once claimed that KID and coverage both notice C's two lumps. On the
// bench as built neither does, and the page now argues that instead, so this
// suite holds three things: the browser scores agree with numpy's
// (figures/week7-reference.py), the blindness the page describes is the
// blindness numpy measured, and the reason for KID's blindness is the one the
// page gives - C matches R in every moment up to order three, which is all a
// cubic kernel can compare.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { sampleBench, threeScores, type BenchKind } from "../src/lib/bench";

type Score = "kid" | "density" | "coverage";
interface Cell {
  mean: number;
  sd: number;
  lo: number;
  hi: number;
}

const reference = JSON.parse(readFileSync(resolve("spec/week7-reference.json"), "utf8")) as {
  k: number;
  separation: number;
  moments: Record<"R" | "C", { m1: number; m2: number; m3: number; m4: number }>;
  configs: Array<{
    d: number;
    n: number;
    cells: Record<string, Cell>;
    sees: Record<Score, string[]>;
    closedForm: Record<BenchKind, number>;
  }>;
  nobodySeesCAtBench: boolean;
};

const KINDS: BenchKind[] = ["R", "A", "B", "C"];
const SCORES: Score[] = ["kid", "density", "coverage"];

const body = readFileSync(resolve("src/content/sessions/07-dropping-the-gaussian.md"), "utf8")
  .split(/^---$/m)
  .slice(2)
  .join("---");

describe("week 7's C matches R through order three", () => {
  it("draws C with R's first three moments and a different fourth", () => {
    // One coordinate is all that differs, so d = 1 is the whole story.
    const xs = sampleBench("C", 200_000, 1, 71).map((row) => row[0]);
    const moment = (p: number) => xs.reduce((sum, x) => sum + x ** p, 0) / xs.length;
    expect(Math.abs(moment(1))).toBeLessThan(0.01);
    expect(Math.abs(moment(2) - reference.moments.C.m2)).toBeLessThan(0.01);
    expect(Math.abs(moment(3))).toBeLessThan(0.02);
    expect(Math.abs(moment(4) - reference.moments.C.m4)).toBeLessThan(0.03);
    expect(reference.moments.C.m4).toBeLessThan(reference.moments.R.m4 - 1);
  });
});

describe("the browser scores agree with numpy", () => {
  for (const config of reference.configs) {
    it(`puts every cell inside numpy's envelope at d = ${config.d}, N = ${config.n}`, () => {
      const seeds = [81, 82, 83];
      const sums: Record<string, number> = {};
      for (const seed of seeds) {
        const real = sampleBench("R", config.n, config.d, seed);
        KINDS.forEach((kind, i) => {
          const scores = threeScores(real, sampleBench(kind, config.n, config.d, seed * 10 + i + 1));
          for (const score of SCORES) {
            sums[`${kind}/${score}`] = (sums[`${kind}/${score}`] ?? 0) + scores[score];
          }
        });
      }
      for (const [key, total] of Object.entries(sums)) {
        const mean = total / seeds.length;
        const cell = config.cells[key];
        expect(mean, `${key} at d = ${config.d}`).toBeGreaterThan(cell.lo);
        expect(mean, `${key} at d = ${config.d}, upper side`).toBeLessThan(cell.hi);
      }
    }, 60_000);
  }
});

describe("the blindness the page describes is the blindness numpy measured", () => {
  const at = (d: number) => reference.configs.find((c) => c.d === d)!;

  it("has no score see C at the bench's own dimension", () => {
    for (const score of SCORES) expect(at(2048).sees[score], score).not.toContain("C");
    expect(reference.nobodySeesCAtBench).toBe(true);
  });

  it("has KID miss C at every dimension, because it cannot see past order three", () => {
    for (const config of reference.configs) expect(config.sees.kid, `d = ${config.d}`).not.toContain("C");
  });

  it("has coverage see C only while the bimodal coordinate is a large part of the distance", () => {
    expect(at(2).sees.coverage).toContain("C");
    expect(at(16).sees.coverage).not.toContain("C");
  });

  it("has the three disagree about A and B at the bench's dimension", () => {
    // FID's closed form puts B closer; KID resolves A and not B; coverage
    // calls B the one that is missing.
    const bench = at(2048);
    expect(bench.closedForm.B).toBeLessThan(bench.closedForm.A);
    expect(bench.sees.kid).toContain("A");
    expect(bench.sees.kid).not.toContain("B");
    expect(bench.sees.coverage).toContain("B");
  });

  it("no longer claims on the page that KID and coverage catch C", () => {
    expect(body).not.toMatch(/Both notice that C's samples/);
    expect(body).not.toMatch(/will not agree about candidate C/);
  });
});
