"""Reference values for the week 10 instrument: what a correlation study can see.

Week 10 reports that no existing metric correlated strongly with human
judgement, and then says what those studies rarely say: every metric score in
them was computed at some N, and the human ranking came from a finite number of
trials. This script measures what those two budgets do to the verdict.

One study is: m models of known quality; a metric score for each, carrying
week 5's bias, which falls like 1/N with a slope that differs per model; a human
error rate for each, better models fooling people more often, estimated from
`trials` forced choices per model as week 9 costs them. Rank agreement is
Kendall's tau, computed three ways - metric against human, and each against the
quality that generated both.

The page offers the same grid this script measures, so a reader can move either
budget and watch the agreement move with it. Nothing here is a claim about any
published study: it is a simulation whose true ranking is known, which is the
one thing a real correlation study never has.
"""

from __future__ import annotations

import json
import sys
from itertools import combinations
from pathlib import Path

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MODELS = [5, 10, 20]
TRIALS = [400, 4000, 40000]
SIZES = [5000, 50000]
STUDIES = 400
SPREAD = 0.30          # range of true quality across the models
SLOPE = (200.0, 1400.0)  # per-model bias slope: week 5's 1/N, differing by model
P0 = 0.34              # human error rate for the best model
K = 0.22               # how fast that rate falls as quality worsens
SIGMA = 0.02           # measurement noise on the metric


def kendall(a: np.ndarray, b: np.ndarray) -> float:
    concordant = discordant = 0
    for i, j in combinations(range(len(a)), 2):
        s = np.sign(a[i] - a[j]) * np.sign(b[i] - b[j])
        concordant += s > 0
        discordant += s < 0
    return float((concordant - discordant) / (len(a) * (len(a) - 1) / 2))


def study(rng, m: int, trials: int, n: int) -> tuple[float, float, float]:
    quality = np.linspace(0.0, SPREAD, m)                 # lower is better
    slope = rng.uniform(*SLOPE, m)
    metric = quality + slope / n + rng.normal(0, SIGMA, m)
    rate = P0 - K * quality                               # better model, higher error rate
    human = rng.binomial(trials, rate, m) / trials
    # Rank every list so that "better" is the same direction: lower metric,
    # higher human error rate, lower true quality.
    return (kendall(metric, -human), kendall(metric, quality), kendall(-human, quality))


rng = np.random.default_rng(20261012)
configs = []
print(f"{'models':>7}{'trials':>8}{'N':>7} | {'tau(metric,human)':>24} | {'tau(metric,truth)':>17} | {'tau(human,truth)':>16}")
for m in MODELS:
    for trials in TRIALS:
        for n in SIZES:
            runs = np.array([study(rng, m, trials, n) for _ in range(STUDIES)])
            names = ("metricHuman", "metricTruth", "humanTruth")
            stats = {}
            for i, name in enumerate(names):
                column = runs[:, i]
                lo, hi = np.percentile(column, [5, 95])
                stats[name] = {
                    "mean": float(column.mean()),
                    "sd": float(column.std(ddof=1)),
                    "p5": float(lo),
                    "p95": float(hi),
                }
            configs.append({"models": m, "trials": trials, "n": n, **stats})
            mh = stats["metricHuman"]
            print(
                f"{m:>7}{trials:>8}{n:>7} | {mh['mean']:>7.2f} +-{mh['sd']:<5.2f} [{mh['p5']:>5.2f},{mh['p95']:>5.2f}] | "
                f"{stats['metricTruth']['mean']:>7.2f} +-{stats['metricTruth']['sd']:<5.2f} | "
                f"{stats['humanTruth']['mean']:>7.2f} +-{stats['humanTruth']['sd']:<5.2f}"
            )

at = lambda m, t, n: next(c for c in configs if (c["models"], c["trials"], c["n"]) == (m, t, n))
cheap, rich = at(10, 400, 5000), at(10, 40000, 50000)
verdict_flips = cheap["metricHuman"]["p95"] < rich["metricHuman"]["p5"]
tracks_better = cheap["metricTruth"]["mean"] > cheap["metricHuman"]["mean"]
smallest_np = min(TRIALS) * (P0 - K * SPREAD)
print()
print(f"ten models: cheapest budget {cheap['metricHuman']['mean']:.2f}, richest {rich['metricHuman']['mean']:.2f}; bands disjoint: {verdict_flips}")
print(f"at the cheapest budget the metric tracks truth ({cheap['metricTruth']['mean']:.2f}) better than the study can see ({cheap['metricHuman']['mean']:.2f}): {tracks_better}")
print(f"smallest trials x rate = {smallest_np:.0f}, so a normal draw for the error rate is sound everywhere the page offers")

out = Path(__file__).resolve().parent.parent / "spec" / "week10-reference.json"
out.write_text(
    json.dumps(
        {
            "studies": STUDIES,
            "params": {"spread": SPREAD, "slopeLo": SLOPE[0], "slopeHi": SLOPE[1], "p0": P0, "k": K, "sigma": SIGMA},
            "grid": {"models": MODELS, "trials": TRIALS, "sizes": SIZES},
            "configs": configs,
            "verdictFlips": bool(verdict_flips),
            "tracksBetterThanSeen": bool(tracks_better),
            "smallestTrialsTimesRate": float(smallest_np),
        },
        indent=1,
    ),
    encoding="utf-8",
)
print(f"wrote {out.relative_to(out.parent.parent)}")
