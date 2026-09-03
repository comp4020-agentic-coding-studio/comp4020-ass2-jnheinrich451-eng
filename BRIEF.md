# Assignment 2 — brief, spec and marking

Compiled from the live course site on 2026-09-01. Sources:
[brief](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/assessments/assignment-2/) ·
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/) ·
[week 7 retro](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/06-a2-retro/).
The site is authoritative; re-check it if anything here looks stale.

**Due: noon Monday 21 September 2026** (+15 min grace) · **20% of the course** ·
individual · marks back Friday 2 October.

---

## 1. The provocation

> Design the university course you wish you could take, and build the website
> that runs it.

Create one new course for [Slop University](https://slop.university) and build
its website **as a student in the course would see it**. There is no separate
curriculum document, so every decision about the course lands in the site.
Assignment 1 was one page with one interaction; this is twenty-odd pages that
have to agree with each other.

**Niche is required.** Narrow enough that no real university would run it, deep
enough to teach for a full semester. Two named failure modes:

- a course broad enough to "pass unnoticed through a curriculum committee"
- "rebuilding COMP4020 with just a find-and-replace for a different topic"

Sincere, deadpan and satirical are all fine, but it must be a real course
website. Topic and title are mine to choose.

**Coherence is what's being looked for.** The brief's own words: _"A course is
one idea explored throughout a semester, and two key things we're looking for
are: does it hold together, and would I want to take it? An agent will write
lots of 'content shaped chunks', making sure they hang together is your job."_
Plus: the prose must not read as AI slop — _"the best curricula have a unique
and compelling voice."_

Three real courses cited as sites that carry one idea all the way through (not
gold standards, not conventions to follow):

- [Calling Bullshit](https://callingbullshit.org/) — a point of view stated in
  the title and held for a semester
- [How to Make (Almost) Anything](https://fab.cba.mit.edu/classes/863.25/) — a
  syllabus that is a list of machines, and a course that is the sum of them
- [CS 007: Personal Finance for Engineers](https://cs007.blog/) — narrow
  audience, plain register, no filler

Looking around at how courses are designed is stated to be part of the job, and
the approach taken is something to talk about in `PROCESS.md`.

---

## 2. The spec (the checkable lines)

Verbatim from the course API:

1. deployed and live at its public GitHub Pages URL by the deadline, working at
   both marking viewports
2. one niche course at Slop University, under a SLOPxxxx code that keeps the
   three digits your repo arrived with, running across twelve dated teaching
   weeks
3. at least one lecture carries a real deck, linked from its page
4. assessment that adds up to 100%
5. your own checks in `spec/`, protecting the promises your course makes that
   the build cannot; `pnpm check` and `pnpm check:evidence` pass
6. evidence of process is in the repo: PROCESS.md, CLAUDE.md, and a commit
   history that grew with the work

### Notes on each

- **Course code** — this repo arrived as `SLOP1412`. The last three digits
  (`412`) are allocated to this repo alone and must be kept; the first digit is
  the level and is mine to choose on the ANU scheme: 1–4 undergraduate, 6 or 8
  postgraduate. The level does not affect the mark. `level` in
  `src/course-config.ts` must match the code's first digit — the schema enforces
  it.
- **Twelve dated teaching weeks** — as `sessions` entries with real dates inside
  the teaching period declared in `src/course-config.ts`.
  `spec/data-integrity.test.ts` is the shipped check for that one cross-page
  fact.
- **A real deck** — `src/decks/*.deck.mdx`, built by astromotion to
  `/decks/<name>/`, linked from its lecture page with a markdown link. A deck is
  not a collection entry, so it carries no `related:` edges. The build catches
  invalid MDX; nothing checks whether a slide is legible — that only shows up in
  a browser at both viewports.
- **`spec/` checks** — the platform already runs axe, link and dangling-ref
  checks inside `pnpm build`. What's mine to write is the layer above: the
  promises the course itself makes. Assessment weights totalling 100% is one.
  Cross-page coherence is another (see `CLAUDE.md`).
- **`pnpm check:evidence`** fails on: unresolved `PROCESS.md` citations, a
  `PROCESS.md` with no citations at all, every remaining `STARTER_CONTENT`
  marker, and unchanged key imagery. **The starter artwork in
  `src/assets/images/` must be replaced** or deliberately removed in favour of
  an image-free treatment.

---

## 3. What is submitted

- **The deployed site** — the GitHub Pages URL. This is what gets marked.
- **The source repository** — how the code and checks are read. Flipped public
  with `/comp4020:ship`, which also enables Pages and dispatches the deploy.
- **Evidence of process** — `PROCESS.md`, `CLAUDE.md`, and the commit history
  behind them.

The submission timestamp is the last commit pushed to `main`.

### `PROCESS.md`

- **400–600 words.** No word-limit penalty, but badly overshooting can cost
  response marks, since concision is part of the response.
- My own account, written for a reader, of how I got from this brief to the
  harness and agentic workflow behind the site.
- **One narrative**, explicitly _not_ "a run of fixes with a commit hash apiece":
  how directing this particular course changed what I asked the agent for and
  what I accepted back.
- **Cite the record as you go** — link text is the commit hash or range, target
  is the GitHub commit or compare URL. Uncited claims are not evidence and
  markers do not trawl the repo for what wasn't cited.
- Images don't count towards the word count and are welcome. Link them with
  **relative paths** so they render on GitHub, and open the rendered page on
  GitHub before shipping — that page is what the marker sees.

### No reflection

Assignment repos carry **none**. `reflections/` keeps only its `README.md`; the
assignment's written account is `PROCESS.md`, and the retro crit presents from
it. `check-evidence.ts` only recognises `crit-N.md` and warns on anything else.

---

## 4. How it's marked

| Criterion                 | Weight |
| ------------------------- | ------ |
| Legibility of process     | 45%    |
| Working deployed artefact | 20%    |
| Response to the brief     | 35%    |

Each is marked out of 100 against the band, then weighted and summed. Bands:
**HD** 80–100 · **D–Cr** 60–79 · **P** 50–59 · **N** below 50.

### The reading protocol

Markers read the site **the way a prospective student would, for about ten
minutes**: the home page, **a few non-adjacent weeks**, an assessment, the deck,
and the policies page if there is one — at both viewports. Then `PROCESS.md`,
read against the commit history and the `CLAUDE.md` it points at.

The brief's warning, verbatim: _"Twelve weeks that repeat one another, or a site
that reads as the starter with the nouns swapped, says something about your
'response to the brief', regardless of whether or not the CI checks pass."_

### Marking environment

Latest stable Chrome, at the deployed URL, source open on GitHub in another tab,
at two viewports — **1920×1080** (desktop) and **390×844** (the iPhone preset in
DevTools' device toolbar). Both are full marking environments; everything the
brief asks for has to work cleanly at both. These are viewports, not monitor
sizes.

### Band descriptors

**Legibility of process (45%)**

- **HD** — corroborated and skilled: beyond checking out, the record shows
  deliberate direction — failures diagnosed and fixed at the harness level
  rather than retried, output verified before it was accepted, judgement visible
  in what was thrown away.
- **D–Cr** — corroborated and competent: the account checks out and shows a real
  working process, but the directing is routine — attempt, accept, repeat — or
  the evidence has thin spots.
- **P** — process asserted rather than shown: claims uncited, or only weakly
  supported by the record.
- **N** — no real evidence of a directed process, or a record that contradicts
  the account.

Process is the largest criterion deliberately: _"corroboration is the floor of
that band rather than the top of it. What lifts a record into the HD is the part
no commit can supply on its own — why a call beat the obvious one, and how you
knew the result was right before you accepted it."_

**Working deployed artefact (20%)**

- **HD** — holds up under use it wasn't designed for: the keyboard, a resize
  mid-interaction, a slow connection.
- **D–Cr** — deployed, live, and does what the brief asks at both marking
  viewports.
- **P** — notable gaps: the core interaction is unreliable, or one viewport is
  broken.
- **N** — doesn't deploy, or doesn't work.

**Response to the brief (35%)**

- **HD** — a pointed, surprising answer to the provocation, scoped with
  judgement: one idea, carried all the way.
- **D–Cr** — a well-scoped response with a real idea behind it; minor drift.
- **P** — meets the brief only loosely; over- or under-scoped, or an answer
  without a point of view.
- **N** — off-brief.

All marking is done by people, blind-moderated, with a cross-marked sample
calibrated to a shared standard. No automation judges quality.

---

## 5. Dates and mechanics

- **Due** noon Monday 21 September 2026, the first day back after the
  mid-semester break. A 15-minute grace period applies, so noon means 12:15pm.
- **No late submissions.** Past the deadline plus grace, a missed deadline
  scores zero — there is no taper.
- **Extensions are easy but must be requested before the deadline**, through the
  ANU School of Computing extension app. Longer or unforeseen situations go
  through an ECA.
- **Marks and feedback** return Friday 2 October 2026.
- **Re-marks** — a different marker marks from scratch and their mark replaces
  the original, higher or lower. Ask on a private Ed thread within 20 working
  days of the result.
- **Gallery** — after marks return, every submission is listed publicly by title
  and live URL, no attribution. Opt out via a private Ed thread to the convenor
  before marks are returned.

### CI and shipping

The repo starts private and both CI jobs (`check`, `deploy`) are gated on it
being public — while private, pushing to `main` runs nothing. `pnpm check` is
the feedback loop until then. `/comp4020:ship` flips it public, enables Pages
and dispatches the deploy. Flipping early costs nothing; pushes keep deploying
until the deadline. `/comp4020:preflight` walks the submission checklist.

### The week 7 retro (crit 6)

The crit in the week A2 is due is a **retro**, and carries that week's crit mark
(separate from the 20%). Its spec:

1. the A2 `PROCESS.md` is written up in the repo by the cutoff — it is what the
   shipped mark reads
2. the breakthrough presented from it names something **specific** — a prompt, a
   harness change, an insight — not "better prompts"
3. it shows the before/after: what the agent was doing, what changed it, and why
   it worked
4. a short demo of the A2 prototype, presented in the session

Nothing new to write for it — the breakthrough comes from the A2 `PROCESS.md`.

**`flyctl` is not part of Assignment 2.** A2 is static and deploys to GitHub
Pages. `flyctl` is housekeeping verified at the door of that same session, for
the full-stack half that starts afterwards: `flyctl status -a <crit-7-repo>`
answering with the token that arrives when the crit-7 repo is created at the
start of week 7. It carries no marks and doesn't enter the crit conversation.
`/comp4020:doctor` checks it. Install the CLI over the mid-semester break.
