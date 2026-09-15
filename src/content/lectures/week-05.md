---
title: Question the estimate
description:
  Bias and noise are different problems. Return to the week 2 baseline, measure
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

Averaging independent measurements reduces sampling variation. It does not
remove bias. On the small-sample bench, the discrepancy can dominate the
population score: repeating a biased procedure estimates its expectation
more precisely, not necessarily the quantity we wanted.

So the question this lecture asks of the bench is not how much the estimate
moves. Week 1 answered that. It is where the estimate is moving around, and
whether that place can be found from measurements you can afford.

## Bring the discrepancy

Bring the scores and sample sizes from your measurement log, and keep the
closed-form baseline from week 2 beside them. Week 4 pinned the
implementation. With the same construction and protocol, we can investigate
sampling effects without deliberately changing the implementation. Numerical
errors still need their own checks.

## The ladder

The instrument below runs the repair the session describes. Choose a
candidate: A differs from the reference in its mean alone, B in its
covariance alone. Set d, the number of dimensions, and the number of draws
averaged at each sample size. Press run, and it scores the same fixed
candidate at N = 60, 100, 200, 400 and 800, plots each average against 1/N,
and fits a line through the five points.

Read the line at 1/N = 0. Its intercept estimates the unlimited-sample limit;
it is the middle number below the plot. A linear fit removes a leading 1/N
trend, but higher-order bias and sampling variation can remain. Compare its
error with the shortest rung's error rather than assuming a fixed improvement.

It is the same arithmetic as the week 1 bench, scored many times instead of
once.

## Read the second number too

Press run again. The intercept moves and can land below zero, where no
squared distance can be. This unconstrained fit is an estimate, not an exact
distance. A negative intercept is a reason to inspect sampling variation and
fit error, not to silently clip the answer or declare the correction exact.

The strip keeps the most recent twenty intercepts at the scale of the answer.
Inspect both the spread and the centre of the dots. A few runs can illustrate
variability; they cannot prove that the fitted intercept is unbiased. Vary
the sample-size range in a fuller analysis and inspect residuals.

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
