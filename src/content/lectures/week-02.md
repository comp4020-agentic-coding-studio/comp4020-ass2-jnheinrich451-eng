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

The Gaussian distance is exact. Turning it into FID introduces measurement choices that the formula cannot justify.

[Work through the derivation](/sessions/02-frechet-distance/)

<nav class="lecture-route" aria-label="On this page">
  <a href="#the-route-through-the-lecture">Route</a>
  <a href="#read-the-geometry">Geometry</a>
  <a href="#check-the-result-on-the-bench">Worked example</a>
  <a href="#after-this-lecture-you-should-be-able-to">Learning checks</a>
</nav>

Use the arrow keys to advance through slides and equation reveals. The Week 02 control returns here. On a portrait phone, the deck becomes a vertical reading view with every derivation step visible; landscape keeps the presentation layout.

## The route through the lecture

| Stage | Question | Slides |
| --- | --- | --- |
| Compare | What makes one coupling cheaper than another? | 2–6 |
| Derive | Why do Gaussians reduce the search to means and covariances? | 7–12 |
| Audit | Which choices turn the distance into FID? | 13–17 |

There is one formal lecture in SLOP8412.

The Fréchet distance has to be derived once, carefully. After that the course
leaves the whiteboard and moves to the measurement bench.

The lecture is called *Two Gaussians, One Number*. It starts from one
requirement, to compare two distributions without inventing correspondences
between individual samples, and arrives at the Gaussian Wasserstein-2 closed
form that FID uses. The last third separates the clean mathematical object
from the measurement pipeline built around it: Inception features, finite
samples, preprocessing, and a Gaussian fitted to whatever comes out.

## Read the geometry

![Equal spread with shifted centres, followed by equal centres with different spreads.](../../assets/figures/location-vs-spread.svg)

In one dimension, the distance separates a difference in means from a difference in standard deviations. In higher dimensions, covariance also carries orientation and correlation. The second term measures covariance mismatch; it does not recover arbitrary distribution shape.

## Check the result on the bench

| Candidate | What changes from R | Population FID |
| --- | --- | --- |
| A | Mean: 0.05 in each of 2,048 coordinates | 2,048 × 0.05² = **5.12** |
| B | Covariance: 1.1I instead of I | 2,048 × (√1.1 − 1)² ≈ **4.88** |

B is closer under the closed form. Keep that ranking: [week 5 asks whether finite-sample estimates preserve it](/sessions/05-the-bias/).

## After this lecture you should be able to

- explain what a coupling is, and why the Wasserstein distance optimises over
  couplings;
- derive the mean and covariance decomposition in the Gaussian case;
- interpret the two terms of the FID expression;
- distinguish the Gaussian Wasserstein distance from the engineering choices
  that make it FID;
- name the four assumptions the rest of the semester audits.

## Take it to the instrument

[Week 3: what does Inception make visible?](/sessions/03-the-instrument/) Follow the same distributions through the representation that FID uses. The mathematics stays fixed; the measurement choices become the object of study.

<style>
  .lecture-route { display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; padding: 1rem 0; margin-block: 1.5rem; border-block: 1px solid var(--at-border); background: var(--at-bg); font-size: .85rem; z-index: 3; }
  body:has(.lecture-route) table { display: block; max-width: 100%; overflow-x: auto; font-size: .9rem; }
  body:has(.lecture-route) td, body:has(.lecture-route) th { overflow-wrap: anywhere; }
  main:has(.lecture-route) h2 { scroll-margin-top: calc(var(--at-nav-height) + 5rem); }
  main:has(.lecture-route) p { max-width: 68ch; }
  @media (min-width: 901px) { .lecture-route { position: sticky; top: var(--at-nav-height); } }
</style>
