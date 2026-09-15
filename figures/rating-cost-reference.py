"""Reference values for the week 9 rating-cost calculator.

Week 9 argues that human evaluation lost to the score on price, and states
the price: separating two candidates half a percentage point apart in human
error rate, around 30 percent, needs about 130,000 trials each. The session's
calculator lets a reader move that difference and watch the bill. This script
is the pin for the arithmetic behind it.

It does two things. It evaluates the standard two-proportion sample size over
a grid of error rates, differences, significance levels and powers, using
Python's own inverse normal, so the browser's constants and formula can be
held to it. And it checks the formula rather than trusting it: at three
differences it simulates the forced-choice experiment many times at the
computed sample size, runs the pooled two-proportion test, and records how
often the difference is detected. A sample size that is right delivers the
power it was computed for, and the fixture records whether it did.
"""

from __future__ import annotations

import json
import sys
from math import ceil, sqrt
from pathlib import Path
from statistics import NormalDist

import numpy as np

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

z = NormalDist().inv_cdf
ALPHAS = [0.05, 0.01]
POWERS = [0.8, 0.9]
RATES = [0.1, 0.3, 0.5]
DIFFERENCES = [0.0025, 0.005, 0.01, 0.02, 0.05]
SECONDS_PER_TRIAL = 4
DOLLARS_PER_HOUR = 25


def per_candidate(rate: float, difference: float, alpha: float, power: float) -> float:
    """Trials each candidate needs for a two-sided pooled two-proportion test."""
    p1, p2 = rate, rate + difference
    pbar = (p1 + p2) / 2
    numerator = z(1 - alpha / 2) * sqrt(2 * pbar * (1 - pbar)) + z(power) * sqrt(
        p1 * (1 - p1) + p2 * (1 - p2)
    )
    return numerator**2 / difference**2


constants = {
    "alpha": {str(a): z(1 - a / 2) for a in ALPHAS},
    "power": {str(p): z(p) for p in POWERS},
}
print("inverse normal constants:", json.dumps(constants))

grid = []
for alpha in ALPHAS:
    for power in POWERS:
        for rate in RATES:
            for difference in DIFFERENCES:
                grid.append(
                    {
                        "rate": rate,
                        "difference": difference,
                        "alpha": alpha,
                        "power": power,
                        "perCandidate": per_candidate(rate, difference, alpha, power),
                    }
                )

default = per_candidate(0.30, 0.005, 0.05, 0.8)
total = 2 * ceil(default)
hours = total * SECONDS_PER_TRIAL / 3600
dollars = hours * DOLLARS_PER_HOUR
print(f"\nweek 9's worked example: rate 30%, difference 0.5 points, alpha 0.05, power 0.8")
print(f"  per candidate {default:,.1f}  total {total:,}  hours {hours:,.1f}  dollars {dollars:,.0f}")

# Does the formula deliver its power? Simulate the experiment it sizes.
rng = np.random.default_rng(20261005)
REPS = 20_000
simulated = []
print(f"\nachieved power by simulation, {REPS:,} experiments each, rate 30%, alpha 0.05, power 0.8")
for difference in [0.005, 0.02, 0.05]:
    n = ceil(per_candidate(0.30, difference, 0.05, 0.8))
    a = rng.binomial(n, 0.30, REPS)
    b = rng.binomial(n, 0.30 + difference, REPS)
    pooled = (a + b) / (2 * n)
    se = np.sqrt(pooled * (1 - pooled) * 2 / n)
    stat = np.abs(b / n - a / n) / se
    achieved = float(np.mean(stat > z(0.975)))
    simulated.append({"difference": difference, "n": n, "achieved": achieved, "nominal": 0.8})
    print(f"  difference {difference:.3f}: n = {n:,} each, detected in {achieved:.3f} of experiments")

out = Path(__file__).resolve().parent.parent / "spec" / "rating-cost-reference.json"
out.write_text(
    json.dumps(
        {
            "constants": constants,
            "grid": grid,
            "workedExample": {
                "rate": 0.30,
                "difference": 0.005,
                "alpha": 0.05,
                "power": 0.8,
                "secondsPerTrial": SECONDS_PER_TRIAL,
                "dollarsPerHour": DOLLARS_PER_HOUR,
                "perCandidate": default,
                "total": total,
                "hours": hours,
                "dollars": dollars,
            },
            "simulated": simulated,
        },
        indent=1,
    ),
    encoding="utf-8",
)
print(f"\nwrote {out.relative_to(out.parent.parent)}")
