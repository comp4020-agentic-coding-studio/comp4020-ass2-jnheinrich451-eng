"""The bench's two true distances, from the closed form.

R = N(0, I), A = N(0.05·1, I), B = N(0, 1.1·I), in d = 2048.

The ellipses are the 1-σ contours in the (e₁, e₂) projection, which is what
the eye can be shown. The distances are computed from the closed form, not
from samples, so these are the true values rather than estimates of them.

The projection is the lesson as much as the ellipses are. Per coordinate the
three distributions are nearly identical, and the score is the sum of 2048
such coordinates. A difference too small to see is the whole of the number.

Deck: week 2, slides 10-11.
"""

from __future__ import annotations

import argparse

import numpy as np

from _style import A_COL, B_COL, GOLD, GROUND, INK, R_COL, deck_mono, save, save_raster

import matplotlib.pyplot as plt
from matplotlib.patches import Circle

parser = argparse.ArgumentParser()
parser.add_argument(
    "--hero",
    action="store_true",
    help="render the site's 2400x800 hero band instead of the teaching figure",
)
args = parser.parse_args()

D = 2048
SHIFT = 0.05
SCALE = 1.1

# d² = ‖μ₁ − μ₂‖² + Tr(Σ₁ + Σ₂ − 2(Σ₁Σ₂)^½), both terms in closed form.
# A: means differ by SHIFT in every coordinate, covariances identical.
fid_a = D * SHIFT**2
per_coord_a = SHIFT**2
# B: means identical, covariances I and SCALE·I, so the trace term is
# d·(1 + SCALE − 2·sqrt(SCALE)).
per_coord_b = 1 + SCALE - 2 * np.sqrt(SCALE)
fid_b = D * per_coord_b

print(f"d = {D}\n")
print(f"{'':<34}{'per coordinate':>16}{'× d':>12}")
print(f"{'FID(A, R) = ‖μ‖², μ_i = 0.05':<34}{per_coord_a:>16.7f}{fid_a:>12.4f}")
print(f"{'FID(B, R) = 1 + 1.1 − 2√1.1':<34}{per_coord_b:>16.7f}{fid_b:>12.4f}")
print(f"\n√1.1 = {np.sqrt(SCALE):.7f}")
print(f"difference B − A = {fid_b - fid_a:+.4f}, so B is the better candidate")
print("\n1-σ radii drawn in the (e₁, e₂) projection:")
print(f"  R  1.000000   A  1.000000 (centre {SHIFT}, {SHIFT})   B  {np.sqrt(SCALE):.6f}")

if args.hero:
    # The hero says one thing: two candidates, two numbers, almost the same
    # circle. No axes, because nothing here is to be read off a scale.
    mono = deck_mono()
    fig, ax = plt.subplots(figsize=(24, 8), dpi=100)
    fig.patch.set_facecolor(GROUND)
    ax.set_facecolor(GROUND)

    for centre, radius, alpha in (
        ((0.0, 0.0), 1.0, 0.30),
        ((SHIFT, SHIFT), 1.0, 0.75),
        ((0.0, 0.0), float(np.sqrt(SCALE)), 1.0),
    ):
        ax.add_patch(Circle(centre, radius, fill=False, ec=GOLD, lw=2.4, alpha=alpha))

    ax.text(
        2.05, 0.34, f"FID(A, R) = {fid_a:.2f}",
        color=GOLD, fontsize=34, fontfamily=mono, va="center",
    )
    ax.text(
        2.05, -0.34, f"FID(B, R) = {fid_b:.2f}",
        color=GOLD, fontsize=34, fontfamily=mono, va="center",
    )

    # 8.1 x 2.7 data units is 3:1, matching the 2400x800 frame, so the
    # equal-aspect axis fills it instead of leaving empty ground at the right.
    ax.set_xlim(-1.5, 6.6)
    ax.set_ylim(-1.35, 1.35)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
    save_raster(fig, "hero-home.avif", (2400, 800), to_avif=True)
    raise SystemExit(0)

fig, ax = plt.subplots(figsize=(5.4, 5.0))

for centre, radius, colour, label in (
    ((0.0, 0.0), 1.0, R_COL, "R = N(0, I)"),
    ((SHIFT, SHIFT), 1.0, A_COL, "A = N(0.05·1, I)"),
    ((0.0, 0.0), float(np.sqrt(SCALE)), B_COL, "B = N(0, 1.1·I)"),
):
    ax.add_patch(Circle(centre, radius, fill=False, ec=colour, lw=1.8, label=label))
    ax.plot(*centre, marker="+", color=colour, ms=7, mew=1.4)

ax.set_xlim(-1.35, 1.35)
ax.set_ylim(-1.35, 1.45)
ax.set_aspect("equal")
ax.set_xlabel("e₁")
ax.set_ylabel("e₂")
ax.legend(loc="upper center", ncols=1, fontsize=8, bbox_to_anchor=(0.5, 1.02))

ax.text(
    -1.28,
    -1.28,
    f"FID(A, R) = 2048 × 0.05² = {fid_a:.2f}\n"
    f"FID(B, R) = 2048 × (2.1 − 2√1.1) = {fid_b:.2f}",
    color=INK,
    fontsize=9,
)

save(fig, "bench-truth")
