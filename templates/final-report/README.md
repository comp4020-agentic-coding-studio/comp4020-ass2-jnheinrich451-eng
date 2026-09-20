# SLOP8412 final-report starter

Optional LaTeX scaffold, not an answer or a new marking scheme. The assessment
brief is authoritative. Replace the title, author fields, prompts, empty table
cells and figure placeholder with your own work.

## Compile

Keep `main.tex` and `slop-crest.png` in the same directory. Run twice:

```
pdflatex -no-shell-escape -interaction=nonstopmode -halt-on-error main.tex
pdflatex -no-shell-escape -interaction=nonstopmode -halt-on-error main.tex
```

Or upload the complete project to a LaTeX editor and select pdfLaTeX. The
standard packages are listed in main.tex; no shell escape or runtime service
is needed. The PDF preview on the course site is compiled from this source.

## Write and submit

- Follow Parts A (25 points), B (45 points), and C (30 points).
- Part B addresses estimator bias, blind spots, human correlation and adoption
  cost, or justifies an absence, and compares A/B/C against FID and FID-infinity.
- Submit at most six report pages plus references. The title block is inside
  that limit; this starter does not grant an extra cover page or appendices.
- Submit the required reproducible archive separately. This LaTeX ZIP is not
  the archive that scores the bench from a seed.
- Remove all writing prompts before submitting. Add only references you used.
  The blank cells are not zeroes and the figure placeholder is not evidence.
- Consult the linked policies for reporting, integrity and tool disclosure.

No page allocation per part is prescribed. The scaffold will grow when you
replace prompts; check the page count of your completed report yourself.

## Files and provenance

`main.tex`, this README, and `slop-crest.png` are sufficient to edit and compile.
The original `slop-crest.svg` and `SLOP-BRAND-LICENSE.txt` are included for
provenance. The shield is the site's existing astro-theme-slop asset, not a
new or redrawn university mark. Preserve its accompanying licence.

To regenerate the website downloads from the repository on Windows, run
`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-final-report-template.ps1` from the
repository root. This requires the installed project dependencies, pdfLaTeX,
pdfinfo and pdftoppm. The policy override applies only to this process; inspect
the script first. These are authoring tools, not requirements for visitors.
