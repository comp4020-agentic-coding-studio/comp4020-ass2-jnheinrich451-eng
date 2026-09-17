---
title: Dropping the Gaussian
description:
  Precision and recall split fidelity from coverage. KID keeps the features
  and drops the Gaussian. The bench is scored all three ways.
week: 7
date: 2026-09-21
arc: B
instrument: three-scores
required_reading: binkowski-2018
further_reading: [kynkaanniemi-2019, naeem-2020]
spec:
  - you can say what precision and recall each report that a single scalar
    cannot
  - you can state why KID's estimator is unbiased where FID's is not
  - you have an N-honest comparison of the two bench generators under all
    three scores
related:
  - 05-the-bias
  - 02-frechet-distance
---

Score the bench three ways this week, on the same samples, at the same N,
through the same instrument. FID∞, KID, and a precision and recall pair. Three
numbers where there was one. They will agree about candidate C, which is the
trouble, and they will not agree about A and B.

## Two numbers instead of one

Kynkäänniemi and colleagues report a way to split what a single distance
conflates. Build an approximate manifold for the real samples and another for
the generated ones, each a union of balls reaching from every point to its
k-th nearest neighbour. Precision is the fraction of generated samples landing
inside the real manifold. Recall is the fraction of real samples landing
inside the generated one.

One scalar cannot say which of those failed. A model producing four flawless
images and nothing else has high precision and almost no recall, and a model
covering everything badly has the reverse. Both can be handed the same FID.

Naeem and colleagues report that this pair fails its own sanity checks, that
two identical distributions do not score 1, and that a single outlier inflates
a manifold enough to change the verdict. They offer density and coverage in
their place and report that both checks then pass.

## Why KID is unbiased and FID is not

Bińkowski and colleagues define KID as a maximum mean discrepancy with a
polynomial kernel, which drops the Gaussian assumption and has an unbiased
estimator. The reason is worth being able to say without notes.

KID's estimate is an average of one fixed function evaluated over pairs of
samples, and an average of unbiased terms is unbiased, so the sample size
never enters its expected value. FID's estimate is a nonlinear function of
estimated means and covariances, and the expected value of a nonlinear
function is not that function of the expected value, so the sample size leaks
into the answer and week 5 is the result.

## What none of them catches

C carries R's mean and covariance, so FID and FID∞ both score it 0. The new
scores do no better on this bench.

KID's kernel is cubic, so it compares moments up to the third, and C was built
to match R through the third: it is symmetric, so its third moments vanish as
R's do. C first differs at the fourth moment, where a cubic kernel never looks.
No sample size changes that.

Density and coverage compare distances to nearest neighbours, and C differs
from R along one coordinate in 2,048. Coverage notices C's missing middle in
two dimensions and has lost it by sixteen.

What the three disagree about is A against B. The closed form puts B closer.
KID separates A from R and, at these sample sizes, not B. Density and coverage
call B almost entirely missing: its samples sit slightly further out, and in
2,048 dimensions that is enough to leave nearly every one of R's
neighbourhoods.

The instrument below runs all three, one press at a time. Look for C in each
strip, then change the dimension.

## Exercise

Score A, B and C under FID∞, KID, and density and coverage, N-honestly, at a
sample size you state.

Report the three orderings beside each other, and keep the three numbers and
their sample size in your [measurement log](/assessments/measurement-log/).
Where two disagree, say which quantity each was measuring rather than which
one you trust.
