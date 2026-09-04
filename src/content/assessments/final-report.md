---
title: Final report
description:
  Propose what you would report in place of the score, then evaluate your
  proposal by the standard this course applied to FID. Most proposals fail.
  Say how yours does.
week: 12
due: 2026-10-30T12:00:00+10:00
weight: 45
marking:
  mode: weighted
  criteria:
    - name: The proposal
      weight: 25
    - name: Evaluation by the course's own standard
      weight: 45
    - name: Honesty about where it fails
      weight: 30
spec:
  - your metric is scored on the bench against FID and FID∞
  - its bias, blind spots and human correlation are each addressed, or
    their absence is justified
  - the report names the condition under which you would still report FID
related:
  - a2-break-the-number
  - measurement-log
---

Propose what a paper should report in place of the score, then evaluate your
proposal by the standard this course spent twelve weeks applying to FID.

Most proposals fail. That is expected, it is not a reason to propose nothing,
and the mark is for saying where yours fails and how badly rather than for
producing one that survives.

Due end of week 12, with presentations in the same week. Deadlines, extensions
and the use of generative tools are course-wide and live on the
[policies page](/policies/).

## What you submit

Six pages, plus the bench scored under your metric alongside FID and FID∞,
N-honestly, at a sample size you state.

## What the report has to cover

Take your proposal through the same four questions the course put to the
score. Its estimator bias, and whether a fit in 1/N would find one. Its blind
spots, and whether a candidate like C survives the change. Its correlation
with human judgement, and who measured that. Its cost, and what it would take
for a reviewer to accept a table without an FID row.

Where you cannot answer one of those, say so and say what answering it would
require. An unanswered question named is worth more than an answered one
fudged.

## How it is read

The proposal itself carries a quarter of the mark. Evaluating it by the
course's own standard carries nearly half, because that is the skill the
twelve weeks were for. Honesty about where it fails carries the rest.

A proposal that fails on the week 11 argument and says so precisely will be
marked above one that claims to have solved everything.

## Exercise

End the report with the condition under which you would still report FID.

If there is no such condition, say that instead, and defend it.
