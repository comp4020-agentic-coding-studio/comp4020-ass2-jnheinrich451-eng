---
title: The bias
description:
  FID is biased at every finite N, the bias depends on the generator, and
  fixing N does not repair the comparison
week: 5
date: 2026-08-31
arc: B
required_reading: chong-forsyth-2020
further_reading: [binkowski-2018, heusel-2017]
spec:
  - you can say why the estimator sits above the true value, from the
    expansion rather than from intuition
  - you have produced two models whose measured ranking is stable,
    repeatable, and wrong
  - you can say what an N-honest comparison is, and why it is not enough
related:
  - 02-frechet-distance
  - assessments/a1-reproduce-the-number
---

Take the bench. Freeze both generators. Score the first one against the
reference set with 1,000 samples, then again with 50,000.

The second number is lower. Nothing about the generator changed.

## What moved

Both moments in the score are estimated from samples, and the score is a
smooth nonlinear function of them. Expand it around the true value and
the second-order term does not vanish in expectation. What you get is the
true score plus a term that falls off as 1/N.

The term is positive. Every FID you have ever read is too high, including
the ones in your own week 4 notebook.

That alone would be survivable. If the inflation were a property of the
score, everyone would report numbers that are wrong by the same amount and
the ordering would still hold. It is not a property of the score. The size
of the term depends on the sampling variance of the generator being
measured, which is to say it depends on the generator.

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

So the estimator was not uncertain. It was precise, repeatable, and wrong,
and its error bars gave no warning at all. At 100,000 samples the ordering
came out right in all hundred trials.

## Where 50,000 came from

Heusel and colleagues generate 50,000 images. The paper offers no argument
for the figure, and none has been supplied since. The number that governs
almost every score in the field entered the record as a setting.

## The repair, and its price

Compute the score at several sample sizes, fit a line in 1/N, read off the
intercept. Chong and Forsyth call the result FID∞. It requires no new
theory. It requires that you evaluate more than once, which is the entire
reason it is not standard.

We will use it on the bench from week 6 onwards. Week 4's numbers are now
retired.

## Before the session

Read Chong and Forsyth for Figure 2. Come able to say what the differing
slopes mean, and what the caption admits.

## Exercise

Reproduce the inversion using the construction in Bińkowski, Appendix D.2.
Report the sample size at which the ordering becomes stable, and report the
standard deviation at a sample size where it is stably wrong.

Bring the second number. It is the one worth arguing about.
