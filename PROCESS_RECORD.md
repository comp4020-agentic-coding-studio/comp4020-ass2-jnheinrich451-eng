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
