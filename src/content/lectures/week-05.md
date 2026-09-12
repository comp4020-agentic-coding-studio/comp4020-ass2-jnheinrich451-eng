---
title: Question the estimate
description:
  A biased score is not a noisy one. Return to the week 2 baseline, measure
  the bias on the bench, and take its price with it.
week: 5
date: 2026-08-31
arc: B
extrapolator: true
lecture_format: formal
lecture_stage: ready
related:
  - lectures/week-02
  - sessions/05-the-bias
  - sessions/04-getting-it-right
---

Repeating a measurement removes noise. It does not remove bias, and at the
sample sizes anyone actually works at, the bias is not a correction to the
score. It is most of the score. The week 1 bench reports about 22 where the
true value is 0.16. Averaging a thousand of those draws returns 22.

So the question this lecture asks of the bench is not how much the estimate
moves. Week 1 answered that. It is where the estimate is moving around, and
whether that place can be found from measurements you can afford.

## Bring the discrepancy

Bring the scores and sample sizes from your measurement log, and keep the
closed-form baseline from week 2 beside them. Week 4 pinned the
implementation, so a disagreement between your numbers and the baseline is
now about sampling and nothing else.

## The ladder

The instrument below runs the repair the session describes. Choose a
candidate: A differs from the reference in its mean alone, B in its
covariance alone. Set d, the number of dimensions, and the number of draws
averaged at each sample size. Press run, and it scores the same fixed
candidate at N = 60, 100, 200, 400 and 800, plots each average against 1/N,
and fits a line through the five points.

Read the line at 1/N = 0. That intercept is the score the estimator would
report with unlimited samples, and it is the third number in the row beneath
the plot, between the shortest ladder and the truth. The rungs are wrong by
a factor of seventy. The intercept is wrong in the third decimal place.

It is the same arithmetic as the week 1 bench, scored many times instead of
once.

## Read the second number too

Press run again. The intercept moves, and it moves by about as much as the
true value it is estimating. Often enough it lands below zero, where no
distance can be. That is not a fault in the ladder. It is the price named in
the session: extrapolation removes the direction of the error and leaves its
size, and a spread of that size is invisible in any single run.

The strip under the numbers keeps every intercept you produce, at the scale
of the answer rather than the scale of the measurements. Three or four runs
are enough to see that the dots fall either side of the true value instead of
above it, and that the width of the cloud is the whole of what the correction
does not fix.

So an extrapolated score is not a measurement until it is reported with the
ladder that produced it: which sample sizes, how many draws at each, and how
far the intercept moved across repeats. An N-honest comparison fixes the
sample size for both candidates. An extrapolated comparison fixes the ladder
instead, and owes its reader the same discipline.

## Carry it forward

Record the ladder beside the result in your
[measurement log](/assessments/measurement-log/), and work the full task in
the [week 5 session](/sessions/05-the-bias/). The
[week 8 lecture](/lectures/week-08/) asks which of these checks survive when
the feature extractor and the input medium change.
