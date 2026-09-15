// Week 11's claim checker, against numpy.
//
// The lecture lets a reader declare a claim and the protocol behind it, then
// runs that protocol repeatedly. These fixed-seed fixtures show the intended
// demonstration outcomes, not a guarantee of unanimity for arbitrary samples.
// The floor rule is a heuristic; matching numpy does not calibrate it.
// Mixed-outcome reporting is tested separately in lecture-gadgets.test.ts.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { belowFloor, reportRuns, type Lens, type Verdict } from "../src/lib/bench";

const reference = JSON.parse(
  readFileSync(resolve("spec/instruments-reference.json"), "utf8"),
) as {
  d: number;
  rho: number;
  shift: number;
  verdictSizes: number[];
  verdicts: Record<string, { lens: string; n: number; verdict: string; share: number }>;
  verdictsZeroCorrelation: Record<string, { verdict: string; share: number }>;
  reversalHoldsAtEverySize: boolean;
};

const LENSES: Lens[] = ["frame", "temporal", "joint"];
const REPEATS = 12;

const runsAt = (n: number, rho: number) =>
  reportRuns(
    { n, d: reference.d, rho, shift: reference.shift, seed: 606060 + n },
    REPEATS,
  );

/** The verdict every repeat agreed on, or null if they did not agree. */
const unanimous = (calls: Verdict[]): Verdict | null =>
  calls.every((call) => call === calls[0]) ? calls[0] : null;

describe("the claim checker agrees with numpy", () => {
  it("returns numpy's verdict, unanimously, at every sample size offered", () => {
    for (const n of reference.verdictSizes) {
      const runs = runsAt(n, reference.rho);
      for (const lens of LENSES) {
        const agreed = unanimous(runs.verdicts[lens]);
        expect(agreed, `${lens} at N=${n} did not return one verdict in ${REPEATS} runs`).not.toBe(
          null,
        );
        expect(agreed, `${lens} at N=${n}`).toBe(reference.verdicts[`${lens}/${n}`].verdict);
        expect(reference.verdicts[`${lens}/${n}`].share, "numpy's own share").toBe(1);
      }
    }
  });

  it("has the two seeing instruments contradict each other at every sample size", () => {
    // This is what makes the lecture's exercise possible at all: whichever
    // candidate a reader names, one honest protocol backs the claim and
    // another honest protocol reverses it.
    for (const n of reference.verdictSizes) {
      const runs = runsAt(n, reference.rho);
      expect(unanimous(runs.verdicts.temporal)).toBe("shuffle");
      expect(unanimous(runs.verdicts.joint)).toBe("shift");
    }
    expect(reference.reversalHoldsAtEverySize, "numpy found the same").toBe(true);
  });

  it("reports no ordering when the instrument is on its floor for both", () => {
    // Independent frames leave nothing for F to destroy, so the instrument
    // that only looks at order has no ordering to give. Returning one anyway
    // would be the page inventing evidence.
    const runs = runsAt(400, 0);
    expect(unanimous(runs.verdicts.temporal)).toBe("neither");
    expect(reference.verdictsZeroCorrelation.temporal.verdict).toBe("neither");
    expect(unanimous(runs.verdicts.joint)).toBe("shift");
  });

  it("uses one floor rule everywhere", () => {
    // Equal to the floor is on the floor; well above it is not. The spread
    // term widens the rule when two independent floor readings disagree,
    // which is the only reason the week 8 grid passes two of them.
    expect(belowFloor(0.5, [0.5])).toBe(true);
    expect(belowFloor(5, [0.5])).toBe(false);
    expect(belowFloor(0, [0])).toBe(true);
    expect(belowFloor(0.0001, [0])).toBe(true);
    expect(belowFloor(2.4, [0.5, 1.0])).toBe(true);
    expect(belowFloor(2.4, [0.5, 0.5])).toBe(false);
  });
});
