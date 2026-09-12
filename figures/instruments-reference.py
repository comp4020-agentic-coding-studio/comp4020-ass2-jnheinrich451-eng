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


def candidate(rng, kind: str, n: int, d: int) -> np.ndarray:
    x = ar1(rng, n, d, RHO)
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
        },
        indent=1,
    ),
    encoding="utf-8",
)
print(f"\nwrote {out.relative_to(out.parent.parent)}")
