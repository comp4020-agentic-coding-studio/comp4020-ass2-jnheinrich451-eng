---
title: Measurement log
description:
  One entry a week from week 1. Every entry records a number, the sample
  size it was computed at, and the implementation that produced it.
week: 12
due: 2026-10-30T12:00:00+10:00
weight: 10
marking:
  mode: weighted
  criteria:
    - name: Completeness across the twelve weeks
      weight: 50
    - name: Predictions checked against measurements
      weight: 50
spec:
  - twelve dated entries, one per teaching week
  - every number is accompanied by its N and its implementation
  - at least one entry compares a prediction recorded before measuring with
    the observed result and explains the agreement or discrepancy
related:
  - final-report
---

A record of what you measured, written as you went.

Due end of week 12, and assessed as a whole rather than entry by entry.
Deadlines, extensions and the use of generative tools are course-wide and live
on the [policies page](/policies/).

## What to keep

1. Twelve entries, one per teaching week, dated.
2. Every number carries its N, its reference set and its implementation. From
   week 5, record FID∞ beside finite FID as specified below; label any
   population baseline separately.
3. Submit one Markdown file. Tables with explanatory notes are fine; an essay
   is not required.

## When FID∞ enters the log

| Teaching week | What the entry retains |
| --- | --- |
| 1–4 | The session's measurements and protocol. FID∞ is not yet required; do not invent or retrospectively add an estimate. |
| 5 | First recorded FID∞ practice: run the [lecture ladder](/lectures/week-05/) three times at fixed settings. Keep the finite N = 60 estimate, fitted intercept and population baseline separately for each run. Label the reduced-dimensional experiment. The [session](/sessions/05-the-bias/) also assigns the sampling and inversion work. |
| 6 onward | Apply the comparison when the session calls for it, beginning with A and your own D in [Week 6](/sessions/06-blind-spots/). Record the shared N ladder, reference protocol and repeated intercepts alongside the finite scores. |

FID∞ is a fitted estimate here, not another single-N measurement. Record all
sample sizes used, draws per size, dimensions, seeds and implementation, and
whether the reference is fixed or redrawn. Keep the fitted result's variation
and any checks of fit residuals or N-range sensitivity. For an analytical
population baseline, write **N: not applicable (population calculation)**.

If an activity does not compute FID∞, enter **not computed** and explain why.
The Python workspace starter and Week 7's three-score panel do not fit it;
their population baselines are not substitutes. A failed required fit also
needs its attempted settings, reason and next check. Honest reporting does
not turn missing required work into completed work. Preserve earlier entries
and date later corrections rather than overwriting them.

## How it is read

Completeness is half the mark.

The other half is for predictions checked against measurements, with
discrepancies written down rather than tidied away. "5.31, expected 5.12,
cause unknown" preserves a discrepancy worth investigating. An expected
result also needs an explanation; agreement alone does not validate the
implementation.

At least one entry must state what you predicted before measuring and why,
report what you observed, and explain the agreement or discrepancy. Expected
and unexpected results are equally eligible. If the cause of a discrepancy
is unknown, say so and identify a check that could help distinguish possible
causes. Keep the original prediction visible rather than rewriting it after
seeing the result.

A correction belongs in the week you found it rather than in the week you were
wrong. A log rewritten to be right stops being a record of what you knew when,
which is the only thing it is for.
