---
title: The Fréchet distance
description:
  The week 2 derivation delivered as a sequence rather than a page, one step
  of the chain per slide, ending on the bench scored by hand
week: 2
date: 2026-08-10
arc: A
slides: /decks/week-02/
related:
  - sessions/02-frechet-distance
---

There is one formal lecture in SLOP8412.

The Fréchet distance has to be derived once, carefully. After that the course
leaves the whiteboard and moves to the measurement bench.

The lecture is called *Two Gaussians, One Number*. It starts from one
requirement, to compare two distributions without inventing correspondences
between individual samples, and arrives at the Gaussian Wasserstein-2 closed
form that FID uses. The last third separates the clean mathematical object
from the measurement pipeline built around it: Inception features, finite
samples, preprocessing, and a Gaussian fitted to whatever comes out.

## After this lecture you should be able to

- explain what a coupling is, and why the Wasserstein distance optimises over
  couplings;
- derive the mean and covariance decomposition in the Gaussian case;
- interpret the two terms of the FID expression;
- distinguish the Gaussian Wasserstein distance from the engineering choices
  that make it FID;
- name the four assumptions the rest of the semester audits.
