// The week 8 instrument bench, against numpy.
//
// The lecture puts three instruments on the same recordings and claims three
// things about the result: each instrument is blind to a different failure,
// the blindness is total rather than a matter of degree, and two of the
// instruments rank the two candidates in opposite orders. None of that is
// arithmetic a type checker can protect, so numpy measured it first
// (figures/instruments-reference.py) and this suite holds the browser engine
// to what it found.
//
// Cells are random, so they are held inside envelopes six standard deviations
// wide. Blindness is the sharper assertion: a blind cell has to land inside
// the envelope of its own column's floor, which is what that instrument
// reports when nothing changed at all.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { instrumentTable, type Lens, type SequenceCandidate } from "../src/lib/bench";

interface Cell {
  candidate: string;
  lens: string;
  mean: number;
  sd: number;
  lo: number;
  hi: number;
}

const reference = JSON.parse(
  readFileSync(resolve("spec/instruments-reference.json"), "utf8"),
) as {
  d: number;
  rho: number;
  shift: number;
  n: number;
  cells: Record<string, Cell>;
  blind: Record<string, string[]>;
  rankingFlips: boolean;
};

const CANDIDATES: SequenceCandidate[] = ["plain", "shift", "shuffle"];
const LENSES: Lens[] = ["frame", "temporal", "joint"];

const runs = [51, 52, 53].map((seed) =>
  instrumentTable({
    n: reference.n,
    d: reference.d,
    rho: reference.rho,
    shift: reference.shift,
    seed,
  }),
);
const mean = (candidate: SequenceCandidate, lens: Lens) =>
  runs.reduce((sum, table) => sum + table[candidate][lens], 0) / runs.length;

describe("the instrument bench agrees with numpy", () => {
  it("puts all nine cells inside numpy's envelopes", () => {
    for (const candidate of CANDIDATES) {
      for (const lens of LENSES) {
        const cell = reference.cells[`${candidate}/${lens}`];
        const value = mean(candidate, lens);
        expect(value, `${candidate} through ${lens}`).toBeGreaterThan(cell.lo);
        expect(value, `${candidate} through ${lens}, upper side`).toBeLessThan(cell.hi);
      }
    }
  });

  it("leaves the frame-wise instrument unable to see reordered frames", () => {
    // F changes no frame value, only the order of them, and this instrument
    // pools every frame before it looks. The claim is not that it scores F
    // low: it is that it scores F inside the range it produces when nothing
    // changed at all.
    const floor = reference.cells["plain/frame"];
    expect(mean("shuffle", "frame")).toBeLessThan(floor.hi);
    expect(mean("shuffle", "frame")).toBeGreaterThan(Math.min(floor.lo, 0));
  });

  it("leaves the frame-to-frame instrument unable to see a level shift", () => {
    // Differencing removes any constant, so E is invisible here by
    // construction. Measured rather than assumed, because an implementation
    // that differenced the wrong axis would still look plausible.
    const floor = reference.cells["plain/temporal"];
    expect(mean("shift", "temporal")).toBeLessThan(floor.hi);
    expect(mean("shift", "temporal")).toBeGreaterThan(floor.lo);
  });

  it("ranks the two candidates in opposite orders through two instruments", () => {
    // The week 11 problem, arriving early: both of these are honest numbers,
    // computed at the same N from the same recordings, and they disagree
    // about which candidate is worse.
    expect(mean("shift", "temporal")).toBeLessThan(mean("shuffle", "temporal"));
    expect(mean("shift", "joint")).toBeGreaterThan(mean("shuffle", "joint"));
    expect(reference.rankingFlips, "numpy found the same flip").toBe(true);
  });

  it("keeps the fixture's account of the blindness and the page's in step", () => {
    // If a regenerated fixture ever stopped showing the blindness, the page
    // would be making a claim about numbers that no longer hold.
    expect(reference.blind.frame).toEqual(["shuffle"]);
    expect(reference.blind.temporal).toEqual(["shift"]);
    expect(reference.blind.joint).toEqual([]);
  });
});
