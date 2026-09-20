# SLOP8412 — Advanced Fréchet Inception Distance

The platform is fixed and documented in `README.md`; the brief and spec are on
the [course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/assessments/assignment-2/).
Neither is restated here. This file is the part that is mine: the rules I hold
the agent to while it writes a course.

## The refined response — check it every time

> I'm building a sincere, persuasive course website that argues a reported
> FID is a claim about a protocol, not a property of a model. It is aimed at
> postgraduates who have read a results table without asking what N was, and
> who assume a lower score means a better model. I make the case with one
> bench whose true scores are known, re-scored every week, and with
> instruments in the page that let the reader produce each failure with their
> own clicks before the prose names it.

The course team's advice for the response criterion is to turn the open brief
into one specific sentence, then judge every decision by it. This is that
sentence. The wording is the author's; the agent does not rephrase it.

Before accepting any page, component, figure, label or visual treatment, ask
**does this make the site more persuasive to that reader?** Not whether it
looks good, and not whether it meets the spec. Each clause is a question:

- **The claim.** Does this help show that a reported FID is a claim about a
  protocol?
- **The reader.** Would a postgraduate who trusts a lower score need this, or
  is it for someone already convinced?
- **The means.** Does the reader produce the failure, or only get told about
  it?

Something that answers none of them is mood (Rule 1): rewrite it or cut it.
Decorative styling is not exempt. A status light, an index number or an
animation answers one of the three or goes. When a new component arrives, it
is checked against this sentence before it is checked against the build, and
the older pages it now sits beside are checked again, because a new increment
can make a page that was fine read as outdated.

### Instructions before the panel, the result in a fold

"Before the prose names it" governs the result, not the instructions. A
student facing a panel needs to know what to press and what to watch, so that
comes first, in the prose. The outcome the panel was built to show does not.
It goes in a closed `<details class="expected-results">` with the summary
"Expected results", after the instructions and before the panel, so the
student predicts, runs, and then checks their own reading against it.

This does not overrule Rule 1. A page still opens with its claim ("a third
score is only worth having if it sees something the first two did not"). What
moves into the fold is the observed outcome ("C's dots sit inside R-again's
range in all three strips"). `spec/expected-results.test.ts` holds this for
every page whose panel exists to show a failure.

The three rules below are how this sentence is enforced across twenty pages.

## Why these three rules

Assignment 1 scored process 86 and artefact 84, but **response 77** — the only
criterion out of the HD band. Both marker comments named the same defect, and
neither was about compliance:

> I don't quite understand the connection between Mars and exoplanets. The first
> page could have focussed on why studying exoplanets is relevant/interesting in
> the first place.

The instrument was good; the *case for it* was never made. A hero that was
load-bearing for me read as arbitrary from outside, and the site assumed its
reader already cared. That is the D–Cr descriptor exactly — "a real idea behind
it; minor drift" — against an HD that asks for "one idea, carried all the way."

A1 was two pages and drifted once. This is twenty-odd pages that have to agree
with each other, and the agent will happily produce twelve well-formed week
pages that each look excellent alone. **That is the failure mode this file
exists to prevent.** The three rules below outrank fluency, volume, and
plausibility. A page that reads well and fails one of them is a page to rewrite,
not to accept.

---

## Rule 1 — Argue, don't set a mood

Every page that introduces something states a **claim a reader could dispute**,
before it states what the page contains. The home page carries the load: a
prospective student must finish the first screen knowing what this course
believes and why a semester of it is worth their time.

A mood is an impression — evocative titling, atmosphere, a striking image. A
catalogue entry is also a mood, the institutional kind: *"This course explores
the intersection of X and Y, covering Z. Students will develop skills in…"* It
is what an agent writes by default and nobody can disagree with it.

Do:

- Open with the proposition, then the evidence, then the mechanics.
- Keep a stance. The course is allowed to think something is true.
- Let prose be prose. Sentence case, a real voice, no feature-bullet filler.

Don't:

- Open a page with what it "explores", "covers", "introduces" or "examines".
- Use "In this course, students will…" anywhere.
- Lead with atmosphere and leave the argument to a later page.

**Test before accepting any intro copy:** write down what it would look like to
disagree with this paragraph. If there is no answer, it is mood — rewrite it.

## Rule 2 — Nothing symbolic goes unexplained

Applies to every choice made *because it means something*: the course title, the
session label, week titles, the assessment structure, the visual treatment, the
imagery, any invented term. A meaning that lives only in my head reads to a
marker as an arbitrary decision — and costs twice, because the build effort was
paid and the result still registers as incoherence.

Each such choice ends in one of two states, never a third:

1. **Earned** — the site's own content makes the connection available, in the
   place a reader meets it.
2. **Cut** — it does not ship.

Earning it is not a footnote saying "this symbolises…"; that kills the symbol.
One sentence doing real work in the right place is the shape. Mars needed *"the
last world we've stood on — everything past it we know by inference, and this is
a site about inference."* Then the image is the thesis, not decoration.

Do:

- When introducing a conceit, name what it is doing within the same screen.
- Prefer a conceit that pays off structurally later over one that only looks
  good once.

Don't:

- Ship an image, a name or a metaphor whose relevance I would have to explain
  out loud.
- Explain a symbol in a glossary or an aside instead of in the content.

**Test:** for each deliberate choice, point at the sentence or page that earns
it. No pointer means cut it.

## Rule 3 — Non-adjacent weeks must visibly connect

Prerequisite chaining is the weak form — week 3 teaches the method, week 9 uses
it. Every course has it, including twelve unrelated chunks under one theme, so
it earns nothing.

The required form is that the **idea accumulates**: week 9 is unintelligible
without week 3 because week 3 made an argument, coined a term, staked a position
or started an artefact that week 9 advances, complicates or overturns.

Devices that produce this structurally — use at least two:

- **A vocabulary the course invents** early and still uses in week 10. Our
  terms, not the field's.
- **One artefact carried across the semester** — built, broken, rebuilt.
- **A claim that gets overturned.** Week 2 asserts it confidently; a later week
  shows why it was wrong. A course with a plot.
- **Assessment that spans weeks** rather than twelve independent submissions.

Do:

- Write week pages against the arc, not one at a time in isolation.
- Make every week after the first refer back by name to something the course
  itself established.

Don't:

- Give a week a topic that could be swapped for another without consequence.
- Let twelve weeks share a theme and call that coherence.

**Test (this is the marker's own):** could week 9's page be lifted out, dropped
into a generic course on this topic, and nobody notice? If yes, it is a chunk —
rewrite it. Markers read non-adjacent weeks precisely because adjacent ones
always look connected.

---

## How to work in here

- **The three rules run before the checks, not after.** Do not offer a page as
  done because `pnpm check` is green. Green means the build is intact; it says
  nothing about drift, and the brief is explicit that repetitive weeks cost
  response marks "regardless of whether or not the CI checks pass".
- **Content is written against the arc.** Before writing any week, restate in
  one line what it inherits from earlier weeks and what later weeks inherit from
  it. If either is empty, the arc is wrong — fix the arc, not the page.
- **Volume is not progress.** Twelve fluent pages that fail Rule 3 are worse
  than four that hold, because they cost the same to rewrite and hide the
  problem behind finished-looking text.
- **When drift is found, fix it here.** A page rewritten by hand is one page
  fixed; a rule added to this file is the class fixed. Failures get diagnosed at
  the harness level, not retried with a better prompt.
- **When the right call is ambiguous, ask.** Don't resolve a question about the
  course's argument by picking the plausible option.

## Building locally

`pnpm build` needs `SLOP_NO_SEARCH=1` on this machine, and only on this machine:

```sh
SLOP_NO_SEARCH=1 pnpm build
```

The theme shells out with `execFile("npx", ["pagefind", ...])` in its
`astro:build:done` hook, which cannot run on Windows under Node 26 — bare `npx`
resolves to an extensionless shell script (ENOENT) and `npx.cmd` is refused
because Node will not spawn `.cmd` without a shell (EINVAL). The throw also
kills `courseGraph`'s hook, which is registered after it, so `dist/api/` never
gets written and the spec tests that read it cannot run at all.

The env gate in `astro.config.ts` is the **one deliberate divergence** from the
fixed platform. CI is ubuntu and never sets the variable, so the deployed site
still ships a search index. Do not set it in CI, and do not remove the gate.

Two things this uncovered, both of which had been invisible because the crash
aborted the build before they ran:

- **Every `.mdx` page under `src/pages/` needs explicit `layout:` frontmatter.**
  The theme installs its default-layout injector as a remark plugin on
  `markdown.processor`, and `@astrojs/mdx` does not run that processor, so an
  `.mdx` page renders with no `<html lang>`, no `<title>` and no landmarks —
  three axe violations each. `.md` pages are fine. Any new `.mdx` page in
  `src/pages/` must carry `layout: <relative path>/layouts/PageLayout.astro`.
- **A spec test must be named `*.test.ts`.** Vitest's default include is
  `**/*.{test,spec}.?(c|m)[jt]s?(x)`, and there is no vitest config overriding
  it, so a file called `test.ts` is silently collected by nothing.

A third, found while building the week 8 grid:

- **A scoped style never reaches an element the script created.** Astro stamps
  its `data-astro-cid-*` attribute on the markup at build time, so a `<span>`
  built in the component's own `<script>` matches no rule in its own `<style>`
  block. Style runtime-created elements with `:global(...)`, or through custom
  properties inherited from a parent that does carry the attribute. It fails
  silently and only in the render, which is why it was found by looking at a
  screenshot rather than by any check.

## A check proves the tree it ran on

`pnpm check` reads the working tree, and the working tree holds whatever is
lying in it, including other people's uncommitted work. On 15 September eight
commits in a row went out after a green check while HEAD itself could not
build: two of them had swept in edits importing layouts and a component that
had never been committed, and another carried someone else's engine refactor
under a message that did not mention it. Every check passed because every
check ran on a machine where those files existed.

- **Look before staging.** Run `git diff -- <file>` on every file about to be
  committed. If the working copy carries edits that are not yours, either
  leave the file out or say in the commit message exactly what else it
  carries.
- **Commit by path.** `git commit -- <paths>`, never a bulk add.
- **Stage, check, then commit.** `spec/self-contained.test.ts` reads the git
  index rather than the disk and fails when a tracked file imports an
  untracked one, so running `pnpm check` with the commit staged tests the
  commit rather than the desk it was made at.
- **A commit runs only if the check exits 0.** Put the commit inside the
  condition, never after the check in the same line: 994a836 went out while
  `pnpm check` failed on a type error, because the commit was chained after
  it and the log was read for test counts only. Read the exit code, not the
  summary lines.
- **Before a ship, check HEAD alone.** Build a clean worktree of HEAD and run
  `pnpm check` there. Nothing else proves the tree that will be marked.

## These rules become checks

The brief asks for checks in `spec/` "protecting the promises your course makes
that the build cannot". Coherence is exactly such a promise, and nothing shipped
in the platform can see it. Rules 2 and 3 are testable and must be tested:

- the invented vocabulary appears in the weeks after it is introduced
- the running artefact is referenced by every week that claims to advance it
- assessment weights total 100%, across twelve dated weeks inside the teaching
  period

A rule I keep having to re-apply by hand is a rule that should be a test.

For interactive lectures, a settings change invalidates any pending result.
Plots and scores must consume the same generated samples. A demonstration
threshold must be labelled as a heuristic unless its statistical calibration
is established; a few agreeing repeats do not prove certainty or unbiasedness.
Reports retain all parameters, the seed and observed counts in every outcome.
Check live controls in both themes; a clean static accessibility scan is not
evidence that dark-mode inputs are readable after interaction.

Distinguish population moments from empirical moments in every exact-zero
example. State the construction that guarantees equality; drawing from the
same distribution or taking a subsample does not guarantee identical sample
means and covariances. Protect this distinction in the teaching precision tests.

A session's description, checklist, exercise and log handoff must promise the
same work. A proposed experiment is not a measured result; a toy feature
invariance is not evidence about an untested encoder. State what is held fixed,
what changes, what students retain and what would challenge their explanation.
Count settings and candidate scores separately. Preserve these distinctions in
the session-alignment checks, and update the corresponding course-spine entry
when changing a session's promise. Keep revisions to one or two sessions per pass.

Name the feature map as well as the Gaussian formula: synthetic-vector scores
are not standard image-based FID. A population baseline is not a fitted FID∞
intercept. Match exercise instructions to the quantities and settings a panel
actually computes, including controls that change N as well as dimension.
Separate a mathematical insensitivity from observed finite-run strip overlap;
unbiasedness does not certify sensitivity, and overlap is not a significance test.

The measurement log and session handoffs must agree on when a method becomes
required: FID∞ starts with recorded lecture-ladder practice in week 5, then
transfers to the student's candidate in week 6. Distinguish finite estimates,
fitted intercepts and population baselines; retain original measurements.
An explicit "not computed" explains an omission but does not satisfy required
work. Check this timing across the assessment, sessions and planning spine.

Assessment-linked sessions prepare the published task, not a parallel one.
Keep presentation duration and submission requirements aligned with the
assessment brief and link to it; do not invent another deadline or deliverable.
Final comparison tables retain each metric's scale and each estimate's protocol,
not a claim that unlike methods were all computed identically. Protect the
week 12 eight-minute presentation plus four-minute defence in the checks.

# Instructions on SLOP8412

## The one idea
Twelve weeks on a single scalar. Every page must be traceable to it.
If a paragraph would survive being pasted into a different course, cut it.

## Register
Completely sincere. The course takes FID seriously; it never comments on
taking FID seriously. No winking, no irony markers, no jokes about the
course itself.

Never write: "delve", "in today's landscape", "it's worth noting",
"whether you're X or Y", "not just X, but Y", "In this week we will
explore". No em-dash asides. No three-item lists for rhythm.

## Hard facts
- Course code SLOP8412, level 8. Never alter either.
- Session dates come from `src/course-config.ts`. Never invent one.
- Assessment weights must total 100. Never adjust a weight to fit content.

## Lecture rhythm

The course uses 4+1: a live introductory demonstration in week 1, followed
by four formal lectures in weeks 2, 5, 8 and 11. Weekly sessions continue
through all twelve teaching weeks; lectures do not replace them.

Each lecture changes what students can ask of the same measurement bench:
derive the number, question the estimate, change the instrument, defend the
report. Week 11 prepares the week 12 presentations rather than displacing them.
Lecture dates must match their already scheduled sessions.

Keep `lecture_format` (demo or formal) and `lecture_stage` (ready or outline)
explicit in lecture frontmatter. Outline pages must be labelled as previews
on both the overview and their own page. Do not advertise slides until a real
deck exists. Develop new decks individually; a short experiment-led lecture
does not need to match the length of the week 2 derivation.

Protect the 4+1 distribution, session-date agreement and honest resource
labels in `spec/lecture-rhythm.test.ts`. Keep the overview and course prose
consistent with this structure. Do not edit the week 2 deck until the author
provides their refinement instructions.

## Citations
Readings come from `src/data/readings.ts` only, referenced by key.
A page may name an author, or give a year beside one, only when
`readings.ts` carries that reading with a verified date. Titles and venues
stay in `readings.ts`. If a week needs a reading not in that file, stop and
ask. `spec/citations.test.ts` holds this.

This used to read "never write an author or a year into a page". The pages
broke that wording twenty times, and all but one of those names had a
verified reading behind them, so the rule now says what it was for: no name
on a page without a checked source. The one it caught was a source in my own
notes that never became an entry.

## Prose
Session bodies are drafted by the agent against build/SPINE.md and
sessions/05-the-bias.md as the reference, then rewritten by the author.
Draft only when asked, one or two sessions per turn, never more.
Do not rewrite, expand or "improve" any session the author has marked
final in its frontmatter (`final: true`).

Session bodies run 300 to 800 words. A week with no lecture has to do its
teaching in the session and sits high in that range; a week whose lecture
carries the teaching sits low. `spec/course-promises.test.ts` holds both ends.

## Figures
Figures are generated by scripts in `figures/`, checked into the repo
and run to produce assets. Never place an image that no script produced.
Every figure script prints the numbers it plotted to stdout.

## One statement per fact
Course-wide rules (lateness, grace period, tool disclosure, re-marks)
are stated once, on the policies page. Assessment pages link to them
and never restate them. If a page needs to say what the rule is, it
is the wrong page.

## Reports
Every report opens with a section titled "Open defects", listing anything
found and not fixed, one line each, before anything about what was done.
If there are none, the section says "none". Nothing else goes above it.
