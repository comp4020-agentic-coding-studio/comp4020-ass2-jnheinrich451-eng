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

Placeholder. This session introduces the distance itself, before any of it
meets an image: the Fréchet distance between two multivariate Gaussians, the
closed form in terms of their means and covariances, and the matrix square root
that makes it expensive.

The point to carry forward is the assumption. The closed form is exact for
Gaussians and is applied to activations that are not Gaussian, and the whole
semester is downstream of that substitution.

Week 5 returns here when the bias term turns out to depend on the sampling
variance of the model being scored.
