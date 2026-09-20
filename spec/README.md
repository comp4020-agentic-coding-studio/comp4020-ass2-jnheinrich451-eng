# The spec

Every deliverable's spec — what the markers consider when they judge whether
your work matches what was required — is published on the course website, and
this repo's name tells you which one applies: the course API maps repo prefixes
to deliverables, and the `start` course skill walks your agent through pulling
the right one. The brief poses the problem; the spec is the fixed contract. Read
both on the site before you plan or build.

One file is supplied here:

## Course coherence (shipped, always on)

`data-integrity.test.ts` checks the one cross-page fact the content schemas and
build cannot: dated material stays inside the course period. The build already
owns compilation, accessibility, internal links, content references, API
generation and deck compilation.

## Your spec tests (yours to write)

Turning the week's published spec into tests is your work, not the template's.
Some spec lines are mechanically checkable — assert those here, in your own test
file alongside the supplied ones (any `spec/*.test.ts` runs with `pnpm check`).
Some lines only a person can judge; leave those to the crit. There is no minimum
count: select the checks that protect your work's real promises, and test the
**contracts** — what the page must do, not how you built it — so the tests
survive a change of approach, or of stack.

A green suite here is backpressure, not a mark: your tutor verifies what you
deployed against the published spec at the crit, and keeping your own tests
green is how you arrive with no surprises.

## Interactive lecture regressions

`lecture-gadgets.test.ts` checks shared plotted/scored samples, deterministic
replay, the two-baseline heuristic and complete reports for mixed outcomes.
It does not establish the heuristic's statistical calibration.

With the local Astro server on port 4322, run
`node scripts/check-lecture-gadgets-browser.mjs` to check cancellation and
restart, live plot/data agreement, seed replay, input contrast in both themes,
responsive layouts and client-side return navigation. It also checks shared gold
text and clicks all five lecture branches from the Sessions catalogue and each
corresponding Course sequence at desktop, tablet and mobile widths.
The report checks cover the comparison table's computed counts, invalid-seed
disclosure, clearing stale conclusions and native mathematical notation.
`lecture-rhythm.test.ts` protects those links in the built pages, including their
absence in weeks without lectures. Screenshots go in `build/`.

## Direct course navigation

`course-navigation.test.ts` checks the built destinations across course pages:
five lectures (the live introduction plus four formal lectures), twelve sessions,
four assessments (measurement log first), three workspace tools and two people.
`node scripts/check-course-navigation-browser.mjs` tests pointer and keyboard
jumps, current-page indication, Escape and outside dismissal, the final session,
and repeated client-side navigation without duplicate menus. It covers both
themes at 1920, 800, 640 and 390 pixels. The local server must run on port 4322.

## Overview header consistency

`node scripts/check-overview-headers-browser.mjs` compares the rendered heading
font, size, weight, colour, line height and spacing across Lectures, Sessions,
Assessment and Workspace. It checks unchanged titles, clipping and overlap in
both themes at 1920, 800 and 390 pixels, plus client-side return navigation.
The local server must run on port 4322; screenshots go in `build/`.

## Grade planning and policy guidance

`grades.test.ts` reads the published assessment weights and rubric maxima from
the generated API. It checks partial marks, blanks versus zero, target
feasibility, boundary bands, invalid-input rejection and policy/planner links.
`node scripts/check-grade-planner-browser.mjs` checks live totals, reload and
client-side return, tab storage and its failure fallback, CSV export, keyboard
progression, and light/dark layouts at 1920, 800 and 390 pixels. It uses the
local server on port 4322 and writes screenshots to `build/`.

## Image lab prototype

`image-lab.test.ts` protects full sample covariance (including correlation),
identity, sample counts, invalid inputs and agreement with independent NumPy
reference calculations. `lab-navigation.test.ts` covers all three tools.
`image-input.test.ts` covers local file limits and pre-decode dimension checks,
APNG rejection, crop bounds, pixel filters, valid permutations and the
distinction between FID invariance and paired-distance sensitivity.

`node scripts/check-image-lab-browser.mjs` runs genuine browser Inception
inference and compares every feature with the Python fixture. It checks the
identity control, explicit download consent, same-origin GET-only asset loading,
result export, cancellation, setting changes, navigation cleanup, failure states
and real local-file inference. It compares preview pixels with the actual
worker payload and checks shuffling without re-encoding, crop/filter changes,
input rejection, clearing files and cancellation during asynchronous decode,
and light/dark layouts at 1440, 800 and 390 pixels. It defaults to port 4322;
set `IMAGE_LAB_BASE` to test the built production preview instead. This downloads
about 98 MB from the local static server and uses desktop CPU inference.
It also reproduces the 1,800 KB single-image rejection, checks that feedback
stays beside the chooser in both themes, verifies recovery after a valid
selection and confirms keyboard activation opens a multiple-file picker.
See `build/image-lab.md` for scope, provenance and reproduction instructions.

`workspace-activities.test.ts` protects contextual workspace links on thirteen
teaching and assessment pages, the five-step learning sequence, deployment-base
and fragment resolution, and boundaries between supporting labs and assessed
bench evidence. `node scripts/check-workspace-activities-browser.mjs` checks the
built preview on port 4323 in both themes at 390, 800 and 1440 pixels, including
keyboard focus, lab navigation, browser Back and the policy handoff. It does not
download or execute the image model or Python runtime.

`node scripts/check-search-dismissal-browser.mjs` checks the search dialog at
390 and 1440 pixels in both themes: outside clicks dismiss it, clicks and
selection drags from inside do not, Escape works from the input and a result,
focus returns to the trigger, and dismissal survives page navigation. Set
`SEARCH_BASE` for the preview URL and `SEARCH_WITH_INDEX=1` to also test a real
Pagefind query and result navigation. Build and generate the search index first
when checking a static preview.

`final-report-template.test.ts` checks the optional template against the report
brief, verifies generated-file/source hashes, and checks the final-report-only
preview and base-aware downloads. The PDF and source ZIP are generated by
`scripts/build-final-report-template.ps1`; regenerate after editing the LaTeX
source. The website build does not require TeX. Independently unpack and compile
the ZIP when changing the template. `node scripts/check-report-template-browser.mjs`
checks desktop PDF embedding, the narrow-screen first-page fallback, instructions
and downloadable files at 390, 800 and 1440 pixels in both themes. Set
`REPORT_TEMPLATE_BASE` to select the built preview URL.

`self-checks.test.ts` protects the 5+12 optional question bank, route coverage,
answer feedback, numerical parsing/tolerance and assessment exclusions. The
live bank is `src/data/self-checks.json`; `build/SELF-CHECKS.md` is the approved
design snapshot. `/self-checks/` renders the same bank as the read-only Full quiz
list. `node scripts/check-self-checks-browser.mjs` exercises attempts,
explanation-based unlocking, persistence, storage failure, page navigation,
preview isolation and narrow/wide light/dark layouts. Set `SELF_CHECK_BASE`
to change its local server. It does not generate or claim to publish comics.
Under injected total localStorage denial, the existing upstream theme's
unguarded theme-preference reads log SecurityErrors. The browser check reports
this separately while asserting that quiz checking, unlocking and manual copy
still work. Normal interaction must have no uncaught exceptions.

`comic-collection.test.ts` protects the 17-card mapping, local code validation,
shared unlock flags and the teaching caveats in `/memes/`. All 17 illustrated
cards use the approved artwork manifest in `src/data/comic-artwork.json` and
published derivatives in `public/comics/`. The PNG masters stay locally in
`assets/comics/`; `figures/prepare-teaching-comics.mjs` prepares WebP copies.
Checks cover opaque assets, dimensions, size budgets and build copies. Scene
descriptions and scripted dialogue remain accessible text, not live AI replies.
`node scripts/check-comic-collection-browser.mjs` checks redemption, duplicates,
quiz-to-card navigation, group folding, three-press preview isolation, reloads,
storage failure and responsive themes. It also checks deferred image loading,
the shared modal reader, zoom/panning, Escape, outside dismissal, focus return
and transcript access. The Memes dropdown retains right-hand locks and omits
links for uncollected cards, even during Spoilers. Checks cover immediate menu
updates from quiz/code unlocks and spoiler reset on SPA departure and pagehide;
earned unlocks survive. The home destinations include Memes in navigation order.
Set `COMIC_BASE` for the local URL.

The same browser check verifies first-visit dark mode with a light OS preference,
saved light/dark choices across reloads and client navigation, and the small
collection Reset control. Reset requires confirmation, removes only the 17 quiz
unlock flags, relocks menu links immediately, and preserves theme/workspace data.
Cancel and Escape leave progress untouched; blocked storage reports an unverified
saved reset honestly. `default-theme.test.ts` checks the head hook and retained
theme toggle in all three course layout families.

`session-alignment.test.ts` protects the revised Week 4 and Week 8 teaching
contracts: a controlled resize comparison, eight scores from four numerical
configurations, named validation controls, and measured toy evidence separated
from an untested FVD proposal. It checks the planning spine against published
descriptions/checklists. These wording and structure checks do not certify
student understanding or replace a human read-through.

The same checks cover Weeks 3 and 7: toy-map versus image-FID naming, the
rotation-only control, population versus estimated quantities, KID's finite
sampling caveats, and the panel's actual d/N settings and three outputs.
`expected-results.test.ts` keeps Week 7's mathematical and observed outcomes
inside its closed fold; `week7.test.ts` retains independent numerical evidence.
The teaching-links browser check runs all three Week 7 settings, checks the
closed fold and dimension resets, and ensures the d = 16 population labels
retain enough precision to distinguish A from B.

Week 5/6 log-handoff checks hold the first recorded FID∞ practice in week 5,
its transfer to candidate D in week 6, separate population/finite/fitted
values, and explicit reasons for missing computations. The log's weight,
deadline and criterion weights remain unchanged; missing required work is not
treated as complete merely because the omission was recorded.

Week 12 checks align the session's eight-minute presentation and four-minute
Part C defence with the final-report brief, preserving the assessment's weight,
deadline and rubric. The final log separates metric scales and fitted/population
values; a synthetic adaptation is not advertised as CLIP-based CMMD. Browser
checks follow the in-person-format link to its actual assessment anchor.
