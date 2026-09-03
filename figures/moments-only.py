"""What the Gaussian assumption throws away.

R = N(0, I) and C, the week 6 candidate: an equal mixture of
N(+a·e₁, I − a²e₁e₁ᵀ) and N(−a·e₁, I − a²e₁e₁ᵀ) with a = 0.9. Along e₁ that
mixture has mean 0 and variance a² + (1 − a²) = 1, exactly matching R.

Two moments agree, so the closed form returns FID(C, R) = 0. The histograms
do not agree at all. The score is computed on the first two moments of the
feature distribution, so everything visible here is outside what it can see.

Deck: week 2, slide 5.
"""

from __future__ import annotations

import numpy as np

from _style import C_COL, INK, R_COL, save

import matplotlib.pyplot as plt

A = 0.9
N = 20_000
rng = np.random.default_rng(20260810)

# Along e₁ only: R is standard normal, C is the two-component mixture.
r = rng.standard_normal(N)
sign = rng.choice((-1.0, 1.0), size=N)
c = sign * A + rng.standard_normal(N) * np.sqrt(1 - A**2)

print(f"a = {A}, N = {N} per distribution, projected on e₁\n")
print(f"{'':<26}{'mean':>10}{'variance':>12}")
for name, sample, exact_var in (("R = N(0, I)", r, 1.0), ("C (bimodal mixture)", c, 1.0)):
    print(f"{name:<26}{sample.mean():>10.4f}{sample.var(ddof=1):>12.4f}")
print(f"{'exact, both':<26}{0.0:>10.4f}{1.0:>12.4f}")
print(f"\ncomponent means ±{A}, component variance 1 − a² = {1 - A**2:.2f}")
print(f"mixture variance = a² + (1 − a²) = {A**2 + (1 - A**2):.2f}")
print("\nmeans agree and covariances agree, so the closed form gives FID(C, R) = 0.000")

fig, ax = plt.subplots(figsize=(6.6, 3.4))
bins = np.linspace(-4, 4, 90)
ax.hist(r, bins=bins, density=True, color=R_COL, alpha=0.55, label="R = N(0, I)")
ax.hist(c, bins=bins, density=True, color=C_COL, alpha=0.55, label="C, bimodal")

ax.axvline(0.0, color=INK, lw=1.0, ls="--")
ax.annotate(
    "same mean (0)\nsame variance (1)",
    xy=(0.0, 0.44),
    xytext=(1.55, 0.46),
    color=INK,
    fontsize=9,
    arrowprops={"arrowstyle": "-", "color": INK, "lw": 0.8},
)
ax.text(-3.9, 0.46, "FID(C, R) = 0", color=INK, fontsize=11)

ax.set_xlabel("projection on e₁")
ax.set_yticks([])
ax.spines["left"].set_visible(False)
ax.legend(loc="upper right")

save(fig, "moments-only")
