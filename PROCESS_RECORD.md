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
