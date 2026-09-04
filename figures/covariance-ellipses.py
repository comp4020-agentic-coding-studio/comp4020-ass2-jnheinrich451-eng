"""Figure C — why covariance replaces variance in d dimensions.

Two Gaussians as 1-sigma ellipses: different centres, different axis lengths,
different orientations. In one dimension "spread" was a number; here it is a
shape, and the closed form has to compare shapes.

Deck: week 2, slide 09.
"""

from __future__ import annotations

import numpy as np

from _style import A_COL, INK, R_COL, save

import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse

# (mean, covariance) for the two distributions, chosen so they differ in all
# three of the things a covariance carries.
P = (np.array([0.0, 0.0]), np.array([[1.0, 0.0], [0.0, 0.35]]))
Q = (np.array([1.5, 0.9]), np.array([[0.9, 0.55], [0.55, 0.7]]))

fig, ax = plt.subplots(figsize=(5.6, 4.2))
print(f"{'':<6}{'centre':>16}{'axis lengths (1σ)':>22}{'orientation':>14}")
for (mu, cov), colour, name in ((P, R_COL, "P"), (Q, A_COL, "Q")):
    vals, vecs = np.linalg.eigh(cov)
    order = vals.argsort()[::-1]
    vals, vecs = vals[order], vecs[:, order]
    # An ellipse axis has no direction, so report it in [0, 180) rather
    # than letting the eigenvector sign print -140 for a 40 degree tilt.
    angle = float(np.degrees(np.arctan2(vecs[1, 0], vecs[0, 0]))) % 180.0
    width, height = 2 * np.sqrt(vals)
    ax.add_patch(
        Ellipse(mu, width, height, angle=angle, fill=False, ec=colour, lw=1.9, label=name)
    )
    ax.plot(*mu, marker="+", color=colour, ms=8, mew=1.6)
    print(
        f"{name:<6}{f'({mu[0]:.2f}, {mu[1]:.2f})':>16}"
        f"{f'{np.sqrt(vals[0]):.2f}, {np.sqrt(vals[1]):.2f}':>22}{angle:>13.1f}°"
    )

ax.annotate("centre", xy=tuple(Q[0]), xytext=(2.1, 1.5), color=INK, fontsize=8,
            arrowprops={"arrowstyle": "-", "color": INK, "lw": 0.7})
ax.annotate("orientation and scale", xy=(1.9, 0.55), xytext=(1.4, -1.35), color=INK,
            fontsize=8, arrowprops={"arrowstyle": "-", "color": INK, "lw": 0.7})
ax.set_xlim(-2.2, 3.6)
ax.set_ylim(-1.9, 2.4)
ax.set_aspect("equal")
ax.set_xlabel("e₁")
ax.set_ylabel("e₂")
ax.legend(loc="upper left", fontsize=8)
print("\nin one dimension spread was a number; here it is a shape")
save(fig, "covariance-ellipses")
