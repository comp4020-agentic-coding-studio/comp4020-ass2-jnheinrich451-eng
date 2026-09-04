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
