---
title: The bias
description:
  Finite-sample FID is biased, the bias depends on the generator, and
  fixing N does not repair the comparison
week: 5
date: 2026-08-31
arc: B
required_reading: chong-forsyth-2020
further_reading: [binkowski-2018, heusel-2017]
spec:
  - you can explain the leading bias in expectation from the expansion,
    and distinguish it from the error in one estimate
  - you have produced two models whose measured ranking is stable,
    repeatable, and wrong
  - you can say what an N-honest comparison is, and why it is not enough
related:
  - 02-frechet-distance
  - assessments/a1-reproduce-the-number
---

Take the bench. Freeze both generators. Score the first one against the
reference set with 1,000 samples, then again with 50,000.

The average score can fall as N increases while nothing about the generator
changes. One pair of measurements cannot establish that trend; repeat the
draws and compare their averages.

## What moved

Week 2 supplied a population quantity; week 4 pinned its implementation.
Sampling still intervenes. Where the score is sufficiently smooth and the
moment estimates satisfy the expansion's assumptions, the leading bias is
of order 1/N, with higher-order corrections. It depends on the generator.

The upward bias concerns the score in expectation over repeated draws.
An individual estimate can fall below its population value. Likewise, a
larger sample does not guarantee a lower score on every run. Your week 4
notebook contains observations, not expectations.

If every generator had the same expected inflation, their ordering would
survive it. Different bias terms can change the ordering even when N is
identical. That is the comparison we need to test.

Chong and Forsyth measured this across four models and found the
relationship linear in 1/N in every case, with slopes that differ
substantially between models. Read their Figure 2 before the session, and
read the caption too, which concedes something about those particular
models that a careful student should notice.

## N-honest, and why it is not enough

We will call a comparison **N-honest** when both numbers were computed at
the same sample size, with the same reference set, through the same
instrument. Nothing in the literature guarantees this. Practice has split
between 50,000 and 10,000 samples, and scores computed at one are still
compared against scores computed at the other.

N-honesty is necessary. Here is why it is not sufficient.

Bińkowski and colleagues built the case directly, at 2,048 dimensions to
match the coding layer we met in week 3. Two candidate distributions, true
scores of roughly 1123.0 and 1114.8, so the second one is genuinely closer
to the target. Estimated N-honestly at 50,000 samples, they come out at
1133.7 and 1136.2. The ordering is reversed.

Across a hundred evaluations, every single estimate of the better model
came out worse than every single estimate of the worse one. The reported
standard deviations were 0.2 and 0.5.

The estimates were precise, repeatable, and wrongly ordered. Their small
standard deviations described sampling variation, not accuracy. At 100,000
samples the ordering came out right in all hundred trials in that experiment.

## Where 50,000 came from

The original score used 50,000 generated images. Treat that as a protocol
setting, not a sample-size guarantee for every generator and reference set.

## The repair, and its price

Compute the score at several sample sizes, fit a line in 1/N, read off the
intercept. This estimates FID∞ for the chosen sampling protocol; it is not
an exact correction. Inspect fit residuals and sensitivity to the N range.
A finite reference set held fixed does not become a population reference
merely because generated-sample N is extrapolated to infinity.

The [week 5 lecture](/lectures/week-05/) runs this ladder in the page on a
smaller bench, and shows the price as well as the repair: repeated ladders
land either side of the true value, and move by about as much as the value
they estimate.

We will use it on the bench from week 6 onwards. Week 4's numbers are now
retired.

## Before the session

Read Chong and Forsyth for Figure 2. Come able to say what the differing
slopes mean, and what the caption admits.

## Exercise

First use the [Python workspace](/workspace/). Keep both generators fixed,
run the starter, then change only the seed. Compare the mean estimates at
each N with the known population values. Increase repetitions to separate
Monte Carlo variation from a persistent discrepancy.

This is a one-dimensional preparatory model, not the 2,048-dimensional bench
or the published inversion below. The starter shares a reference draw between
A and B within each trial, but redraws it across trials and sample sizes.
Record that protocol, the seed, N, repetitions and implementation in your
[measurement log](/assessments/measurement-log/). Do not assume its ranking
must reverse for your chosen seed.

Reproduce the inversion using the construction in Bińkowski, Appendix D.2.
Report the sample size at which the ordering becomes stable, and report the
standard deviation at a sample size where it is stably wrong.

Bring the second number. It is the one worth arguing about.
