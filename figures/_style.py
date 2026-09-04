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


# --- brand modes -----------------------------------------------------------
# The site's hero and social card are generated from the same two scripts that
# produce the teaching figures, so the artwork cannot drift from the numbers it
# depicts. These render on a solid ground rather than transparent, because they
# are images in their own right rather than overlays.

GROUND = "#0d0c0b"  # the deck's ground, and the hero band on the site
GOLD = "#b97d1c"  # --at-primary, the Slop lockup gold


def deck_mono() -> str:
    """The deck's own monospace, if Astro has fetched it.

    Astro caches the Google font under `.astro/fonts/` as woff2, which
    matplotlib cannot read; fontTools converts it in memory to a ttf that it
    can. The filename carries a content hash, so it is globbed rather than
    named. Falls back to whatever matplotlib calls monospace, and says so,
    because a figure rendered in the wrong face is worth knowing about.
    """
    import glob
    from pathlib import Path

    import matplotlib.font_manager as fm

    root = Path(__file__).resolve().parent.parent
    found = glob.glob(str(root / ".astro" / "fonts" / "font-roboto-mono-*.woff2"))
    if not found:
        print("! Roboto Mono not in .astro/fonts (run pnpm build first); using fallback mono")
        return "monospace"
    try:
        from fontTools.ttLib import TTFont

        cache = root / "figures" / ".fonts"
        cache.mkdir(exist_ok=True)
        ttf = cache / "RobotoMono.ttf"
        if not ttf.exists():
            font = TTFont(found[0])
            font.flavor = None
            font.save(str(ttf))
        fm.fontManager.addfont(str(ttf))
        return fm.FontProperties(fname=str(ttf)).get_name()
    except Exception as exc:  # brotli missing, or a font tools version change
        print(f"! could not load Roboto Mono ({exc}); using fallback mono")
        return "monospace"


def save_raster(fig, path, size_px, to_avif=False):
    """Write a fixed-pixel image into src/assets/images/, replacing a starter."""
    from pathlib import Path

    root = Path(__file__).resolve().parent.parent
    out = root / "src" / "assets" / "images" / path
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".tmp.png")
    fig.savefig(tmp, dpi=fig.dpi, facecolor=fig.get_facecolor())
    plt.close(fig)

    from PIL import Image

    img = Image.open(tmp).convert("RGB")
    if img.size != size_px:
        img = img.resize(size_px, Image.LANCZOS)
    if to_avif:
        img.save(out, format="AVIF", quality=72)
    else:
        img.save(out, format="PNG", optimize=True)
    tmp.unlink()
    print(f"\nwrote {out.relative_to(root)} at {img.size[0]}x{img.size[1]}")
    return str(out)


def course_record() -> dict:
    """Read the course code and title from the one file that defines them."""
    import re
    from pathlib import Path

    src = (Path(__file__).resolve().parent.parent / "src" / "course-config.ts").read_text(
        encoding="utf-8"
    )
    # Scoped to the courseMeta call: the schema above it validates with
    # `code: "custom"` zod issues, which a file-wide search for `code:` finds
    # first and reports as the course code.
    block = re.search(r"courseMeta\s*=\s*slopCourseMetaSchema\.parse\(\{(.*?)\n\}\)", src, re.S)
    if not block:
        raise SystemExit("could not find the courseMeta record in src/course-config.ts")
    code = re.search(r'code:\s*"([^"]+)"', block.group(1))
    title = re.search(r'title:\s*"([^"]+)"', block.group(1))
    if not code or not title:
        raise SystemExit("could not read code/title from the courseMeta record")
    return {"code": code.group(1), "title": title.group(1)}
