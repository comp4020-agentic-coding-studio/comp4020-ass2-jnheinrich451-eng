---
title: Dropping the Gaussian
description:
  Precision and recall split fidelity from coverage. KID keeps the features
  and drops the Gaussian. The bench is scored all three ways.
week: 7
date: 2026-09-21
arc: B
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
numbers where there was one, and they will not agree about candidate C.

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

## What each one catches

C carries R's mean and R's covariance, so FID scores it 0 and FID∞ scores it 0
as well, both being functions of the first two moments and nothing else. A
polynomial kernel is not, and coverage is not. Both notice that C's samples
sit in two lumps where R's sit in one.

## Exercise

Score A, B and C under FID∞, KID, and density and coverage, N-honestly, at a
sample size you state.

Report the three orderings beside each other. Where two disagree, say which
quantity each was measuring rather than which one you trust.
