"""What "inf over couplings" means, for two 1-D Gaussians.

P = N(0, 1) and Q = N(2, 1). A coupling is any joint distribution with those
two as marginals; three are drawn here, each as lines pairing quantiles of P
with quantiles of Q. The marginals are identical in all three panels. Only
the pairing changes, and with it the expected squared cost.

The optimal coupling for two Gaussians on the line is the monotone,
rank-preserving one, and its cost is the Wasserstein-2 distance. Both other
panels are valid couplings, so both are feasible points the infimum is taken
over.

Deck: week 2, slides 3-4.
"""

from __future__ import annotations

import numpy as np
from scipy.stats import norm

from _style import A_COL, ACCENT, INK, R_COL, save

import matplotlib.pyplot as plt

MU_P, MU_Q, SIGMA = 0.0, 2.0, 1.0
K = 14  # pairs drawn per panel

# Closed forms for E‖X - Y‖² under each coupling of two Gaussians:
#   comonotone      (μ₁-μ₂)² + (σ₁-σ₂)²
#   independent     (μ₁-μ₂)² + σ₁² + σ₂²
#   countermonotone (μ₁-μ₂)² + (σ₁+σ₂)²
GAP = (MU_P - MU_Q) ** 2
EXACT = {
    "optimal (monotone)": GAP + (SIGMA - SIGMA) ** 2,
    "independent": GAP + SIGMA**2 + SIGMA**2,
    "counter-monotone": GAP + (SIGMA + SIGMA) ** 2,
}

rng = np.random.default_rng(20260810)
u = (np.arange(K) + 0.5) / K
xs = norm.ppf(u, MU_P, SIGMA)
ys_mono = norm.ppf(u, MU_Q, SIGMA)
ys_anti = norm.ppf(1 - u, MU_Q, SIGMA)
ys_indep = rng.permutation(ys_mono)

PANELS = [
    ("independent", ys_indep, R_COL),
    ("counter-monotone", ys_anti, ACCENT),
    ("optimal (monotone)", ys_mono, A_COL),
]

grid = np.linspace(-4.2, 6.2, 400)
dens_p = norm.pdf(grid, MU_P, SIGMA)
dens_q = norm.pdf(grid, MU_Q, SIGMA)

fig, axes = plt.subplots(1, 3, figsize=(9.6, 3.4), sharex=True, sharey=True)

print("P = N(0, 1)   Q = N(2, 1)   pairs drawn per panel:", K)
print(f"{'coupling':<20} {'E(X-Y)^2 exact':>15} {'mean of drawn pairs':>21}")

for ax, (name, ys, colour) in zip(axes, PANELS):
    empirical = float(np.mean((xs - ys) ** 2))
    print(f"{name:<20} {EXACT[name]:>15.3f} {empirical:>21.3f}")

    ax.plot(grid, dens_p + 1.35, color=INK, lw=1.1)
    ax.plot(grid, dens_q, color=INK, lw=1.1)
    for x, y in zip(xs, ys):
        ax.plot([x, y], [1.35, 0.42], color=colour, lw=0.9, alpha=0.75)
    ax.scatter(xs, np.full(K, 1.35), s=7, color=INK, zorder=3)
    ax.scatter(ys, np.full(K, 0.42), s=7, color=INK, zorder=3)

    ax.set_title(f"{name}\nE(X−Y)² = {EXACT[name]:.0f}", color=INK, fontsize=9, pad=8)
    ax.set_yticks([])
    ax.spines["left"].set_visible(False)
    ax.set_xlim(-4.2, 6.2)

axes[0].text(-4.0, 1.78, "P", color=INK, fontsize=10)
axes[0].text(-4.0, 0.30, "Q", color=INK, fontsize=10)

print("\nthe marginals are the same in all three panels; only the pairing differs")
print(f"W₂²(P, Q) = {EXACT['optimal (monotone)']:.0f}, attained by the monotone coupling")

save(fig, "couplings")
