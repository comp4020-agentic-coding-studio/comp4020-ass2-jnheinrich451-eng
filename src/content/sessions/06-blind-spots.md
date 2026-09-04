---
title: Blind spots
description:
  A generator that memorised the reference set scores perfectly. What else
  the score cannot see, demonstrated on the bench.
week: 6
date: 2026-09-07
arc: B
further_reading: [binkowski-2018]
spec:
  - you can construct a bench candidate that scores well and is obviously
    wrong, and say why the score cannot tell
  - you can distinguish a failure of the estimator from a failure of the
    quantity it estimates
related:
  - 01-the-number
  - 04-getting-it-right
  - assessments/a2-break-the-number
---

Build a third candidate. Take an equal mixture of two Gaussians, one centred
at +0.9 along e₁ and one at −0.9, each carrying variance 1 − 0.9² in that
direction and 1 in every other. Call it C and add it to the bench.

Its mean is 0, because the two components cancel. Its variance along e₁ is 1,
because 0.81 of it sits between the components and the remaining 0.19 sits
inside them. Both moments match R exactly.

So FID(C, R) = 0.

## Zero is the correct answer

Not approximately zero, and not zero because a sample came out lucky. The
closed form takes two means and two covariances, and C's are R's, so every
term vanishes. Zero is what the definition requires.

Now plot the two along e₁. R is a single hump. C has two, separated by nearly
two standard deviations of the component width, with little between them.
Anyone shown the two histograms sorts them in a second, and the score cannot.

## The other zero

A second candidate scores 0, and it is worse. Take a subsample of R itself and
submit it as generated output. It carries R's mean and R's covariance because
it was drawn from R, so a model that has memorised its training set is
invisible to any statistic of the first two moments.

Bimodality and memorisation are different failures that receive the same
score, which is how you know the score is not measuring the thing it is being
read as measuring.

## Which layer broke

Week 5 was the estimator failing. The quantity was the right one to want, and
the number that came back was wrong by an amount that depended on N. This week
the estimator is faultless. It returns exactly the right value for the
quantity it computes, and the quantity is the wrong thing to have asked for.

Hold those apart, because A2 asks which of the two your construction breaks,
and this week's is the harder one to repair.

## Exercise

Build a fourth candidate D that scores worse than A's 5.12 and is visibly
closer to R than A is, under any per-sample measure you are willing to define
and defend.

Record FID and FID∞ for D N-honestly against the bench. Write down the
per-sample measure before you look at either number.
