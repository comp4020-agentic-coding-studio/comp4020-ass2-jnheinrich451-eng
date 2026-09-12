---
title: The Fréchet distance
description:
  The closed form for two Gaussians, derived rather than quoted, and the
  assumption it smuggles in
week: 2
date: 2026-08-10
arc: A
required_reading: heusel-2017
further_reading: [binkowski-2018]
spec:
  - you can derive the closed form from the definition without notes
  - you can say which step requires the Gaussian assumption and what
    breaks without it
  - you have computed the distance on the bench by hand for a two
    dimensional projection and matched the library
related:
  - 01-the-number
---

The bench has a population score before anyone draws a sample. Set the
library aside and recover it from the definition. The squared Wasserstein-2
distance W₂² is the minimum expected squared distance between paired samples,
over all joint distributions with the prescribed marginals. W₂ is the square
root of that minimum. FID uses the squared quantity.

This session is the argument that turns that optimisation into arithmetic.

## The chain

For Gaussian marginals, an optimal coupling can be chosen jointly Gaussian;
this does not increase the minimum. The quadratic objective depends on the
means, marginal covariances and cross-covariance of the coupling. Optimising
the admissible cross-covariance gives:

W₂² = ‖μ₁ − μ₂‖² + Tr(Σ₁ + Σ₂ − 2(Σ₁Σ₂)^½)

Two terms, and they do different work. The first is the squared distance
between the means, and no property of either distribution's shape enters it.
The second compares the covariances, through a matrix square root that will
cost us in week 4.

The closed form is due to Dowson and Landau, who published it for multivariate
normal distributions in 1982. Heusel and colleagues cite it rather than derive
it; read them for how a borrowed result becomes a metric, not for the algebra.

## The step that costs

Gaussian marginals justify the jointly Gaussian optimum. For arbitrary
distributions, their means and covariances alone do not generally determine
W₂². Special non-Gaussian cases can still be solved analytically; what fails
is the claim that these moments suffice for every distribution.

FID applies the Gaussian formula to feature moments even when the feature
distributions are not Gaussian. It then compares their Gaussian fits, not
necessarily their true transport distance. Week 6 tests what this loses;
week 7 asks what alternatives cost.

## Two forms of the same trace

The cross term appears as (Σ₁Σ₂)^½ in the papers and as
(Σ₁^½ Σ₂ Σ₁^½)^½ in careful implementations. The two matrices are not generally
the same, but their traces are equal, and the second is symmetric. That
distinction is invisible on paper and not invisible to a numerical routine,
which is week 4's subject.

## Make covariance visible

Open the [2D correlation experiment](/math-lab/#correlation). Match the
reference, then select positive and negative correlation. Record the full
squared distance and both marginal distances. Explain why changing a
relationship can move the full score while neither coordinate curve moves.
This is a zero-mean, two-dimensional population calculation, not a sampled
score or a projection of candidate A or B.

## Exercise

Both bench candidates reduce to a scalar times 2048. A differs from R in its
mean alone, so its population FID is 2048 × 0.05², or 5.12. B differs in covariance
alone, so its population FID is 2048 × (2.1 − 2√1.1), or about 4.88. Derive both by
hand. Then project the bench onto two coordinates and compute the distance in
that plane by hand as well, and check it against the library.

Score the bench at large N and compare. B has the smaller population FID,
by a little; estimated scores fluctuate and need not preserve that ordering.
Record both estimates and N in your [measurement log](/assessments/measurement-log/).
Keep the population values beside them: week 5 needs that baseline to ask
whether the discrepancy is sampling variation or systematic bias.
