---
title: Blind spots
description:
  A generator that memorised the reference set scores perfectly. What else
  the score cannot see, demonstrated on the bench.
week: 6
date: 2026-09-07
arc: B
log: >-
  FID and FID∞ for the candidate D you built, and the per-sample measure you wrote down first
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
inside them. Its population mean vector and covariance matrix match R's
exactly.

So FID(C, R) = 0.

## Zero is the correct answer

Not approximately zero, and not zero because a sample came out lucky. The
closed form takes two means and two covariances, and C's are R's, so every
term vanishes. Zero is what the definition requires.

Now plot the two along e₁. R is a single hump. C has two. Its component means
are 1.8 apart, and each component has standard deviation √0.19 ≈ 0.436 along
e₁. The separation is about 4.1 component standard deviations.
Anyone shown the two histograms sorts them in a second, and the score cannot.

## The other zero

A candidate that copies the evaluated reference set also scores 0. Let
X<sub>R</sub> = (x₁, …, x<sub>N</sub>) be the reference feature vectors used
for evaluation. Construct the candidate by copying this collection exactly,
including any repeated vectors: X<sub>G</sub> = X<sub>R</sub>. Under the same
moment estimators,

μ̂<sub>G</sub> = μ̂<sub>R</sub> and Σ̂<sub>G</sub> = Σ̂<sub>R</sub>.

The hats denote the empirical mean vectors and covariance matrices computed
from these finite collections, not the population moments of R. Consequently,
the empirical FID is zero in exact arithmetic, although the candidate merely
reproduces the reference data. Numerical roundoff may leave a small residual.
An arbitrary subsample does not guarantee these equalities; nor does copying
a training set guarantee zero against a separate evaluation set.

Bimodality and copying are different failures that can both receive zero.
For C, this is the population FID; independently drawn finite samples need
not score zero. For the exact copy, it is the empirical FID against the
copied reference collection. Neither zero certifies what the score is being
read as certifying.

## Which layer broke

Week 5 asked how sampling distorts the population score. This week asks what
even an exact score cannot establish. C's population moments lose its
bimodality; the copied collection's empirical moments cannot establish
originality. Correcting sampling bias does not repair either limitation.

Hold those apart, because A2 asks which of the two your construction breaks,
and this week's is the harder one to repair.

## Exercise

Build a fourth candidate D that scores worse than A's 5.12 and is visibly
closer to R than A is, under any per-sample measure you are willing to define
and defend.

Record FID and FID∞ for D N-honestly against the bench. Write down the
per-sample measure before you look at either number.
