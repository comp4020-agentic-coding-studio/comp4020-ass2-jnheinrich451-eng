"""Display equations for the week 2 deck, typeset as SVG.

astromotion carries no maths renderer, and neither does the theme: there is no
KaTeX, no MathJax and no remark-math anywhere in the stack. Unicode covers an
inline symbol but not a stacked fraction, an infimum with its index underneath,
or a bracketed matrix, and this is a derivation deck where the notation is the
argument.

matplotlib's mathtext typesets a LaTeX subset with no external LaTeX install,
which covers everything the deck needs except matrix environments. The one
block-covariance slide is built from HTML in the deck instead.

Each equation is written once here and referenced by name, so the notation
conventions in build/week-02-deck.md hold across sixteen slides by
construction rather than by proofreading.

Every source string is printed, which is this script's equivalent of printing
its plotted values: the LaTeX is the input a reader would want to check.
"""

from __future__ import annotations

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from _style import GOLD, save

# These equations are deck-only assets, and the deck's ground is near-black, so
# they use the deck's warm off-white rather than the mid ink the other figures
# use to survive both grounds. An equation that has to be squinted at is worse
# than no equation.
INK = "#e6ded1"

# Gold marks the object currently under discussion, per the deck's visual
# language; everything else is the same ink the other figures use, which was
# chosen to hold on the deck's near-black and the site's cream alike.
EQUATIONS: dict[str, tuple[str, str, int]] = {
    # slide 02 — the destination
    "fid": (
        r"$\mathrm{FID}=\|\mu_r-\mu_g\|_2^2+\mathrm{Tr}"
        r"\left(\Sigma_r+\Sigma_g-2(\Sigma_r^{1/2}\Sigma_g\Sigma_r^{1/2})^{1/2}\right)$",
        GOLD,
        22,
    ),
    "fid-location": (r"$\|\mu_r-\mu_g\|_2^2$", GOLD, 26),
    "fid-shape": (
        r"$\mathrm{Tr}\left(\Sigma_r+\Sigma_g"
        r"-2(\Sigma_r^{1/2}\Sigma_g\Sigma_r^{1/2})^{1/2}\right)$",
        GOLD,
        26,
    ),
    # slide 04 — couplings
    "cost-indep": (r"$\mathbb{E}(X-Y)^2=6$", INK, 22),
    "cost-anti": (r"$\mathbb{E}(X-Y)^2=8$", INK, 22),
    "cost-mono": (r"$\mathbb{E}(X-Y)^2=4$", GOLD, 22),
    "marginals": (r"$X\sim P,\qquad Y\sim Q$", INK, 20),
    # slide 05 — the search
    "w2-def": (
        r"$W_2^2(P,Q)=\inf_{\pi\in\Pi(P,Q)}"
        r"\mathbb{E}_{(X,Y)\sim\pi}\left[\|X-Y\|_2^2\right]$",
        GOLD,
        26,
    ),
    # slide 06 — why it is hard
    "coupling-object": (r"$\pi(x,y)$", INK, 26),
    "gaussian-params": (r"$(\mu_P,\Sigma_P),\qquad(\mu_Q,\Sigma_Q)$", INK, 22),
    # slide 07 — one dimension
    "oneD-setup": (
        r"$P=\mathcal{N}(\mu_P,\sigma_P^2),\qquad Q=\mathcal{N}(\mu_Q,\sigma_Q^2)$",
        INK,
        20,
    ),
    "oneD-coupling": (r"$X=\mu_P+\sigma_P Z,\qquad Y=\mu_Q+\sigma_Q Z$", GOLD, 20),
    "oneD-diff": (r"$X-Y=(\mu_P-\mu_Q)+(\sigma_P-\sigma_Q)Z$", INK, 20),
    "oneD-result": (
        r"$W_2^2(P,Q)=(\mu_P-\mu_Q)^2+(\sigma_P-\sigma_Q)^2$",
        GOLD,
        26,
    ),
    # slide 08 — the two things measured
    "term-location": (r"$(\mu_P-\mu_Q)^2$", GOLD, 24),
    "term-spread": (r"$(\sigma_P-\sigma_Q)^2$", GOLD, 24),
    # slide 09 — d dimensions
    "dD-setup": (
        r"$P=\mathcal{N}(\mu_P,\Sigma_P),\qquad Q=\mathcal{N}(\mu_Q,\Sigma_Q)$",
        INK,
        20,
    ),
    # slide 10 — the derivation board
    "row-setup": (r"$U=X-\mu_P,\qquad V=Y-\mu_Q$", INK, 19),
    "row-1": (r"$X-Y=(\mu_P-\mu_Q)+(U-V)$", INK, 19),
    "row-2": (
        r"$\mathbb{E}\|X-Y\|^2=\|\mu_P-\mu_Q\|^2+\mathbb{E}\|U-V\|^2$", INK, 19
    ),
    "row-3": (
        r"$=\|\Delta\mu\|^2+\mathrm{Tr}(\Sigma_P+\Sigma_Q-C-C^\top),"
        r"\quad C=\mathbb{E}[UV^\top]$",
        INK,
        19,
    ),
    "row-4": (
        r"$=\|\Delta\mu\|^2+\mathrm{Tr}(\Sigma_P+\Sigma_Q)-2\,\mathrm{Tr}(C)$",
        GOLD,
        19,
    ),
    # slide 12 — the solution
    "max-trace": (
        r"$\max_C\mathrm{Tr}(C)=\mathrm{Tr}\left[(\Sigma_P^{1/2}\Sigma_Q\Sigma_P^{1/2})^{1/2}\right]$",
        INK,
        22,
    ),
    "w2-gaussian": (
        r"$W_2^2(P,Q)=\|\mu_P-\mu_Q\|_2^2+\mathrm{Tr}"
        r"\left(\Sigma_P+\Sigma_Q-2(\Sigma_P^{1/2}\Sigma_Q\Sigma_P^{1/2})^{1/2}\right)$",
        GOLD,
        22,
    ),
    "sanity-1d": (r"$\rightarrow(\sigma_P-\sigma_Q)^2$", INK, 22),
    # optional worked example
    "bench-a": (r"$W_2^2(R,A)=5.12$", INK, 24),
    "bench-b": (r"$W_2^2(R,B)\approx 4.88$", GOLD, 24),
}


def render(name: str, latex: str, colour: str, size: int) -> None:
    fig = plt.figure(figsize=(0.1, 0.1))
    fig.text(0, 0, latex, fontsize=size, color=colour, va="baseline")
    save(fig, f"eq-{name}")


print(f"typesetting {len(EQUATIONS)} display equations with matplotlib mathtext\n")
for name, (latex, colour, size) in EQUATIONS.items():
    tone = "gold" if colour == GOLD else "ink "
    print(f"  {name:16} {tone}  {latex}")
    render(name, latex, colour, size)
