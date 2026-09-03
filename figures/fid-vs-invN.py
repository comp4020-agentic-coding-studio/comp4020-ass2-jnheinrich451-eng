"""Estimated FID against 1/N, for both bench candidates.

FID(A, R) and FID(B, R) are estimated from samples at each N, ten trials
each, and plotted against 1/N. A linear fit runs through each series and the
true values sit as dashed horizontals. Every estimate is above its true
value, and the two fits are not parallel, so the gap between the series is a
function of N.

If the estimated ordering crosses, the crossing is marked and printed. If it
does not, the script says so rather than implying one.

The shape is Chong & Forsyth's Figure 2; the numbers are this course's bench,
computed here, not copied.

Deck: week 2, slide 12. Reused on the week 5 page as Figure 5.1.
"""

from __future__ import annotations

import argparse
import time

import numpy as np

from _style import A_COL, ACCENT, B_COL, INK, save

import matplotlib.pyplot as plt

D = 2048
SHIFT = 0.05
SCALE = 1.1
TRUE_A = D * SHIFT**2
TRUE_B = D * (1 + SCALE - 2 * np.sqrt(SCALE))

parser = argparse.ArgumentParser()
parser.add_argument("--trials", type=int, default=10)
parser.add_argument(
    "--sizes", type=int, nargs="+", default=[500, 1000, 2000, 5000, 10000, 20000, 50000]
)
args = parser.parse_args()


def moments(x: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Mean and covariance, then the sample matrix is dropped: at N = 50,000
    and d = 2048 it is 400 MB, and only its two moments are ever used."""
    mu = x.mean(axis=0, dtype=np.float64)
    xc = x - mu.astype(np.float32)
    cov = (xc.T @ xc).astype(np.float64) / (x.shape[0] - 1)
    return mu, cov


def frechet(m1, s1, m2, s2) -> float:
    """‖μ₁ − μ₂‖² + Tr(Σ₁ + Σ₂ − 2(Σ₁^½ Σ₂ Σ₁^½)^½).

    The symmetric form of the cross term is the one week 2 argues for: it has
    the same trace as (Σ₁Σ₂)^½ and stays symmetric, so eigvalsh applies and
    no complex parts appear to be discarded."""
    w, v = np.linalg.eigh(s1)
    root = (v * np.sqrt(np.clip(w, 0.0, None))) @ v.T
    ev = np.clip(np.linalg.eigvalsh(root @ s2 @ root), 0.0, None)
    return float(np.sum((m1 - m2) ** 2) + np.trace(s1) + np.trace(s2) - 2.0 * np.sqrt(ev).sum())


rng = np.random.default_rng(20260810)
rows = []
started = time.time()

print(f"d = {D}, trials = {args.trials}, sizes = {args.sizes}")
print(f"true FID(A, R) = {TRUE_A:.4f}   true FID(B, R) = {TRUE_B:.4f}\n")
print(f"{'N':>7}{'1/N':>10}{'FID(A,R)':>12}{'sd':>8}{'FID(B,R)':>12}{'sd':>8}  ordering")

for n in args.sizes:
    a_runs, b_runs = [], []
    for _ in range(args.trials):
        mr, sr = moments(rng.standard_normal((n, D), dtype=np.float32))
        ma, sa = moments(rng.standard_normal((n, D), dtype=np.float32) + np.float32(SHIFT))
        mb, sb = moments(
            rng.standard_normal((n, D), dtype=np.float32) * np.float32(np.sqrt(SCALE))
        )
        a_runs.append(frechet(mr, sr, ma, sa))
        b_runs.append(frechet(mr, sr, mb, sb))
    a_mean, b_mean = float(np.mean(a_runs)), float(np.mean(b_runs))
    rows.append((n, a_mean, b_mean, float(np.std(a_runs, ddof=1)), float(np.std(b_runs, ddof=1))))
    order = "B < A (true)" if b_mean < a_mean else "A < B (flipped)"
    print(
        f"{n:>7}{1 / n:>10.5f}{a_mean:>12.3f}{np.std(a_runs, ddof=1):>8.3f}"
        f"{b_mean:>12.3f}{np.std(b_runs, ddof=1):>8.3f}  {order}"
    )

rows.sort(key=lambda r: r[0])
inv = np.array([1 / r[0] for r in rows])
a_hat = np.array([r[1] for r in rows])
b_hat = np.array([r[2] for r in rows])
a_sd = np.array([r[3] for r in rows])
b_sd = np.array([r[4] for r in rows])

# The 1/N law only holds once the sample covariance has full rank. Below
# N = d the estimate is in a different regime entirely, and including those
# points drags the fitted intercept to roughly 180 when the true value is
# 5.12 — a fitted line that misses the answer by 35x while looking tidy.
# They are still plotted, because "the estimator is not merely biased here,
# it is not yet on the curve" is the thing to see.
fitted = np.array([r[0] > D for r in rows])
fit_a = np.polyfit(inv[fitted], a_hat[fitted], 1)
fit_b = np.polyfit(inv[fitted], b_hat[fitted], 1)
excluded = [r[0] for r in rows if r[0] <= D]
print(f"\nfitting only N > d = {D}; excluded from the fit: {excluded}")
print(f"linear fit in 1/N   A: slope {fit_a[0]:.1f}, intercept {fit_a[1]:.3f}")
print(f"linear fit in 1/N   B: slope {fit_b[0]:.1f}, intercept {fit_b[1]:.3f}")
print(f"intercepts are the N → ∞ estimates; true values are {TRUE_A:.3f} and {TRUE_B:.3f}")
print(f"intercept error   A: {fit_a[1] - TRUE_A:+.3f}   B: {fit_b[1] - TRUE_B:+.3f}")

# The ordering flips where the two fitted lines cross, if that crossing sits
# inside the range of N actually measured.
gap_slope = fit_a[0] - fit_b[0]
cross_n = None
cross_in_range = False
if abs(gap_slope) > 1e-12:
    cross_inv = (fit_b[1] - fit_a[1]) / gap_slope
    if cross_inv > 0:
        cross_n = 1 / cross_inv
        cross_in_range = bool(inv.min() <= cross_inv <= inv.max())

flipped = [r[0] for r in rows if r[2] > r[1]]
correct = [r[0] for r in rows if r[2] < r[1]]
print()
if cross_in_range:
    print(f"the A/B ordering flips at N ≈ {cross_n:,.0f}, inside the range measured")
elif not correct:
    print(f"the A/B ordering did NOT flip anywhere in {args.sizes}:")
    print(f"  it is wrong at every N measured. B is truly closer ({TRUE_B:.3f} <")
    print(f"  {TRUE_A:.3f}) and is estimated as further at all of {flipped}.")
    if cross_n is not None:
        print(f"  The fitted lines cross at N ≈ {cross_n:,.0f}, which is beyond the")
        print("  range measured, so that figure is an extrapolation and not a result.")
else:
    print(f"ordering correct at N = {correct}, flipped at N = {flipped}")
print(
    f"bias at the largest N: A {a_hat[-1] - TRUE_A:+.2f}, B {b_hat[-1] - TRUE_B:+.2f}; "
    f"the true gap is {TRUE_B - TRUE_A:+.3f}"
)
print(f"elapsed {time.time() - started:.0f}s")

fig, ax = plt.subplots(figsize=(7.0, 4.2))
xs = np.linspace(0, inv.max() * 1.05, 100)
ax.plot(xs, np.polyval(fit_a, xs), color=A_COL, lw=1.0, alpha=0.6)
ax.plot(xs, np.polyval(fit_b, xs), color=B_COL, lw=1.0, alpha=0.6)
ax.errorbar(
    inv[fitted], a_hat[fitted], yerr=a_sd[fitted], fmt="o", ms=4, color=A_COL,
    capsize=2, label="FID(A, R)",
)
ax.errorbar(
    inv[fitted], b_hat[fitted], yerr=b_sd[fitted], fmt="s", ms=4, color=B_COL,
    capsize=2, label="FID(B, R)",
)
# Hollow markers for N <= d: measured, plotted, and deliberately not fitted.
ax.plot(inv[~fitted], a_hat[~fitted], "o", ms=4, mfc="none", mec=A_COL, mew=1.0)
ax.plot(inv[~fitted], b_hat[~fitted], "s", ms=4, mfc="none", mec=B_COL, mew=1.0)
if (~fitted).any():
    ax.text(
        inv[~fitted].min(), max(a_hat[~fitted].min(), b_hat[~fitted].min()),
        f"  hollow: N ≤ d = {D}, not fitted", color=INK, fontsize=7.5, va="top",
    )
ax.axhline(TRUE_A, color=A_COL, ls="--", lw=0.9)
ax.axhline(TRUE_B, color=B_COL, ls="--", lw=0.9)
ax.text(inv.max() * 0.62, TRUE_A, f" true {TRUE_A:.2f}", color=A_COL, fontsize=8, va="bottom")
ax.text(inv.max() * 0.62, TRUE_B, f" true {TRUE_B:.2f}", color=B_COL, fontsize=8, va="top")

if cross_in_range:
    ax.axvline(1 / cross_n, color=ACCENT, lw=1.0, ls=":")
    ax.text(1 / cross_n, ax.get_ylim()[1], f" ordering flips, N ≈ {cross_n:,.0f}",
            color=ACCENT, fontsize=8, va="top")
else:
    ax.text(
        0.0, 1.02,
        f"the ordering is wrong at every N measured; B ({TRUE_B:.2f}) is truly closer than A ({TRUE_A:.2f})",
        transform=ax.transAxes, color=ACCENT, fontsize=8,
    )

ax.set_xlabel("1 / N")
ax.set_ylabel("estimated FID")
ax.set_xlim(left=0)
ax.legend(loc="upper left")
ax.text(
    0.0,
    -0.22,
    "After Chong & Forsyth (2020), Figure 2. Values computed on this course's bench.",
    transform=ax.transAxes,
    color=INK,
    fontsize=7.5,
)

save(fig, "fid-vs-invN")
