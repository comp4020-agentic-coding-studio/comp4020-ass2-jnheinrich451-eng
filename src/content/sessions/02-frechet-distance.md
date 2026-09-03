---
title: The Fréchet distance
description:
  The closed form for two Gaussians, derived rather than quoted, and the
  assumption it smuggles in
week: 2
date: 2026-08-10
spec:
  - you can derive the two-Gaussian closed form and say which step needs the
    matrix square root
  - you can state what the form assumes about the two distributions, and name
    one case where that assumption plainly fails
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
