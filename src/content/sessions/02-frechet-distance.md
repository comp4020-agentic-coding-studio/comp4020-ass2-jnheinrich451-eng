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

Set the library aside for this session and try to get the distance between A
and R out of the definition alone. The Wasserstein-2 distance between two
distributions is the smallest value, over every joint distribution having
those two as its marginals, of the expected squared distance between paired
samples. It is an optimisation, and the space it searches is very large.

This session is the argument that turns that optimisation into arithmetic.

## The chain

Restrict the coupling to be jointly Gaussian. Under that restriction the
objective depends on nothing but the two means and the two covariances, the
search over couplings collapses to a search over cross-covariances, and the
optimum has a closed form:

d² = ‖μ₁ − μ₂‖² + Tr(Σ₁ + Σ₂ − 2(Σ₁Σ₂)^½)

Two terms, and they do different work. The first is the squared distance
between the means, and no property of either distribution's shape enters it.
The second compares the covariances, through a matrix square root that will
cost us in week 4.

The closed form is due to Dowson and Landau, who published it for multivariate
normal distributions in 1982. Heusel and colleagues cite it rather than derive
it; read them for how a borrowed result becomes a metric, not for the algebra.

## The step that costs

Only one step in that chain needs the assumption, and it is the first:
restricting the coupling to be jointly Gaussian. Everything after it is
algebra that holds regardless. Without that restriction there is no closed
form at all, and the distance has to be recovered by solving the transport
problem numerically.

So the score is defined on Gaussians and computed on features that are not.
Week 7 is where we stop assuming, and see what the alternatives cost.

## Two forms of the same trace

The cross term appears as (Σ₁Σ₂)^½ in the papers and as
(Σ₁^½ Σ₂ Σ₁^½)^½ in careful implementations. The two matrices are not the
same, but their traces are equal, and the second is symmetric. That
distinction is invisible on paper and not invisible to a numerical routine,
which is week 4's subject.

## Exercise

Both bench candidates reduce to a scalar times 2048. A differs from R in its
mean alone, so its distance is 2048 × 0.05², or 5.12. B differs in covariance
alone, so its distance is 2048 × (2.1 − 2√1.1), or about 4.88. Derive both by
hand. Then project the bench onto two coordinates and compute the distance in
that plane by hand as well, and check it against the library.

Score the bench at large N and compare. B is the better candidate, by a
little. The library will return neither 5.12 nor 4.88; it will return
something above both. Record what you get, and at what N.
