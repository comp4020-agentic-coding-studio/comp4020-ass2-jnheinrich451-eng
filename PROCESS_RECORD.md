# Process record

The raw, append-only history that `PROCESS.md`'s 400–600 word narrative gets
drawn from. Oldest first. See `.claude/skills/process_record/SKILL.md` for the
format and for how an entry is drawn into the narrative.

---

## 2026-09-03 22:05 — Course record set, and week 5's dangling edges closed

**Prompt:**

> lets build, then pls Read README.md, src/content.config.ts,
> src/course-config.ts, spec/, and scripts/check-evidence.ts. Report four
> things... Modify nothing.
> Set src/course-config.ts: code SLOP8412, level 8, title "Advanced Fréchet
> Inception Distance"... Create the two entries its related: edges need...
> Then make week 5 build and render.

**Result:**
Course record set to SLOP8412 / level 8 / Semester 2 2026 / 2026-08-03 to
2026-10-30, and the `STARTER_CONTENT` marker removed. Deleted the week 5
lecture, created `sessions/02-frechet-distance` and
`assessments/a1-reproduce-the-number` as the two nodes week 5's `related:`
edges point at.

The read pass turned up the fact that shaped the placeholders: session and
lecture pages render only `week`, `title`, `description`, `date`, `spec`,
`teachers` and `related` — the schemas are `.loose()`, so every other key
validates, lands in the API's `meta`, and renders nowhere. The deleted
lecture's `arc`, `one_line`, `required_reading`, `figure` and `assessed_by`
were all invisible on the page. So the placeholders carry only keys that
render, rather than a richer frontmatter that would have looked like content
while displaying nothing.

**Verified:**
`pnpm build` generated `dist/sessions/05-the-bias/index.html` with the heading
`Week 5 Session: The bias`, and grepping the built HTML shows both related
titles present — "The Fréchet distance" and "A1: Reproduce the number" — so
the edges resolve rather than merely validating. Read on the dev server at
`/comp4020-ass2-jnheinrich451-eng/sessions/05-the-bias/` (200).

**Commit:** [`3dde85d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3dde85d)

**What happened:**
The first build failed before any content loaded: the record had `code:
"SLOP8412"` against `level: 1`, and the schema's `superRefine` rejects the
mismatch. Worth noting the check exists — the level is stated twice and the
config refuses to let the two disagree.

The build still exits 1, for a reason that is not content.
`astro-theme-university` calls `execFileAsync("npx", ["pagefind", ...])` in
its `astro:build:done` hook, and on Windows under Node 26 that cannot work:
confirmed directly that `execFile("npx")` gives ENOENT and `execFile
("npx.cmd")` gives EINVAL, since Node refuses to spawn `.cmd` without a
shell. Because `universityTheme` is registered before `courseGraph` in
`astro.config.ts`, the throw takes out courseGraph's hook too, so `dist/api/`
is never emitted and both spec tests — which read `dist/api/index.json` —
cannot run locally at all. Left unfixed rather than patched: the fix would
touch either `astro.config.ts` or `node_modules`, and neither is mine to
change on my own judgement.

## 2026-09-03 22:10 — The crash was hiding twelve a11y violations

**Prompt:**

> then pnpm build exits with 1, if it can be fixed? And if you can give me the
> link of local server?

**Result:**
Gated the theme's pagefind step behind `SLOP_NO_SEARCH` in `astro.config.ts`
rather than turning search off outright. A flat `search: false` fixes the exit
code and silently ships a deployed site with no search index, because CI runs
the same integration; the gate is unset in CI, so only this machine skips it.
This is the one deliberate divergence from the fixed platform and it is
written down in `CLAUDE.md` next to the reason.

The interesting part was downstream. With the build finally getting past that
hook, the axe pass ran for the first time in this repo's life and found twelve
violations: `/assessments`, `/lectures`, `/people` and `/policies` each
rendering with no `<html lang>`, no `<title>` and no landmarks. The theme
installs its default-layout injector as a remark plugin on
`markdown.processor`, and `@astrojs/mdx` does not run that processor — so
every `.mdx` page under `src/pages/` gets no layout, while `.md` pages do.
Fixed with explicit `layout:` frontmatter on all four.

That is not a Windows problem. It would have failed CI for anyone, and it was
invisible only because the repo has never been public and the pagefind crash
aborted the build before the a11y check on this machine.

**Verified:**
`dist/404.html` (a `.md` page) had `<html lang="en">` while
`dist/assessments/index.html` (`.mdx`) had no `<html>` attributes at all —
that pair is what identified the markdown/MDX split rather than a Windows path
bug, which the backslashes in axe's own output had suggested. Patched one page
first and watched the count go 12 → 9 before touching the other three, then
took the build to `Complete!` with `dist/api/` emitted (12 nodes, 7 edges).

**Commit:** [`901d147`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/901d147)

**What happened:**
First diagnosis was wrong and the evidence corrected it. Axe reported the
pages as `/assessments\:` with a trailing backslash, which read as a Windows
path-separator bug leaking into the checker — a satisfying story that would
have meant nothing needed fixing. Reading the built HTML killed it: the files
really were missing `lang` and `title`. The backslash was cosmetic.

Still failing, and correctly: `spec/data-integrity.test.ts` rejects the
starter placeholders still carrying 2027 dates — `assignment-1`,
`final-project`, `lectures/week-01` and `week-02` all fall outside the
2026-08-03 to 2026-10-30 teaching period. That is the shipped check doing its
job on content not yet written, not a defect.

## 2026-09-04 03:30 — The spine lands, and the coherence checks meet the API's actual shape

**Prompt:**

> Read build/SPINE.md. Bring the repo into agreement with it and nothing else
> ... Run pnpm check. Report every failing test with its message. Do not fix
> any of them.

**Result:**
Twelve sessions and four assessments now carry the spine's frontmatter
verbatim; ten sessions and three assessments are new with pending-body
markers, 02 was aligned to the spine's full block (its header says "align to
this", which outranks the narrower "add the listed keys"), 05 gained its three
keys untouched otherwise, and a1 kept its body under replaced frontmatter.
Six starter entries deleted — emptying the lectures collection entirely, which
the build accepts. The user had already renamed the coherence suite to
spec/course-promises.test.ts, verified eight new readings with dates and PDFs,
and written the spine itself.

**Verified:**
pnpm check run in full and captured: typecheck 0 errors, build Complete! with
dist/api/ emitted (16 nodes), data-integrity passes for the first time — every
date now inside 2026-08-03..2026-10-30. course-promises: 4 pass, 5 fail. Then
read dist/api/index.json and a per-node JSON to classify the failures rather
than take them at face value.

**Commit:** [`c942868`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/c942868)

**What happened:**
Committed red, deliberately: two failures are the pending bodies doing their
job. But three of the five are the test reading a shape the API does not
have — `related` and `description` are top-level on an index node, not in
`meta`, and `body` is not in the index at all (per-node JSON only: week 5's
589-word body reads as 0 words from the index). So "no stub weeks" would fail
forever and "duplicate openers" passes vacuously forever. The checks that
protect the course's promises were themselves unverified against the thing
they read. Reported, not fixed, per the instruction.

## 2026-09-04 04:10 — A guard against the checks passing vacuously

**Prompt:**

> Fix it: read related/description from the node, and load each session's body
> from dist/api/sessions/<slug>.json. Add one guard test: 05-the-bias has a
> body over 400 words. If the loader is wrong, that guard fails instead of
> everything passing vacuously.

**Result:**
`related` and `description` now read off the node rather than `meta`, and
bodies load from the per-entry JSON, addressed by the node's own id —
`sessions/05-the-bias` is already the path `dist/api/sessions/05-the-bias.json`,
so no slug parsing is needed.

The guard is the part worth keeping. Four assertions in this file read prose,
and a loader that silently returns `undefined` splits them: the word-count and
recurrence checks fail forever, which is loud, but "never opens two sessions
with the same sentence" *passes* forever, which is silent. A green suite that
checked nothing is worse than a red one. The guard asserts the one body that
exists reads over 400 words, so the failure surfaces at the loader rather than
as four unrelated symptoms.

**Verified:**
Not by the guard turning green on its own — that only proves week 5 parses.
The evidence is that every prose failure moved in the direction a working
loader predicts: the stub check reads 4 words where it read 0, the bench
check finds 1 session where it found 0, and the duplicate-opener check has
stopped passing and now names nine identical `<!-- body pending -->` markers.
Reading nothing cannot produce those numbers. 10 tests, 6 pass; the 4 failures
are the unwritten bodies and nothing else.

**Commit:** [`224688b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/224688b)

**What happened:**
Nothing was flagged, but the duplicate-opener check had been green in the
previous run and was green for the wrong reason — `undefined` bodies gave it
twelve empty strings, and its own filter discards falsy openers. It went red
the moment the loader worked. A check can be both passing and worthless, and
the only way I found that one was reading the API's actual shape rather than
trusting the colour.

## 2026-09-04 05:05 — Both [verify] claims checked, and one of them was wrong in a way that mattered

**Prompt:**

> there is a new instruction CONTENT.md, please verify the [verify] parts
> according to the assets papers!

**Result:**
Two markers, both on Stein et al. 2023, both resolved against the PDF in
`assets/` rather than from memory.

Week 10's guess was right: DINOv2-ViT-L/14, metric written FD_DINOv2,
leaderboard in Appendix E, with B/14 recommended during development at roughly
a quarter of the compute.

Week 9's was right in its label and misleading in its phrasing. "Two-
alternative forced choice on realism" reads as a pairwise comparison. The
actual design shows one image per trial, from a model or from the training
set, and asks real or fake; models rank by human error rate. The two
alternatives are the responses, not two stimuli. A student handed the original
line would have designed the wrong study in week 9's exercise, and the label
was accurate enough that nothing downstream would have caught it.

**Verified:**
The Read tool refused the PDF as password-protected. `pypdf` opened it with
`is_encrypted: False`, so the protection was a tooling artefact rather than a
fact about the file — worth checking before accepting a tool's account of a
document. Extracted all 53 pages to text, indexed the method terms by page,
and read §3 in full for the design and Appendix D.2/D.3 for the encoder
recommendation, quoting rather than paraphrasing where the wording carries the
claim.

**Commit:** [`0e76430`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/0e76430)

**What happened:**
Reading the whole paper rather than the two sentences under the markers turned
up something neither marker asked about. In Appendix D.3 the authors
"recommend using FD as-is given that its use is already widespread": they
change the instrument and keep the distance, on the grounds that a bias
behaving similarly across generated datasets cannot affect model rankings.
That is exactly the assumption week 5 spends its session denying, via Chong
and Forsyth's per-model slopes, and the authors concede both hypotheses are
unproven. It reframes week 11 — the strongest case for keeping the score comes
from the paper that exposed its flaws, not from inertia. Reported and left to
the author's judgement rather than written into the spine.

I also offered to add `stein-2023` to `readings.ts` and it was already there;
the offer was made without checking. Fixed its venue from NIPS to NeurIPS,
which the file's own 2019 entry already spells correctly.

## 2026-09-04 04:36 — Weeks 1 and 2, and a screenshot that lied about the phone

**Prompt:**

> Draft bodies for sessions/NN and sessions/MM ... In the session template,
> render three things from frontmatter. A metadata strip above the title ...
> A reading block after the body ... Check both viewports.

**Result:**
Week 1 as an audit of a published results table, week 2 as a derivation, 477
and 464 words. Naming each shape before writing is what kept them apart: week
5 is already a demonstration on the bench, so a third week opening with "take
the bench and score it" would have read as a template even with different
facts in it.

The template work is where the placement problem was. "Above the title" is not
available to a component rendered in the layout's default slot, because
`ContentLayout` emits `<h1>` first. Rather than fork the layout, I read the
theme's CSS: `.at-main` is a grid with `grid-template-columns: subgrid` and
auto-placed children, and `order` governs auto-placement, so `order: -1` lifts
the strip into the first row with the layout mode untouched. Forking the
layout would have meant reimplementing the hero and lead handling to move one
line of markup.

`Readings` throws on a key with no entry, naming it. That makes a citation
pointing at nothing the same class of error as a dangling `related:` ref,
which the build already refuses.

**Verified:**
Both viewports through the DevTools protocol with real device metrics, not by
eye: `scrollWidth` equals `clientWidth` at 390x844 and at 1920x1080, with zero
elements extending past the client width. Strip above the h1 at both (top 153
against 269 and 251), one line at 1920 and two at 390 with the arc below,
Roboto Mono, `tabular-nums` computed. The missing-key guard tested by pointing
week 1 at `heusel-2018` and confirming the build failed with that key in the
message, then restoring.

**Commit:** [`fed617d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/fed617d)

**What happened:**
I read a screenshot as a defect it was not. A `--window-size=390,844` capture
showed the body text sliced off at the right margin, which looks exactly like
a `white-space: nowrap` strip forcing the page wider than the viewport — and I
had just written one. The check that settled it was shooting a page I had not
touched: `/assessments/` was cropped identically, so the cause could not be my
CSS. Measuring through CDP then showed no overflow at all. The lesson is the
same one as the stale dev server two turns ago: a rendering I did not produce
under controlled conditions is not evidence. The CDP script is kept in the
scratchpad and is now how viewports get checked.

Also caught in the rendered page rather than the diff: `Heusel, M. et al..`,
a doubled full stop from appending a separator to an author field that already
carried one. It reads fine in the source.

## 2026-09-04 05:22 — The week 2 deck, and a measurement that was wrong twice

**Prompt:**

> Write src/decks/week-02.deck.mdx from the outline in my message ... First
> check whether the README documents maths rendering and tell me ... open the
> deck at 1920×1080 and 390×844, and report any slide where text wraps to more
> than four lines or an equation overflows.

**Result:**
Twelve slides, one derivation step each. astromotion documents no maths
rendering, and neither it nor the theme has KaTeX, MathJax or remark-math
anywhere, so equations are Unicode and the two slides that would genuinely
need a figure — the coupling space, and the restriction to jointly Gaussian
couplings — say so in their speaker notes rather than pretending prose covers
it.

The README also turned up `astromotion-check`, a purpose-built per-slide
overflow checker, and the fact that decided the viewport question: Reveal
scales a fixed 1280×720 canvas. Wrapping is therefore a property of the canvas
and not of the viewport, which I measured at both sizes rather than asserted.

**Verified:**
Per-slide measurement through CDP at 390×844 and 1920×1080: identical line
counts at both, worst case 2 lines against a limit of 4, and no element past
the canvas edge on any slide. The deck link checked in the built HTML rather
than assumed — `/decks/week-02/` with "Open the slides" on the lecture page.
A missing-key style trap does not apply here, but the build's own deck check
reports no structural violations.

**Commit:** [`e912a2b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/e912a2b)

**What happened:**
The first measurement run was wrong and the second was wrong differently. I
divided each block's `getBoundingClientRect().height` by its computed
`line-height`, but Reveal applies a CSS transform to the canvas, so the rect is
scaled and the line-height is not. At 1920 the scale is about 1.5 and the
numbers looked plausible; at 390 the scale is about 0.3 and every slide
reported 0 or 1 lines, which is what exposed it. Plausible-looking output at
one viewport would have shipped unexamined if I had not run the second.
`offsetHeight` is layout px and ignores the transform, and with that the two
viewports agree exactly, which is itself the evidence the canvas claim is
true.

Two other things the rendered page caught that the source could not. `^½`
renders in Public Sans as a glyph that reads as logical-and, so
`(Σ₁Σ₂)^½` looks like a boolean expression; the deck now uses `<sup>`. The
same caret is still in the week 2 session body, flagged and left alone since
that file was reviewed in an earlier turn.

The instruction assumed a lecture entry that does not exist: bringing the repo
to SPINE.md deleted every lecture, and SPINE.md defines none. I created a
minimal week 2 lecture so the deck is reachable at all and spec line 3 can be
met, and flagged it as a spine decision rather than folding it in silently.

## 2026-09-04 06:51 — The figure that refused to say what the brief expected

**Prompt:**

> write the four figure scripts described in build/CONTENT-deck.md under ### 2
> The Frechet Distance ... fid-vs-invN.py must also print the N at which the
> A/B ordering flips, or state that it did not flip. Then restructure the
> week-02 deck ... Report each slide at 390×844.

**Result:**
Four scripts under `figures/`, one shared `_style.py` for the transparent-SVG
export and a palette that has to survive both the site's cream and the deck's
black. The deck restructured around them: centered heading-size equations,
fragments on 6–8, spoken sentences moved into notes, and a footer set once as
`--deck-footer` and drawn on `.slides` rather than repeated on twelve slides.

The deck also moved off its own lecture entry and onto the session, which is
the course's actual teaching unit. The session template validates the
`/decks/<slug>/` shape itself, because `sessions` is a loose schema and will
not enforce what `lectures` does.

**Verified:**
Every slide measured at 390×844 and against the 1280×720 canvas: all twelve fit
exactly, worst case 2 lines against a limit of 4. Build clean, 26 pages, no
a11y violations, no deck structural violations. The figure checked on the
rendered slide rather than in the file, which is where the footer and the
colours on black could be confirmed.

**Commit:** [`3c9eb4b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3c9eb4b)

**What happened:**
`fid-vs-invN.py` produced a figure that was wrong while looking finished. I
fitted the 1/N line through all seven sample sizes, three of which sit below
d = 2048, where the sample covariance is rank-deficient and the 1/N law has
not started. The fit was clean, the plot looked right, and the intercepts came
out at 180.6 and 188.8 against true values of 5.12 and 4.88 — wrong by a factor
of 35. Nothing about the picture said so. What caught it was checking the
intercept against a number I already knew from `bench-truth.py`, which is the
only reason the two scripts print their values at all. Fitting only N > d
gives 5.145 and 4.882, errors of +0.025 and +0.003, and that restricted fit is
FID∞ three weeks before week 5 names it.

The result itself contradicts the brief. `CONTENT.md` predicts the ordering
inverting below N ≈ 5,000 and righting itself above; it does neither. It is
wrong at every N measured, because an isotropic bench in d = 2048 puts equal
variance in all 2048 directions and the bias reaches +42 where the true gap is
0.24. Reported rather than tuned into agreement: CONTENT.md's own line is that
if it does not invert, the constants change and not the story, and choosing
those constants is the author's call.

Two smaller things. I misread scaled geometry twice more — first calling the
figures too small at ~100px when `getBoundingClientRect` was reporting canvas
px scaled by 0.305, so they were really ~400px. The lesson from the last deck
turn did not transfer because I wrote a new script instead of reusing the one
that had already been corrected. And the ImageNotFound the author hit in the
browser was `savefig` truncating its target before rewriting it; `save()` now
writes to a temp file and `os.replace()`s it, so a watching dev server sees
either the old figure or the new one.

## 2026-09-04 07:14 — Weeks 3 and 4, and a hedge that stops at the frontmatter

**Prompt:**

> Draft the bodies of sessions/03-the-instrument and sessions/04-getting-it-right
> ... Week 3 coins "the instrument" and it must be introduced as a term, in
> bold, once. Week 4: write "several public implementations", not "four".

**Result:**
440 and 412 words. Naming the shape before writing is doing real work now that
four weeks exist: week 3 argues from provenance and week 4 from readings that
end in a rule, so neither collapses into week 5's demonstration or into week
1's audit. Week 3's opening had to avoid being a definition, which is awkward
for a session whose subject is a definition; opening on loading the network
and asking what it was trained for keeps it an action.

Every paper claim is attributive rather than asserted — "Bińkowski and
colleagues note", "Kynkäänniemi and colleagues report", "Parmar and colleagues
report". That is the hedge the prompt asks for, and it also means a claim can
be tightened against the PDF later by changing one clause instead of rewriting
the sentence around it.

**Verified:**
Constraints checked mechanically rather than by rereading: `git diff --numstat`
plus a grep for frontmatter keys confirms zero frontmatter lines changed in
either file; the bold term appears exactly once; zero em dashes in either body;
both end on the exercise. pnpm check: 0 errors, 26 pages, no a11y violations,
6 tests pass and the 4 failures are the six remaining pending bodies.

**Commit:** [`4a0d57b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/4a0d57b)

**What happened:**
I wrote "several public FID implementations" where the instruction said
"several public implementations". The hedge was satisfied in substance and the
wording was not, which my own grep for the exact phrase caught by returning
zero. Worth noticing because the check that found it was one I ran to prove
compliance, not one I expected to fail.

The hedge also does not reach where it most needs to. Week 4's frontmatter
description still reads "four public implementations, four different numbers"
— the exact claim the prompt asked to avoid, sitting in the text that renders
under the title and ships in the API, while the body underneath says
"several". Frontmatter was out of scope for this turn, so it is reported
rather than fixed.

Weeks 3 and 4 declare no reading keys in SPINE.md, so three papers are named
in prose and the reading block the template renders is empty on both pages.

## 2026-09-04 20:18 — A capital R that YAML was happy to accept

**Prompt:**

> pls update build/SPINE.md with the corrected week 4 description and the
> reading keys in the table I'm pasting. Then bring every session file's
> frontmatter into agreement with the spine — those two fields only, nothing
> else.

**Result:**
The week 4 description and the table were already in SPINE by the time I read
it. What was not: SPINE's own per-session yaml blocks carried reading keys for
four of twelve sessions while the table specifies all twelve, so the file
disagreed with itself and there was no single thing to bring the session files
into agreement with. Parsing the table as the authority and rewriting both the
blocks and the files from it makes that disagreement impossible rather than
merely resolved this once.

Wrote it as a script rather than twelve edits, so "those two fields only" is a
property of the code: it strips the two keys and reinserts them after `arc:`,
and every other line passes through untouched.

**Verified:**
Not by rereading the files. `git diff --stat` reports 13 changed lines across
eight files with zero deletions, and every changed line matches
`^[+-](required_reading|further_reading):`, so the "nothing else" claim is
mechanical rather than a promise. A separate pass confirms all twelve files
agree with the table row by row, and that the ten keys in use resolve in
readings.ts with none unused.

**Commit:** [`25c237e`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/25c237e)

**What happened:**
`08-video.md` carried `further_Reading:` with a capital R. YAML treats that as
a different key entirely, so it validated, passed through the loose schema
into the API's `meta`, rendered nowhere, and read like a working declaration
in the source. My first sweep matched keys case-sensitively, skipped it, and
added the correctly-cased key beside it, leaving the file with both.

What caught it was the arithmetic, not the reading: the diff reported 14
insertions where the reading keys accounted for 13. One unexplained line was
enough to go looking, and a case-insensitive sweep over all twelve sessions
found that one and no others. Counting what changed is a cheap check that does
not depend on my having looked at the right file.

A regex of mine also cried wolf: `[a-z]+-\d{4}` cannot match the second hyphen
in `chong-forsyth-2020`, so a verification script reported an unresolved key
that was fine. The build is the check that matters for this, since
`Readings.astro` throws on an unresolved key and names it, and it is green.

## 2026-09-04 21:18 — Weeks 6 and 7, and two checks that started moving

**Prompt:**

> Draft the bodies of sessions/06-blind-spots and sessions/07-dropping-the-gaussian
> ... Week 6 has no required reading; the argument is candidate C and its FID of
> exactly zero. Week 7 must explain WHY KID's estimator is unbiased where FID's
> is not, in two sentences a student could repeat.

**Result:**
390 and 416 words. Week 6 is a construction and week 7 a comparison, and the
distinction that took the most care is the one week 6 exists to teach: week 5
is the estimator failing, right quantity and wrong number, while week 6 is the
quantity failing, right number and wrong thing measured. Writing that
explicitly rather than leaving it implied is what A2 later grades on.

The two sentences on KID were the constraint worth designing around. They sit
under their own heading so a student revising can find them, and they avoid
naming U-statistics: an average of unbiased terms is unbiased, and the
expectation of a nonlinear function is not the function of the expectation.
That is repeatable without notes, which was the actual requirement.

Week 6 cites nothing, as instructed. Candidate C's exact zero is the argument,
and a subsample of R scoring zero as well is what turns it from a curiosity
into a class of failure.

**Verified:**
Frontmatter untouched, measured as zero changed lines matching the frontmatter
keys. Zero em dashes in either body. Both end on the exercise. The checks
themselves moved in the predicted direction, which is the useful signal: the
bench went from five weeks to seven, N-honest from zero later weeks to two,
and the stub failure walked from week 6 to week 8.

**Commit:** [`8078328`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/8078328)

**What happened:**
Nothing was flagged, but one thing is worth recording about the checks. Both
accumulation tests are still red, and both are now red by a margin of one:
N-honest needs three later weeks and has two, the bench needs eight and has
seven. Weeks 8 to 12 will clear them without any special effort, which means
neither test is currently telling me anything I would not otherwise know. They
were written to catch drift across twelve finished weeks, and they only start
being informative once the twelve exist. A check that cannot fail informatively
until the end of the work is worth keeping, but it is not backpressure yet.

## 2026-09-04 21:41 — Weeks 8 and 9, and a spec line with nowhere to live

**Prompt:**

> Draft the bodies of sessions/08-video and sessions/09-human-evaluation ...
> Week 8: Unterthiner is a workshop paper; say so. Do not name a specific
> temporal failure; frame invisibility as a property of the instrument.
> Week 9 must contain a costed number in hours and dollars, and must say
> plainly that the bench has no images.

**Result:**
375 and 411 words. Week 8 is short because its argument is inheritance: swap
Inception-v3 for I3D and the instrument changes while the estimator does not,
so week 5 transfers whole and there is little left to say. Week 9 is the only
session whose output is a protocol and a budget rather than a number, and the
first with no closed form in it at all.

The costed example is worked rather than asserted. Separating two candidates
half a percentage point apart in human error rate, at eighty percent power,
needs about 130,000 trials each, near 290 hours of paid attention and about
7,200 dollars. I checked that against scipy rather than doing it in prose,
because a number invented to sound expensive would be exactly the kind of
claim this course spends twelve weeks objecting to.

**Verified:**
Frontmatter untouched, zero em dashes, both ending on the exercise, all
measured rather than reread. The instruction not to name a temporal failure
checked by grepping the body for the obvious candidates and finding none. The
power arithmetic recomputed with scipy: 131,861 per group against the 130,000
in the prose, 293 hours against 290, 7,326 dollars against 7,200, so the
rounding in the text is honest in the right direction.

**Commit:** [`9859e8f`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/9859e8f)

**What happened:**
The instruction and the spec collided. Week 8's second spec line says the
student "can name one temporal failure that leaves the score unchanged, and
show it", while this prompt forbids the page from naming one, and CONTENT.md's
exercise is the re-run paragraph rather than a construction. Written as
specified, the page would have satisfied the prompt and quietly abandoned a
spec line the marker reads.

Reconciled instead of chosen between: a "Before the session" line asks students
to bring a failure they believe the features would not register, together with
the experiment that would settle it. The student names one, the page names
none, and the spec line has a home. That is also the better teaching move,
since a named example on the page would be the answer handed over.

Both accumulation checks went green this turn, having been red by one last
turn, exactly as predicted. That confirms what I recorded then: they were not
providing backpressure, they were counting down.

## 2026-09-04 22:05 — Weeks 10 and 12, and a compliance grep that lied twice

**Prompt:**

> Draft the bodies of sessions/10-correlation and sessions/12-what-you-would-report-instead.
> Week 10 rests on Stein's finding that no tested metric strongly correlated
> with human judgement; that sentence may be stated flat, it is verified.
> Week 12 is the only week allowed a forward-looking paragraph, and it gets
> exactly one.

**Result:**
408 and 459 words. Week 10 states Stein's finding flat, since it was verified
against the PDF three turns ago, and everything else in the week is what
follows from it. The part worth the care is setting their own recommendation
against week 5: they keep FD as-is partly on the ground that a bias behaving
similarly across datasets cannot move a ranking, and that is precisely what
Chong and Forsyth's differing per-model slopes deny. They call it unproven, so
the session leaves it open instead of scoring a point.

Week 12 judges CMMD by the course's four criteria, then says before the
presentations rather than after that most proposals will fail on the last one.
Its single forward-looking paragraph sits under its own heading so the
constraint is visible in the structure and not just honoured in the prose.

Week 10 also refuses the bench, which no other week does: a correlation study
needs people, and saying why the running artefact cannot stand in is part of
the exercise.

**Verified:**
Frontmatter compared block-for-block against HEAD rather than eyeballed:
identical in both. Zero em dashes. The Stein sentence located by normalising
whitespace across the whole file. Week 12's forward-looking section printed in
full and read, one paragraph.

**Commit:** [`c864355`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/c864355)

**What happened:**
Both compliance greps were wrong, in opposite directions, and neither failure
was about the writing.

The frontmatter check reported one changed line. The pattern was
`^[-+](title|week|date|...)` and it had matched a body line that begins "week
9. The bench cannot stand in for this one" — a false positive from a regex
written to match keys but anchored loosely enough to match prose. The
Stein-sentence check reported the required sentence missing, because the
sentence is wrapped across two lines and grep works a line at a time. One
check cried wolf and one declared a satisfied requirement unmet.

The fix in both cases was to check the thing rather than a proxy for it:
compare the parsed frontmatter blocks, and normalise whitespace before
matching prose. Worth recording because these greps exist to make compliance
mechanical, and a mechanical check that is wrong is more dangerous than no
check, since its output looks like evidence.

One body left, week 11, deliberately skipped. The suite is down to a single
failure naming it.

## 2026-09-04 22:20 — Week 11, and the suite goes green

**Prompt:**

> Draft the body of sessions/11-why-it-persists ... This is institutional
> analysis written completely straight. Make the strongest honest case FOR
> continuing to report the score. If a sentence comments on the course, the
> university, or itself, cut it. No irony.

**Result:**
412 words, and the only session that argues for the score. The constraint that
shaped it was "strongest honest case": a weak version of this week would
concede the argument while pretending to make it, and the tell would be irony.
So the case is built on coordination rather than accuracy, which is the ground
on which it actually wins. Nine years of results carry the row. Asking for it
costs a reviewer nothing and answering costs an author one evaluation run.
Recomputing baselines under a different metric is a public good, and public
goods are underproduced.

Kynkäänniemi's class-histogram result is placed inside that argument rather
than against it: the result is published, cited, and has not displaced the
metric, which is evidence for the week's thesis rather than an objection to
it. Writing it as a scandal would have been the easy version and the wrong
one.

The bench closes where it opened. A is 5.12 and B is 4.88, unchanged since
week 1, which states the week's argument as a measurement instead of a claim.

**Verified:**
Frontmatter compared block-for-block against HEAD, identical. Zero em dashes,
ends on the exercise, bench numbers present. Then the whole suite: 10 of 10
passing for the first time, including both accumulation checks and all three
no-repetition checks, with the build clean at 26 pages and no accessibility
violations.

**Commit:** [`16484d9`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/16484d9)

**What happened:**
Nothing was flagged. Two things are worth recording now that all twelve exist.

Week 5 is 589 words against a stated range of 350 to 500, and it is the only
session outside it. It was written before the range was set, and it is the
reference the other eleven were told to match for register, so every later
week matched its voice while none matched its length.

And the suite being green says less than it looks like it says. Eight of the
ten checks are structural and were satisfied the moment twelve files existed
with the right frontmatter. The two that could have caught drift, N-honest
recurring and the bench returning, are threshold counts that fill up as weeks
are written, so they went green by accumulation rather than by judgement. No
check in this repo can currently tell a week that carries the argument forward
from a week that merely contains the right words, which is the thing the
brief's response criterion is actually about.

## 2026-09-04 22:53 — A1 written as a sheet, not as a description of one

**Prompt:**

> we build the A1-spec, which imitates a real assignment! ... [numbered
> conditions, Part A 30, Part B 50, Part C 20, in person week 6]

**Result:**
449 words. The instruction that mattered was "imitates a real assignment",
which is a claim about form rather than content. A real sheet states its
conditions before its tasks, puts points in the headings, names artefacts with
their limits, and says what to bring to the defence. A description of an
assignment explains all of that in paragraphs. The difference is whether a
student can act from it without reading twice.

The three parts carry the weights already in the frontmatter's marking block,
and the page says so explicitly, so the criteria table the template renders
below reads as the same three parts rather than as a second scheme sitting
beside them.

Two lines from CONTENT.md were folded in where they belong rather than
appended: matching the reference set, N and instrument weights where possible
went into Part A, with the note that where you cannot match, that is Part B's
material rather than a failure; and the "assumptions are visible" line went
into Part B, which is the part it describes.

**Verified:**
Frontmatter compared block-for-block against HEAD, identical. Zero em dashes.
Both the three parts and the three marking criteria confirmed present in the
built HTML, since the risk with duplicated weights is that only one of them
renders. Suite still 10 of 10, build clean.

**Commit:** [`68b9501`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/68b9501)

**What happened:**
The brief contradicts the course's own policies page, and I wrote it as given
rather than smoothing it. The policies draft says late work is marked as
submitted with the lateness recorded against the entry; this brief says late
submissions are not accepted and the entry is recorded as absent. Both cannot
hold, and a marker who reads the policies page and then an assessment page
will hit it. It is the author's call which survives, so it is reported rather
than reconciled by me.

CONTENT.md's A1 entry also still specifies a notebook plus a two-page report,
where the brief asks for a four-page PDF and an archive. The brief is newer
and explicit, so it won, but CONTENT.md is now stale on that line.

Both are the same class of thing: this site is now large enough that a fact
can be stated in three places, and nothing in `spec/` checks that they agree.
The dangling-ref check catches a broken link between pages; nothing catches a
broken agreement between them.

## 2026-09-04 23:03 — The first check that can catch drift rather than count it

**Prompt:**

> Two contradictions to resolve structurally. (1) Lateness: the canonical
> sentence is [paste] ... Then add the two agreement tests I'm pasting to
> course-promises.test.ts, working out where the policies body lives in the
> build output. Run pnpm check; the tests should pass only after the edits, so
> run them once before editing and tell me they failed.

**Result:**
The instruction to run the tests before editing is the whole point of the
turn, and it worked: both failed, on the two different causes they were
written for. The policies page did not contain the rules, and no assessment
linked to it. A test written after the fix would have passed immediately and
proved nothing about itself.

Finding where the policies body lives took reading rather than guessing. It is
an ordinary page copied into the API as its own collection by
`courseApiCollections`, so its node id is `policies/index` and the same
per-entry path the sessions use addresses it.

The link line went onto all four assessments, not just A1. Three still hold
pending bodies, and adding it now means the rule is a property of the
collection rather than of the one entry that happened to be written first.

**Verified:**
Tests run before the edits and reported failing, then after and reported
passing, 12 of 12. The base-path rewrite on the new markdown links checked in
the built HTML: `/policies/` becomes
`/comp4020-ass2-jnheinrich451-eng/policies/`, which matters because a
root-absolute link that works locally and 404s on the deployed URL is exactly
the failure the README warns about.

**Commit:** [`0c29cbd`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/0c29cbd)

**What happened:**
The canonical sentence was never pasted; `[paste]` arrived as literal text.
The regexes in the tests pinned the required phrases, and the A1 brief had the
newer wording of the two contradicting texts, so I wrote the sentence from
those and said so rather than stopping. The prompt also assumed the policies
page existed to move rules onto; it was still the starter placeholder, so the
rules had no canonical home until this turn made one.

This is the first check in `spec/` that can catch drift rather than count up
to a threshold. The others go green when twelve files exist; this one goes red
the moment a rule is copied into a brief instead of linked, which can happen
at any point and is invisible in a diff of one file. That is the gap I named
two turns ago, and it is now closed for three rules. It is not closed for
anything else two pages both assert.

## 2026-09-04 23:07 — A2, and the check earning its keep the turn after it was written

**Prompt:**

> And next the A2: [full brief, including "Grace period: 12 hours. Late
> submissions are not accepted" and "must be disclosed, with prompts"]

**Result:**
428 words, in A1's shape. The interesting part was not the writing.

The brief as pasted restated the three rules that were made canonical on the
policies page one turn earlier, which is exactly the drift the agreement test
was written to stop. Copying the paste faithfully would have reintroduced the
contradiction we had just spent a turn removing, and the test would have gone
red on a body that looked correct in isolation. Both sentences became links to
/policies/ instead.

That is the check doing the thing threshold counts cannot: catching a
regression that arrives from outside, in a single file, one turn after the
decision it violates. The test was green before this turn and would have been
red during it.

Part B carries CONTENT.md's reason for preferring quantity breaks over
estimator breaks, which the pasted brief did not include: a broken estimator
can be repaired by measuring more, and a broken quantity cannot be repaired at
all.

**Verified:**
Frontmatter compared block-for-block against HEAD, identical. Zero em dashes.
The three forbidden phrases checked for individually and absent, two policies
links present. Both the three parts and the three marking criteria confirmed
in the built HTML. Suite 12 of 12, build clean.

**Commit:** [`c30c7ac`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/c30c7ac)

**What happened:**
Nothing was flagged, but a wording inconsistency in the frontmatter is worth
recording before it hardens. A2's second marking criterion reads "the
mechanism, stated in terms of the estimator or the instrument". Week 6,
CONTENT.md and the brief itself all say the estimator or the **quantity**, and
the instrument is week 3's term for the network. A student reading the
criteria table beside Part B is told to pick between two different pairs of
things. Frontmatter was out of scope for this turn, so it is reported rather
than fixed, but it is the same class of defect the agreement test now catches
for rules and does not catch for vocabulary.

## 2026-09-04 23:15 — A pin that could not fail

**Prompt:**

> Add the vocabulary test I'm pasting; run it before any other edit and tell me
> whether the pin line fails.

**Result:**
It did not fail, and the reason is the finding. `estimator or the instrument`
sits in `meta.marking.criteria`, and the pasted test reads `n.description` and
`n.body`. The phrase was live in the API and rendering on the A2 page, and the
assertion written to catch it returned green on the first run against unedited
content.

Proved rather than argued: printed the A2 node showing the phrase absent from
description and body and present in the criteria names. Then widened the pin
to include criterion names, which are prose a student reads even though they
arrive through `meta`, and demonstrated the difference by reverting the data
fix under the new test. Red without it, green with it.

The rest followed: A2's criterion brought into line with SPINE, both home-page
sections replaced with the CONTENT.md copy, the last two assessment bodies
drafted with policies links where the lateness lines would have gone, and both
starter people deleted with their portraits.

**Verified:**
pnpm check 13 of 13, build clean at 24 pages with no accessibility violations
after the two people pages went. check:evidence run and read line by line
rather than by exit code.

**Commit:** [`390f6be`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/390f6be)

**What happened:**
This is the second time in three turns that a check has been green for the
wrong reason, and the pattern is now clear enough to name. A check is written
against a mental model of where the data lives. When that model is wrong the
check does not error, it passes, and a passing check is read as evidence that
the thing it names is true. The duplicate-opener test passed vacuously because
bodies were undefined; this one passed vacuously because criterion names are
not body text.

Both were caught the same way: by asking what the check would have to see in
order to fail, and then checking that it can see it. That question is cheap
and I did not ask it the first time. It is now the thing I do before trusting
any assertion I add here.

The instruction was "the only evidence failure should be key imagery", and it
is not quite that. Three imagery failures remain, as expected: `card.png`,
`hero-home.avif`, and the `STARTER_CONTENT` marker in `index.astro` that
belongs to the hero artwork rather than to the copy I replaced. But
`PROCESS.md` is still the starter template with its two invented citations,
and that is the author's own account to write rather than mine.

## 2026-09-04 23:24 — The final report, and a spec line that lists three of four

**Prompt:**

> we proceed on Final report ... [full brief, Part A 25, Part B 45, Part C 30]

**Result:**
385 words, in the shape A1 and A2 established. The brief again carried the
lateness, grace-period and disclosure sentences, which is the third pasted
brief in a row to do so, and they became links to /policies/ again. That is no
longer a surprise catch; it is the expected behaviour of a structure holding
against a habit, and the test would have failed the commit if I had let them
through.

**Verified:**
Frontmatter compared block-for-block against HEAD, identical. Zero em dashes,
two policies links, all four forbidden phrases absent including the vocabulary
one pinned last turn. Parts and criteria both confirmed in the built HTML.
pnpm check 13 of 13, build clean at 24 pages.

**Commit:** [`6654ea0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/6654ea0)

**What happened:**
A discrepancy between the brief and the frontmatter spec, in the direction
that costs a student marks. Part B asks for four things: estimator bias from
week 5, blind spots from week 6, human correlation from week 10, and cost to
an adopting paper from week 11. The spec line renders below the brief on the
same page and lists three of them. It omits cost.

Cost is week 11's entire subject, it is the criterion the brief says most
proposals fail on, and Part B is forty-five points. A student who reads the
spec as the contract, which is what the theme's SpecList tells them it is,
would treat the most likely failure mode as optional. Reported rather than
fixed, since frontmatter is the author's.

Worth noting the verification caught nothing wrong this time and still earned
its place: the middle marking criterion did not match my grep of the built
page, which looked like a rendering failure and was an apostrophe encoded as
`&#39;`. Two turns ago I would have reported that as a defect.

## 2026-09-04 23:28 — The measurement log, and the last brief

**Prompt:**

> short measurement log: [three conditions, completeness half the mark, the
> other half for discrepancies written down rather than tidied] ... This one is
> easier

**Result:**
189 words. It was easier, and the temptation was to pad it up to the length of
the other three. A brief whose content is three conditions and one standard
should be three conditions and one standard, and giving it Parts and an
in-person section to match its neighbours would have been shape borrowed
rather than earned.

One addition to the brief as given: a correction belongs in the week you found
it rather than the week you were wrong, because a log rewritten to be right
stops being a record of what you knew when. The brief implies that in asking
for discrepancies untidied, but a student can honour "write down the
discrepancy" and still go back and fix the earlier entry once the cause is
known, which destroys the thing the mark is for.

**Verified:**
Frontmatter identical to HEAD, zero em dashes, one policies link, none of the
three forbidden phrases. Both marking criteria confirmed in the built HTML.
pnpm check 13 of 13, build clean at 24 pages.

**Commit:** [`fdb7244`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/fdb7244)

**What happened:**
Nothing was flagged. A third spec-line discrepancy though, and they are now a
pattern rather than three incidents. This one asks that every number carry its
N and its implementation; the brief above it and the policies page both ask
for three things, the reference set included.

That is the same shape as the final report listing three of Part B's four
criteria, and as A2's marking criterion naming the wrong pair of layers. In
each case the frontmatter was written before the prose it now sits under, and
the prose moved. The `spec:` block renders under the brief as the fixed
contract a marker checks, so where the two disagree, the more binding-looking
text is the stale one.

All four assessment briefs and all twelve sessions now exist. The checks that
would catch this class of drift do not exist: the agreement test covers three
named rules, and nothing compares a spec line against the brief it sits under.

## 2026-09-04 23:43 — The artwork made downstream of the numbers

**Prompt:**

> Add --hero and --card modes to figures/bench-truth.py and figures/fid-vs-invN.py
> ... Run pnpm check:evidence; the only remaining failures should be PROCESS.md.

**Result:**
The starter's two images are now rendered by the two scripts that compute the
things they depict. That is the point of doing it this way rather than drawing
something: the hero shows 5.12 and 4.88 because `bench-truth.py` computed them
from the closed form on the same run, so the artwork cannot drift from week 2.
The card reads the course code and title out of `src/course-config.ts` for the
same reason.

Both use the deck's real monospace. Astro caches Roboto Mono under
`.astro/fonts` as woff2, which matplotlib cannot read, and fontTools converts
it once into a ttf. The loader falls back to a generic mono and says so, since
a figure quietly rendered in the wrong face is the kind of thing nobody
notices until it is printed.

`fid-vs-invN` now caches its measured rows. The sweep is 206 seconds and
redrawing is instant, and separating them means an artwork change costs no
re-measurement and cannot silently alter a number. The card rendered in 0s
from that cache.

**Verified:**
Both images opened and read rather than trusted: the AVIF at 2400x800 and the
PNG at 1200x630, checked as pictures for legibility, not just for dimensions.
The first hero was left-heavy with an empty right third, because 24x8 inches
is a 3:1 frame and the data limits were 4:1, so the equal-aspect axis padded
the difference. Fixed by matching the ratios. pnpm check 13 of 13, build clean
at 24 pages with no accessibility violations.

**Commit:** [`1246da9`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/1246da9)

**What happened:**
Three things the instruction did not mention and one of them mattered.

`course_record()` returned `code: 'custom'` on its first run. The regex found
`code: "custom"` inside a zod `addIssue` call further up `course-config.ts`
before reaching the course record, and returned a card that would have shipped
with the wrong course code on it. Caught only because I printed what the
helper returned instead of assuming it had worked. Scoped to the `courseMeta`
block now.

The hero's alt text still described "a lecture theatre reduced to flat gold
and black shapes", which is not what the image is any more. The starter marker
asked for the artwork *and its alt text*, and removing the marker without
rewriting the alt would have left a page whose only description of its own
image was wrong. Nothing in the build checks that, because axe can see that an
alt exists and cannot see that it is false.

`figures/__pycache__` had been committed several turns ago and I had not
noticed. Untracked, with a `.gitignore` covering it and the two new derived
directories.

## 2026-09-05 00:13 — Two people, written to the template rather than to the brief

**Prompt:**

> And for peoples! [Helen Sandoval, Tomasz Wierzba] ... and if you can tell me
> about where should I paste avatar later? The directory.

**Result:**
Both entries written, prose as given. The work was in the frontmatter, and
reading the two templates first is what kept it from being wrong.

The brief gives the roles as "Convenor and lecturer" and "Tutor and bench
maintainer". Setting `role` to those strings validates, because this repo's
`content.config.ts` declares role as a free string. Both templates then switch
on `convenor|tutor|guest|other` to choose a display label and a sort position,
so the Role row would have rendered as nothing and the sort would have put
both people last. The enum value goes in `role`, and the fuller descriptor
into `description`, which is the text the card shows anyway.

`contact` is set on both because the person template emits its `<dt>` and
`<dd>` unconditionally, so an entry without one produces an empty definition
term. Nothing would have failed; the page would just have had a blank row.

**Verified:**
Read the built HTML rather than trusting the frontmatter: Convenor and Tutor
labels present, both affiliations present, the email rendered, no empty `<dd>`,
and the index listing both with the convenor first. Build clean at 26 pages,
no accessibility violations, suite 13 of 13.

**Commit:** [`1d73ba4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/1d73ba4)

**What happened:**
Nothing was flagged. Worth recording that the local schema and the local
templates disagree about what `role` is: the schema was loosened to a free
string at some point, and the two components that consume it were not. That is
the same defect class as the spec lines that no longer match their briefs, and
as A2's criterion naming the wrong pair of layers. A loosened validator does
not remove a constraint, it only moves it out of sight, and the place it moves
to is a silently missing row on a rendered page.

The portrait lines are committed commented out, with the exact filename each
entry expects. `photoAlt` is required by a superRefine whenever `photo` is
set, so a portrait dropped in without alt text fails the build rather than the
review, and the comment is where that is said.

## 2026-09-05 01:13 — Twelve weeks, generated

**Prompt:**

> Extend the home page with three elements ... (1) a "Twelve weeks" list
> generated from the sessions collection ... (2) a "The bench" block with the
> four lines I'm pasting ... (3) replace the three card descriptions with the
> copy I'm pasting ... at 390×844 the twelve-weeks list must not wrap the date
> onto a third line.

**Result:**
The list reads the collection for week, date, title and description, so the
home page cannot fall out of step with the twelve pages it points at. The
grouping is the part worth the care: it walks sessions in week order and opens
a new group when the arc letter changes, rather than bucketing by letter. The
two behave identically today, and differ the moment an arc is split across
non-contiguous weeks, where bucketing would quietly reorder the course and
this shows two groups.

The bench block carries R, A, B and C with their true scores, and the
1/N figure beneath. Worth noting the figure needed nothing done to it: the
palette was chosen for both grounds when it was written, and the same file
reads on the site's cream as it does on the deck's black.

**Verified:**
Both viewports through CDP rather than by eye. Twelve meta lines, one line
each at 390x844 and at 1920x1080, no overflow and no offending elements at
either. The date requirement is met more strictly than asked: it never reaches
a second line, because week and date are held together with nowrap. Then read
the rendered page in two crops, which is how I saw that the figure's own
labels hold up on cream.

**Commit:** [`3d9dddb`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/3d9dddb)

**What happened:**
The third element could not be done. The card copy was not in the message,
which is the fourth prompt in this build to reference a paste that did not
arrive. Twice the content turned out to be in `build/CONTENT.md` already and I
found it there; the bench lines this time were recoverable the same way. Copy
that exists nowhere is not recoverable, and writing three descriptions myself
would have produced something to be replaced rather than something to be used.
Left alone, and reported.

Putting the list on the home page also made an old flag visible. Week 4's
description reads "One reference set, four public implementations, four
different numbers", and its body says "several", because the hedge went into
the prose and never reached the frontmatter. That sentence is now on the front
page of the site, in a list built to be the course's shop window.

## 2026-09-05 02:48 — The deck moves back, for the reason it should have moved the first time

**Prompt:**

> please remove the slide 02 deck from Session week 2 to Lecture week 2, I once
> ordered you to move to session, however, with the understanding about spec, I
> think the lecture should contain the slide!

**Result:**
Reversed. `lectures/week-02` now carries `slides`, the lectures index has an
entry on it, and the collection the programs and courses page reads is no
longer empty.

The session template's slides handling came out with it, and that is the part
worth recording. It only existed because `sessions` does not declare `slides`,
so I had validated the `/decks/<slug>/` shape by hand at the render boundary
and thrown on a bad value. The lectures schema enforces that shape itself. Two
paths for one thing, one of them checked by a throw in a template, is worse
than one path checked where the data is declared. Removing the key also put
the session back in agreement with SPINE.md, which never carried it.

**Verified:**
The deck link present in the built lecture page and absent from the built
session page, both checked in the HTML rather than assumed from the
frontmatter. Build 27 pages, no accessibility violations, deck structurally
clean, suite 13 of 13.

**Commit:** [`fb3c10c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/fb3c10c)

**What happened:**
I put the deck on the session two weeks ago because the author asked for it,
and I flagged at the time that the spec says "at least one lecture carries a
real deck, linked from its page" and that an empty lectures collection could
not meet it. The flag was right and did not change anything, because it sat at
the end of a report while the instruction sat at the top of the next prompt.

What actually moved it was deleting the template paragraph from
`/lectures/`. That left the page rendering a title, a description and nothing,
which made the gap visible instead of described. A defect you can see beats a
defect you have been told about, and it took three weeks and an unrelated
cleanup for this one to become the former.

## 2026-09-05 03:18 — Seventeen slides, and a guard that matched everything

**Prompt:**

> I provide you with week-02-deck.md in build folder. I think this structure is
> more detailed! Could you reconstruct it? And add one function, press esc key
> can quit the slide

**Result:**
The deck rebuilt against a real specification rather than a chat outline, and
the difference shows in what the spec forbids: no slide that only continues a
formula, one coupling visual rather than two, the four-row reduction on a
single board with fragments instead of four near-identical slides.

The constraint that shaped the build was maths. The stack has no renderer, and
this is a derivation deck where the notation is the argument. matplotlib's
mathtext typesets a LaTeX subset with no external install, so 27 display
equations are rendered to transparent SVG by a script, named, and cited by
name from the slides. That is what makes the spec's notation convention hold:
mu-P in the derivation and mu-r only after FID is now a property of a
dictionary rather than of my proofreading, and `Eq.astro` throws on a name
that has no rendered file.

mathtext has no matrix environment. The block covariance is therefore built
from a CSS grid with drawn brackets, and carries an aria-label, because a
matrix assembled from spans is a picture as far as a screen reader is
concerned.

**Verified:**
Escape tested by dispatching a real key event through CDP and reading
`location.pathname` afterwards, not by inspecting the handler. All seventeen
slides measured against the 1280x720 canvas: every one fits. Build clean at 27
pages, no accessibility violations, deck structurally clean, suite 13 of 13.

**Commit:** [`f968d07`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/f968d07)

**What happened:**
The Escape handler failed on its first test, and the reason is worth keeping.
I had written a guard so that Escape would close Reveal's overview before it
closed the deck, and implemented it as a query for `.reveal .overlay,
.reveal .pause-overlay`. Reveal renders a `.pause-overlay` element into every
deck whether or not anything is paused, so the guard matched on every press
and the handler returned before doing anything. The test reported the overview
opening, which is exactly what a handler that never runs looks like.

The fix was to test the state rather than the element: Reveal records overview
and paused as classes on `.reveal` itself. The general shape is one I have hit
twice before in this repo, in the spec tests that passed vacuously: I wrote a
condition against where I assumed the information lived, and it was somewhere
else. What caught it this time was that I dispatched a real keypress and
checked the resulting URL, rather than reading the code back and believing it.

The equations also shipped once in the wrong colour. They were rendered in the
mid ink the other figures use, which is chosen to survive both the site's
cream and the deck's black; on a near-black slide at display size that reads
as grey on grey. Deck-only assets get the deck's off-white. Only visible by
looking at a rendered slide.

## 2026-09-05 03:53 — Two bugs the author could see and my checks could not

**Prompt:**

> for slide 5, 7, 9, 10, there are boxes, maybe unrecognizsed font! And for
> slide 7 and 9, the layout has problem, the formula is below the window.

**Result:**
Both real, both mine, and both invisible to the checks I had run on this deck
one turn earlier.

The boxes were blackboard-bold E and script N. `_style` sets
`svg.fonttype: "none"` so figure labels inherit the page font, which is right
for a figure and wrong for an equation: mathtext draws those letters from
fonts no browser has, so they shipped as a `<text>` element and rendered as
tofu. Outlining every glyph to a path fixes it. My first attempt at that also
failed, because I put the rcParam above the `_style` import and `_style` reset
it on the way past.

The layout problem was worse, because I had checked for it and reported it
clear. My canvas check measured `section.scrollHeight` against 720. A Reveal
section is a fixed 720px box, so that number cannot exceed the limit it is
being compared with; the check could not fail. Measuring how far the children
actually reach, with fragments forced visible, put slide 9 at 703 of 720 and
slide 14 at 703. That is content filling 98% of the canvas: it fits on the
machine it was written on and clips on the next.

**Verified:**
27 of 27 equation SVGs contain no `<text>` element. Every slide re-measured
with the corrected check, worst case now 636 of 720. Both flagged slides
opened and read as pictures, which is where the script N and the boxed result
were confirmed present and inside the frame.

**Commit:** [`1fc21a1`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/1fc21a1)

**What happened:**
This is the fourth time in this build that a check has reported success
against a value it could not have failed on, and the first time the author
found the defect before I did. The pattern each time is the same: I write an
assertion against where I assume the information lives, and it lives somewhere
else. Bodies were not on index nodes. Criterion names were not in the body.
Reveal's paused state was not the presence of a `.pause-overlay` element. A
section's overflow is not its `scrollHeight`.

The guard I adopted after the second of these was to ask what the check would
have to see in order to fail. I did ask it of the equation loader, which is
why that one has a guard test. I did not ask it of the canvas check, and the
canvas check is the one that shipped a broken slide to the person reading it.
Asking sometimes is not a practice.

What would have caught this without asking anything: looking at the rendered
slides. I measured seventeen and read two.

## 2026-09-05 04:30 — The author's account replaces mine

**Prompt:**

> Oh could you use my tone to compose this? ... First, find an anchor, I use
> week-5 as anchor, finish this first using 3 papars to finish the content of
> this page. Second ... most work is we have an idea, and check spec, and we
> agree or disagree, and test and provide results as feedback? So the build is
> plain ... this task is not hard, not details worth considering? And tone can
> be naturer!

**Result:**
Rewritten, 493 words, seven citations. The structure is now the author's:
week 5 as the anchor, written by hand from the three verified papers before
anything else existed, then a plain loop of instruction, check, discrepancy,
decision. The record confirms the anchor claim exactly: the week 5 body and
the PDFs land in 3dde85d, one commit before the spine exists.

The account also now names what was tolerated rather than fixed, because the
author is right that triage was half the decisions: week 5 left over the word
range on purpose, the four-versus-several wording left standing. My first
draft treated only the catches as evidence and skipped the deliberate
non-fixes, which are the same kind of judgement.

**Verified:**
Word count 493 inside 400 to 600 with citations counted as single tokens,
seven hashes all resolving, zero em-dashes, check:evidence exit 0.

**Commit:** [`58e18b0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/58e18b0)

**What happened:**
The author read my draft and disagreed with its story, not its facts. I had
composed the build as a chain of caught failures, which is the shape my
record entries naturally take, since I write one when something goes wrong.
Their description of the same weeks is flatter and truer: mostly the work was
finding out whether a thing could be done, agreeing or disagreeing, and
moving on, with nothing that deserves the word breakthrough. The record
over-samples drama because drama is what gets recorded. Worth remembering
when drawing any future account from this file: the entries are the
exceptions, and the loop between them was the process.

## 2026-09-05 06:51 — The papers leave the tree and stay in the history

**Prompt:**

> I am suggested, to put 10 papers with copy right into repo is inadequate?
> And the link directs to the publish page, so we change an expression and
> maybe gitignore this folder?

**Result:**
All ten PDFs untracked with local copies kept, `/assets/` ignored so a future
download cannot drift back in, and PROCESS.md's anchor sentence changed from
"kept the PDFs in the repo" to what is true now: each paper logged in
`readings.ts` with a link to its published page and a verified date. Nothing
else referenced the folder, checked before removing rather than after.

**Verified:**
489 words, seven citations resolving, check:evidence exit 0, suite 13 of 13.
Local copies confirmed still on disk after the untrack.

**Commit:** [`4dcd17e`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass2-jnheinrich451-eng/commit/4dcd17e)

**What happened:**
The decision worth recording is the one not taken. The PDFs remain in the git
history, and scrubbing them out would mean rewriting every commit since they
landed, which breaks all seven citations in PROCESS.md and every link in this
file. The process evidence is 45 per cent of the mark and it is addressed by
hash; a history rewrite to remove low-risk files would destroy the submission
to sanitise it. Removing from the tip is the proportionate fix, and if the
history itself is ever a problem, that is a convenor question and not a
force-push.

The concern itself was flagged by me three weeks ago when the first three
PDFs appeared, and acted on now because someone advised the author directly.
Same pattern as the lectures deck: a flag at the end of a report changes
nothing until the problem is made visible or repeated by a person. The record
keeps ending up teaching the same lesson from different directions.
