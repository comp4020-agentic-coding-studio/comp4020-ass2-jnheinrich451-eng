"""Figure E — why the score looked convincing in the first place.

Heusel and colleagues report that FID rises as an image set is progressively
disturbed, across six kinds of disturbance. This redraws the shape of that
claim rather than reproducing their figure: the curves here are schematic and
carry no measured values, which is why the axis is labelled with rank rather
than with numbers.

The point of the slide is that a monotone response to degradation is real
evidence, and that it is a much weaker claim than "this score ranks models
the way people do".

Deck: week 2, slide 14.
"""

from __future__ import annotations

import numpy as np

from _style import GOLD, INK, save

import matplotlib.pyplot as plt

DISTURBANCES = [
    "Gaussian noise",
    "Gaussian blur",
    "black rectangles",
    "swirl",
    "salt and pepper",
    "dataset contamination",
]
# Schematic shapes only: each is monotone increasing in disturbance level, with
# a different curvature so the panels do not read as one curve drawn six times.
SHAPES = [1.0, 1.6, 2.2, 1.3, 1.8, 2.6]
levels = np.linspace(0, 1, 40)

fig, axes = plt.subplots(2, 3, figsize=(8.6, 4.0), sharex=True, sharey=True)
print("schematic curves, no measured values; shape only\n")
print(f"{'disturbance':<26}{'exponent':>10}{'monotone':>11}")
for ax, name, k in zip(axes.ravel(), DISTURBANCES, SHAPES):
    y = levels**k
    ax.plot(levels, y, color=GOLD, lw=1.8)
    ax.set_title(name, color=INK, fontsize=8.5, pad=6)
    ax.set_xticks([])
    ax.set_yticks([])
    print(f"{name:<26}{k:>10.1f}{str(bool(np.all(np.diff(y) >= 0))):>11}")

fig.supxlabel("disturbance level", color=INK, fontsize=9)
fig.supylabel("reported FID", color=INK, fontsize=9)
print("\nall six rise monotonically, which is the claim the figure carries")
save(fig, "disturbance-grid")
