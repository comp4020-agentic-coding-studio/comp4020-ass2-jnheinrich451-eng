---
title: Getting it right
description:
  The same samples can receive different scores. Separate preprocessing
  from numerical arithmetic, then pin the protocol you can defend.
week: 4
date: 2026-08-24
arc: A
log: >-
  the controlled resize comparison, four numerical configurations with two candidate scores each, and the protocol you pinned
required_reading: parmar-2022
spec:
  - you have compared two candidate resize settings while keeping the source
    images, reference features and the rest of the scoring pipeline fixed
  - you have compared four numerical configurations on the same saved bench
    moments, reporting A and B separately and checking numerical residuals
  - the bench is scored through a single pinned implementation from here on,
    and you can say what it pins
related:
  - 02-frechet-distance
  - assessments/a1-reproduce-the-number
---

Two implementations can disagree without either generator changing. A lower
answer does not tell you which implementation to trust. Week 2 gave the bench
its population values; this week separates the decisions made between the
samples and the reported estimate. Week 5 will need those decisions held fixed
before it can ask what sampling changed.

## Resizing

Parmar and colleagues show that resizing and compression can change the
features and therefore FID, even when the source images have not changed.
Read their resizing comparison before the session. Identify what stayed fixed
and what the resize operation changed. Their clean-fid makes these pipeline
choices explicit; it does not turn every smaller result into a better model.

Distinguish a justified preprocessing choice from compatibility with a
published baseline. A careful pipeline can still be incompatible with that
baseline. A1 needs both the choice and the mismatch recorded.

## Numerics

The bench isolates arithmetic without image preprocessing. Week 2's two
square-root forms have the same trace in exact arithmetic. Finite precision,
near-singular covariance estimates and the chosen routine can produce
different numerical residuals. The symmetric form permits symmetric
eigendecomposition; the product form generally does not.

Do not silently discard imaginary parts, clip eigenvalues or add a diagonal
offset. Record any such treatment and its tolerance. A difference might be
roundoff, an implementation decision or a bug; the experiment must distinguish
them rather than declaring every disagreement harmless.

## The rule

Pin one implementation after the comparison. Keep its version, feature
weights, preprocessing, moment estimator and numerical settings beside the
score. Reuse that record in [A1](/assessments/a1-reproduce-the-number/): a
reproduction needs enough detail for another person to locate a discrepancy,
not just enough detail to obtain some number.

## Exercise

### Hold the images fixed

Choose fixed reference and candidate image lists, ideally from your planned
A1 reproduction. Record their counts and file identities. Before measuring,
predict whether changing candidate resizing will change the score.

Cache the reference features. Run the same candidate images twice, changing
only the candidate resize filter or its anti-aliasing setting. Keep output
resolution, pixel range, feature weights and downstream arithmetic fixed.
Use one implementation with a configurable resize step; switching entire
libraries would couple several changes. Record both settings and both scores,
including a negligible difference if that is what you observe.

The [Image lab](/image-lab/) is a preliminary identity/compression check, not
this resize experiment. Run the resize comparison in your own evaluation
script; a tiny image set can check a mechanism but cannot rank generators.

### Hold the moments fixed

Reuse week 1's reference and candidate draws, or draw them once and save the
arrays with their seed and N. Estimate moments once in float64. Evaluate
those same saved moments in float32 and float64, using both square-root
forms. This isolates the arithmetic after moment estimation.

Keep four rows, one per numerical configuration, with separate A and B
columns: eight scores in total. Record the routines, tolerances and residuals.
First check week 2's two-coordinate projection. Then evaluate the full
2,048-dimensional bench. Its population baselines are 5.12 and approximately
4.88; an empirical estimate need not equal either, so the gap alone is not
evidence of a numerical bug.

Check identical input moments against themselves and check the population
moments against week 2's hand calculation. State your numerical tolerance
before interpreting the residuals. Bring the resize comparison, the eight-score
table and one paragraph justifying your pinned protocol to the measurement
log. Week 5 adds new draws without changing that protocol.
