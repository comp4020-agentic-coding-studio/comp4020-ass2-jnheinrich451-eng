"""Reference values for the week 8 instrument bench.

Week 8's claim is that a score is a property of the instrument as much as of
the thing measured, and the lecture makes it by scoring the same recordings
through three instruments at once. That is a claim about numbers, so it is
measured here first and the browser engine is held to what numpy found.

The recordings are sequences of d frames: an AR(1) process, so neighbouring
frames are correlated the way frames of a video are. Two candidates differ
from the reference R in one way each.

    E   a level shift: every frame of every sequence raised by c. The
        distribution of frame values moves; nothing about the order changes.
    F   frames reordered: each sequence's frames permuted at random. Every
        frame value survives; only their order is destroyed.

Three instruments look at them.

    frame marginals   pool every frame of every sequence and fit one
                      distribution to the values. A frame-wise instrument.
    frame to frame    the differences between consecutive frames. Constant
                      offsets cancel here, by construction.
    whole sequence    all d frames jointly, the instrument the bench has
                      used since week 1.

Each cell is estimated over TRIALS independent pairs of draws, and the
envelope is mean plus or minus six standard deviations. The first row scores
R against a second independent draw of R, so every column carries the number
it reports when nothing changed at all: the floor a reader has to know before
any other cell in that column means anything.

The two facts the lecture asserts in words are written into the fixture so
the test suite can hold them: each instrument is blind to one candidate
(a cell inside its own column's floor envelope), and the last two
instruments rank E and F in opposite orders.

The final block is week 11's. It asks the question a report has to answer:
if someone claims one candidate is worse, does the evidence behind the claim
support it, and would an equally honest protocol have said the opposite? The
verdict of one instrument at one sample size is recorded over many repeats,
at every sample size the page offers, so the page can say how stable each
verdict is instead of implying stability from a single run.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

D = 24
RHO = 0.9
SHIFT = 1.0
N = 800
TRIALS = 30

CANDIDATES = ("plain", "shift", "shuffle")
LENSES = ("frame", "temporal", "joint")
LABEL = {
    "plain": "nothing changed",
    "shift": "E, a level shift",
    "shuffle": "F, frames reordered",
}


def fid(X: np.ndarray, Y: np.ndarray) -> float:
    """The same closed form week 2 derived, applied to whatever is handed in."""
    m1, m2 = X.mean(0), Y.mean(0)
    if X.shape[1] == 1:
        s1 = float(X.std(0, ddof=1)[0])
        s2 = float(Y.std(0, ddof=1)[0])
        return float((m1[0] - m2[0]) ** 2 + (s1 - s2) ** 2)
    S1 = np.cov(X, rowvar=False)
    S2 = np.cov(Y, rowvar=False)
    w, V = np.linalg.eigh(S1)
    root = (V * np.sqrt(np.clip(w, 0, None))) @ V.T
    ev = np.clip(np.linalg.eigvalsh(root @ S2 @ root), 0, None)
    return float(((m1 - m2) ** 2).sum() + np.trace(S1) + np.trace(S2) - 2 * np.sqrt(ev).sum())


def ar1(rng, n: int, d: int, rho: float) -> np.ndarray:
    """Sequences whose neighbouring frames are correlated, marginals N(0, 1)."""
    x = np.empty((n, d))
    x[:, 0] = rng.standard_normal(n)
    innovation = np.sqrt(1 - rho**2)
    for t in range(1, d):
        x[:, t] = rho * x[:, t - 1] + innovation * rng.standard_normal(n)
    return x


def candidate(rng, kind: str, n: int, d: int, rho: float = RHO) -> np.ndarray:
    x = ar1(rng, n, d, rho)
    if kind == "shift":
        return x + SHIFT
    if kind == "shuffle":
        order = np.argsort(rng.standard_normal((n, d)), axis=1)
        return np.take_along_axis(x, order, axis=1)
    return x


def through(lens: str, x: np.ndarray) -> np.ndarray:
    if lens == "frame":
        return x.reshape(-1, 1)
    if lens == "temporal":
        return np.diff(x, axis=1)
    return x


rng = np.random.default_rng(20260928)

cells = {}
print(f"d={D} frames, rho={RHO}, shift={SHIFT}, N={N} sequences, {TRIALS} trials")
header = f"{'candidate':>20} | " + " | ".join(f"{lens:>22}" for lens in LENSES)
print(header)
print("-" * len(header))
for kind in CANDIDATES:
    row = []
    for lens in LENSES:
        runs = [
            fid(through(lens, ar1(rng, N, D, RHO)), through(lens, candidate(rng, kind, N, D)))
            for _ in range(TRIALS)
        ]
        mean, sd = float(np.mean(runs)), float(np.std(runs, ddof=1))
        cells[f"{kind}/{lens}"] = {
            "candidate": kind,
            "lens": lens,
            "mean": mean,
            "sd": sd,
            "lo": mean - 6 * sd,
            "hi": mean + 6 * sd,
        }
        row.append(f"{mean:12.4f} +-{sd:7.4f}")
    print(f"{LABEL[kind]:>20} | " + " | ".join(row))

# The lecture's two assertions, measured rather than asserted.
blind = {
    lens: [
        kind
        for kind in ("shift", "shuffle")
        if cells[f"{kind}/{lens}"]["mean"] < cells[f"plain/{lens}"]["hi"]
    ]
    for lens in LENSES
}
flip = (
    cells["shift/temporal"]["mean"] < cells["shuffle/temporal"]["mean"]
    and cells["shift/joint"]["mean"] > cells["shuffle/joint"]["mean"]
)
print()
for lens in LENSES:
    seen = blind[lens] or ["nothing"]
    print(f"{lens:>14}: cannot distinguish {', '.join(seen)} from no change at all")
print(f"\nframe-to-frame and whole-sequence rank E and F in opposite orders: {flip}")

# --- week 11: what a declared protocol returns, repeatedly -----------------
# A verdict is which candidate an instrument calls worse in one run, or
# neither when both sit on that instrument's floor. Repeats say whether the
# verdict is a property of the protocol or of the draw; sample sizes say
# whether it is a property of N. Here it is neither: every column returns the
# same verdict every time, at every N, which is why the disagreement between
# columns cannot be resolved by measuring harder.

VERDICT_SIZES = [100, 400, 800]
REPEATS = 20


def floor_ceiling(floor: float) -> float:
    """The display rule the page uses, kept identical here."""
    return floor * 1.6 + 1e-3


def verdict(rng, lens: str, n: int, rho: float = RHO) -> str:
    ref = ar1(rng, n, D, rho)
    seen = through(lens, ref)
    floor = fid(seen, through(lens, candidate(rng, "plain", n, D, rho)))
    e = fid(seen, through(lens, candidate(rng, "shift", n, D, rho)))
    f = fid(seen, through(lens, candidate(rng, "shuffle", n, D, rho)))
    ceiling = floor_ceiling(floor)
    if e < ceiling and f < ceiling:
        return "neither"
    if e < ceiling:
        return "shuffle"
    if f < ceiling:
        return "shift"
    return "shift" if e > f else "shuffle"


verdicts = {}
print()
print(f"verdicts over {REPEATS} repeats: which candidate each instrument calls worse")
print(f"{'N':>6} | " + " | ".join(f"{lens:>26}" for lens in LENSES))
for n in VERDICT_SIZES:
    row = []
    for lens in LENSES:
        calls = [verdict(rng, lens, n) for _ in range(REPEATS)]
        top = max(set(calls), key=calls.count)
        share = calls.count(top) / REPEATS
        verdicts[f"{lens}/{n}"] = {"lens": lens, "n": n, "verdict": top, "share": share}
        row.append(f"{top:>10} in {share:6.0%} of runs")
    print(f"{n:>6} | " + " | ".join(row))

# With independent frames there is no order for F to destroy, so an
# instrument that only looks at order has nothing to report about either
# candidate. That is the page's "no ordering to defend" state, pinned here so
# it cannot quietly stop happening.
zero_rho = {}
print()
for lens in LENSES:
    calls = [verdict(rng, lens, 400, 0.0) for _ in range(REPEATS)]
    top = max(set(calls), key=calls.count)
    zero_rho[lens] = {"lens": lens, "n": 400, "verdict": top, "share": calls.count(top) / REPEATS}
    print(f"correlation 0, {lens:>9}: {top} in {calls.count(top) / REPEATS:.0%} of runs")

reversal = all(
    verdicts[f"temporal/{n}"]["verdict"] != verdicts[f"joint/{n}"]["verdict"]
    and verdicts[f"temporal/{n}"]["share"] == 1.0
    and verdicts[f"joint/{n}"]["share"] == 1.0
    for n in VERDICT_SIZES
)
print()
print(f"every sample size: the two seeing instruments disagree, both unanimously: {reversal}")


out = Path(__file__).resolve().parent.parent / "spec" / "instruments-reference.json"
out.write_text(
    json.dumps(
        {
            "d": D,
            "rho": RHO,
            "shift": SHIFT,
            "n": N,
            "trials": TRIALS,
            "cells": cells,
            "blind": blind,
            "rankingFlips": flip,
            "verdictSizes": VERDICT_SIZES,
            "repeats": REPEATS,
            "verdicts": verdicts,
            "reversalHoldsAtEverySize": reversal,
            "verdictsZeroCorrelation": zero_rho,
        },
        indent=1,
    ),
    encoding="utf-8",
)
print(f"\nwrote {out.relative_to(out.parent.parent)}")
