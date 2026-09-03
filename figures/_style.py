"""Shared look for the SLOP8412 figures.

Every figure exports SVG on a transparent background, because the same file
is read on the site's cream ground and on the deck's black one. That rules
out white ink and near-black ink alike: each colour below was picked to hold
contrast against both, so no figure depends on knowing where it landed.

Nothing here is copied from a paper. Scripts print every value they plot, so
a number in a figure can be checked against a number in the prose without
rerunning anything.
"""

from __future__ import annotations

import sys

import matplotlib

# These scripts print μ, Σ, e₁ and ² as themselves. A Windows console defaults
# to a codepage that cannot encode them, and the resulting UnicodeEncodeError
# kills the run after the figure has already been computed, so the encoding is
# set here rather than left to the terminal.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Mid-tone ink and series colours: each sits far enough from both #FBF9F4 and
# #0D0D0D to stay legible on either.
INK = "#8a8378"
GRID = "#8a837833"
R_COL = "#9d968b"
A_COL = "#c9782a"
B_COL = "#3f8fb0"
C_COL = "#8b6bb0"
ACCENT = "#b5495b"

plt.rcParams.update(
    {
        "svg.fonttype": "none",  # keep text as text, so it inherits the page font
        "font.family": "sans-serif",
        "font.size": 9,
        "text.color": INK,
        "axes.edgecolor": INK,
        "axes.labelcolor": INK,
        "axes.facecolor": "none",
        "figure.facecolor": "none",
        "savefig.facecolor": "none",
        "xtick.color": INK,
        "ytick.color": INK,
        "axes.spines.top": False,
        "axes.spines.right": False,
        "legend.frameon": False,
        "legend.labelcolor": INK,
    }
)


def save(fig, name: str) -> str:
    """Write an SVG next to the site's other assets and report where it went.

    Written to a temporary file and moved into place, because savefig
    truncates its target first. A dev server watching this directory will
    otherwise read a zero-length SVG mid-write and cache an ImageNotFound
    for a file that exists moments later. os.replace is atomic within a
    filesystem, so a reader sees either the old figure or the new one.
    """
    import os
    from pathlib import Path

    root = Path(__file__).resolve().parent.parent
    out = root / "src" / "assets" / "figures"
    out.mkdir(parents=True, exist_ok=True)
    path = out / f"{name}.svg"
    tmp = out / f".{name}.svg.tmp"
    fig.savefig(tmp, format="svg", transparent=True, bbox_inches="tight")
    plt.close(fig)
    os.replace(tmp, path)
    print(f"\nwrote {path.relative_to(root)}")
    return str(path)
