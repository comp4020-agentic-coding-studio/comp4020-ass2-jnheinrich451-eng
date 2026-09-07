"""Reference values for the in-browser bench engine.

The workbench re-implements the bench in JavaScript so it can run on the
deployed static site, and a second implementation of the same score is
exactly the situation week 4 warns about. This script is the pin: numpy
computes closed-form values over a parameter grid, and statistical envelopes
for the estimator, and writes them to spec/bench-reference.json. The vitest
suite then holds the JavaScript engine to them, so the two implementations
cannot drift apart silently.

Closed forms are exact and must match to 1e-9. Estimates are random, so the
envelope is mean plus/minus six standard errors over many trials: wide enough
that a correct engine never trips it, tight enough that a wrong trace term
cannot hide inside it.

Candidates follow the bench: a candidate is N(shift*1, v*I), and C is the
week 6 mixture with a = 0.9, whose true score is exactly zero.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

GRID = [
    # (shift, variance scale v, d)
    (0.05, 1.0, 2), (0.05, 1.0, 16), (0.05, 1.0, 64),
    (0.0, 1.1, 2), (0.0, 1.1, 16), (0.0, 1.1, 64),
    (0.3, 1.5, 8), (1.0, 1.0, 4), (0.0, 0.5, 32),
]


def closed_form(shift: float, v: float, d: int) -> float:
    # ||mu||^2 + Tr(I + vI - 2 sqrt(v) I) with the shift in every coordinate.
    return d * shift**2 + d * (1.0 + v - 2.0 * np.sqrt(v))


def estimate(rng, shift, v, d, n) -> float:
    X = rng.standard_normal((n, d))
    Y = rng.standard_normal((n, d)) * np.sqrt(v) + shift
    m1, m2 = X.mean(0), Y.mean(0)
    S1 = np.cov(X, rowvar=False)
    S2 = np.cov(Y, rowvar=False)
    w, V = np.linalg.eigh(S1)
    root = (V * np.sqrt(np.clip(w, 0, None))) @ V.T
    ev = np.clip(np.linalg.eigvalsh(root @ S2 @ root), 0, None)
    return float(((m1 - m2) ** 2).sum() + np.trace(S1) + np.trace(S2) - 2 * np.sqrt(ev).sum())


def estimate_c(rng, d, n) -> float:
    """Candidate C against R: the bimodal mixture, true score exactly 0."""
    a = 0.9
    X = rng.standard_normal((n, d))
    Y = rng.standard_normal((n, d))
    sign = rng.choice((-1.0, 1.0), size=n)
    Y[:, 0] = sign * a + Y[:, 0] * np.sqrt(1 - a**2)
    m1, m2 = X.mean(0), Y.mean(0)
    S1 = np.cov(X, rowvar=False)
    S2 = np.cov(Y, rowvar=False)
    w, V = np.linalg.eigh(S1)
    root = (V * np.sqrt(np.clip(w, 0, None))) @ V.T
    ev = np.clip(np.linalg.eigvalsh(root @ S2 @ root), 0, None)
    return float(((m1 - m2) ** 2).sum() + np.trace(S1) + np.trace(S2) - 2 * np.sqrt(ev).sum())


rng = np.random.default_rng(20260908)
TRIALS = 40

closed = []
print(f"{'shift':>7}{'v':>6}{'d':>5}{'closed form':>14}")
for shift, v, d in GRID:
    cf = closed_form(shift, v, d)
    closed.append({"shift": shift, "v": v, "d": d, "fid": cf})
    print(f"{shift:>7.2f}{v:>6.2f}{d:>5}{cf:>14.9f}")

envelopes = []
print(f"\nestimator envelopes, {TRIALS} numpy trials each")
print(f"{'shift':>7}{'v':>6}{'d':>5}{'N':>6}{'mean':>10}{'sd':>9}{'lo':>10}{'hi':>10}")
for shift, v, d, n in [(0.05, 1.0, 64, 100), (0.05, 1.0, 64, 500), (0.0, 1.1, 16, 200)]:
    runs = [estimate(rng, shift, v, d, n) for _ in range(TRIALS)]
    mean, sd = float(np.mean(runs)), float(np.std(runs, ddof=1))
    lo, hi = mean - 6 * sd, mean + 6 * sd
    envelopes.append({"shift": shift, "v": v, "d": d, "n": n, "lo": lo, "hi": hi, "mean": mean})
    print(f"{shift:>7.2f}{v:>6.2f}{d:>5}{n:>6}{mean:>10.3f}{sd:>9.3f}{lo:>10.3f}{hi:>10.3f}")

c_runs = [estimate_c(rng, 16, 500) for _ in range(TRIALS)]
c_mean, c_sd = float(np.mean(c_runs)), float(np.std(c_runs, ddof=1))
c_env = {"d": 16, "n": 500, "lo": c_mean - 6 * c_sd, "hi": c_mean + 6 * c_sd, "mean": c_mean}
print(f"\ncandidate C, d=16 N=500: mean {c_mean:.3f} sd {c_sd:.3f} (true value is exactly 0)")

out = Path(__file__).resolve().parent.parent / "spec" / "bench-reference.json"
out.write_text(
    json.dumps({"closedForm": closed, "estimator": envelopes, "candidateC": c_env}, indent=1),
    encoding="utf-8",
)
print(f"\nwrote {out.relative_to(out.parent.parent)}")
