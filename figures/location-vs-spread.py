"""Figure B — the two things the 1-D Wasserstein distance measures.

Left: equal variance, shifted mean. Right: equal mean, different variance.
The point is that the closed form separates these, and that neither panel is
"more wrong" than the other in any way the number expresses.

Deck: week 2, slide 08.
"""

from __future__ import annotations

import numpy as np
from scipy.stats import norm

from _style import A_COL, B_COL, INK, R_COL, save

import matplotlib.pyplot as plt

GRID = np.linspace(-5, 5, 400)
PANELS = [
    ("same spread / different centre", (0.0, 1.0), (1.6, 1.0), A_COL),
    ("same centre / different spread", (0.0, 1.0), (0.0, 2.0), B_COL),
]

fig, axes = plt.subplots(1, 2, figsize=(8.4, 2.9), sharey=True)
print(f"{'panel':<34}{'P':>16}{'Q':>16}{'W2 squared':>13}")
for ax, (label, p, q, colour) in zip(axes, PANELS):
    ax.plot(GRID, norm.pdf(GRID, *p), color=R_COL, lw=1.6, label=f"P = N({p[0]:g}, {p[1]:g}²)")
    ax.plot(GRID, norm.pdf(GRID, *q), color=colour, lw=1.6, label=f"Q = N({q[0]:g}, {q[1]:g}²)")
    w2 = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
    print(f"{label:<34}{f'N({p[0]:g}, {p[1]:g}²)':>16}{f'N({q[0]:g}, {q[1]:g}²)':>16}{w2:>13.2f}")
    ax.set_title(label, color=INK, fontsize=9, pad=8)
    ax.set_yticks([])
    ax.spines["left"].set_visible(False)
    ax.legend(loc="upper right", fontsize=7.5)

print("\nboth terms are squared differences; the closed form keeps them apart")
save(fig, "location-vs-spread")
