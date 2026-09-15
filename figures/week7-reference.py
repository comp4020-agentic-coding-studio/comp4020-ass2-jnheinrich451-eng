"""Reference values for the week 7 instrument: does anything see C?

Week 7 scores the bench three ways, and claimed that KID and coverage both
notice what FID cannot: that C's samples sit in two lumps. Measured, on the
bench as built, none of them does. KID's kernel is cubic, so it compares
moments up to order three, and C was constructed to match R through order
three (same mean, same covariance, and symmetric, so the third moments are
zero too); C first differs at order four. Density and coverage compare
nearest-neighbour distances, and C's one bimodal coordinate is diluted among
the others; they see it at d = 2 and lose it by d = 16. What the three do
disagree about, at the bench's own dimension, is A against B.

This script is the pin. For each configuration the page offers it scores R
drawn again, A, B and C against R, over TRIALS independent draws, and records
mean, standard deviation and a six-sigma envelope for every cell. A score
"sees" a candidate when the candidate's mean sits more than three single-draw
standard deviations from R-again's, the separation a reader would notice
across a few presses of the page. FID is recorded in closed form, because
FID's blindness to C is exact by construction and its sample estimate at
d = 2048 is dominated by week 5's bias.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CONFIGS = [(2, 1000), (16, 1000), (2048, 250)]
TRIALS = 30
K = 5
KINDS = ("R", "A", "B", "C")
SCORES = ("kid", "density", "coverage")
SEPARATION = 3.0

rng = np.random.default_rng(20260914)


def draw(kind: str, n: int, d: int) -> np.ndarray:
    x = rng.standard_normal((n, d))
    if kind == "A":
        x = x + 0.05
    elif kind == "B":
        x = x * np.sqrt(1.1)
    elif kind == "C":
        x[:, 0] = rng.choice((-1.0, 1.0), n) * 0.9 + rng.standard_normal(n) * np.sqrt(0.19)
    return x


def three_scores(real: np.ndarray, fake: np.ndarray) -> tuple[float, float, float]:
    d = real.shape[1]
    Grr, Gff, Gfr = real @ real.T, fake @ fake.T, fake @ real.T
    n, m = len(real), len(fake)
    Krr, Kff, Kfr = (Grr / d + 1) ** 3, (Gff / d + 1) ** 3, (Gfr / d + 1) ** 3
    kid = (Krr.sum() - np.trace(Krr)) / (n * (n - 1)) + (Kff.sum() - np.trace(Kff)) / (m * (m - 1)) - 2 * Kfr.mean()
    rn, fn = np.diag(Grr), np.diag(Gff)
    Drr = np.sqrt(np.clip(rn[:, None] + rn[None, :] - 2 * Grr, 0, None))
    np.fill_diagonal(Drr, np.inf)
    radius = np.sort(Drr, axis=1)[:, K - 1]
    Dfr = np.sqrt(np.clip(fn[:, None] + rn[None, :] - 2 * Gfr, 0, None))
    inside = Dfr <= radius[None, :]
    return float(kid), float(inside.sum() / (K * m)), float(inside.any(axis=0).mean())


def closed_form(kind: str, d: int) -> float:
    return {"R": 0.0, "A": d * 0.05**2, "B": d * (2.1 - 2 * np.sqrt(1.1)), "C": 0.0}[kind]


# C's first coordinate against R's, exactly.
a, s2 = 0.9, 0.19
moments = {
    "R": {"m1": 0.0, "m2": 1.0, "m3": 0.0, "m4": 3.0},
    "C": {"m1": 0.0, "m2": a**2 + s2, "m3": 0.0, "m4": a**4 + 6 * a**2 * s2 + 3 * s2**2},
}
print("C along e1 against R: " + ", ".join(f"{k} {moments['C'][k]:.4f} vs {moments['R'][k]:.0f}" for k in ("m2", "m3", "m4")))

configs = []
for d, n in CONFIGS:
    runs = {kind: [] for kind in KINDS}
    for _ in range(TRIALS):
        real = draw("R", n, d)
        for kind in KINDS:
            runs[kind].append(three_scores(real, draw(kind, n, d)))
    cells, sees, separation = {}, {s: [] for s in SCORES}, {}
    print(f"\nd = {d}, N = {n}, {TRIALS} trials  (mean +- single-draw sd)")
    for kind in KINDS:
        values = np.array(runs[kind])
        line = []
        for j, score in enumerate(SCORES):
            mean, sd = float(values[:, j].mean()), float(values[:, j].std(ddof=1))
            cells[f"{kind}/{score}"] = {"mean": mean, "sd": sd, "lo": mean - 6 * sd, "hi": mean + 6 * sd}
            line.append(f"{score} {mean:9.5f}+-{sd:.5f}")
        print(f"  {kind if kind != 'R' else 'R again'}: " + "  ".join(line) + f"   FID closed form {closed_form(kind, d):.4f}")
    for score in SCORES:
        floor = cells[f"R/{score}"]
        for kind in ("A", "B", "C"):
            cell = cells[f"{kind}/{score}"]
            sep = abs(cell["mean"] - floor["mean"]) / max(cell["sd"], floor["sd"])
            separation[f"{kind}/{score}"] = sep
            if sep > SEPARATION:
                sees[score].append(kind)
    print("  sees: " + "; ".join(f"{s} {', '.join(sees[s]) or 'nothing'}" for s in SCORES))
    configs.append(
        {
            "d": d,
            "n": n,
            "trials": TRIALS,
            "cells": cells,
            "sees": sees,
            "separation": separation,
            "closedForm": {kind: closed_form(kind, d) for kind in KINDS},
        }
    )

bench = next(c for c in configs if c["d"] == 2048)
nobody_sees_c = all("C" not in bench["sees"][s] for s in SCORES)
print(f"\nat the bench's dimension, no score sees C: {nobody_sees_c}")

out = Path(__file__).resolve().parent.parent / "spec" / "week7-reference.json"
out.write_text(
    json.dumps({"k": K, "separation": SEPARATION, "moments": moments, "configs": configs, "nobodySeesCAtBench": nobody_sees_c}, indent=1),
    encoding="utf-8",
)
print(f"wrote {out.relative_to(out.parent.parent)}")
