---
title: What you would report instead
description:
  Defend your proposal by the standard built across the semester. Bring the
  final bench comparison and the conditions under which you would still report FID.
week: 12
date: 2026-10-26
arc: C
log: >-
  the final A, B and C comparison under finite FID, fitted FID∞, KID, density,
  coverage and your proposal, with protocols, baselines and a dated defence note
required_reading: jayasumana-2024
further_reading: [stein-2023, chong-forsyth-2020]
spec:
  - your replacement has been scored on the bench N-honestly against both
    FID and FID∞
  - you can say where your proposal fails, in the same terms you used for
    the score
related:
  - 05-the-bias
  - 09-human-evaluation
  - assessments/final-report
---

A replacement score earns trust through the evidence it survives, not through
its name. Bring your proposal and the final bench comparison, then defend
what they support. Week 5's estimator question and week 6's blind spot must
both survive into your conclusion.

## A proposal to measure yours against

Jayasumana and colleagues propose CMMD: CLIP embeddings compared using squared
maximum mean discrepancy with a Gaussian RBF kernel. They use an unbiased
estimator and report sample-efficiency improvements in their experiments.
That removes the Gaussian fit to embeddings, not the need to validate the
representation or the sampling protocol. Unlike week 7's cubic kernel, this
is a different kernel as well as a different feature extractor.

Before the session, identify one claim in the reading, the comparison that
supports it, and a setting it did not test. Distinguish an estimator's
unbiasedness from a finite result's uncertainty. Ask whether the human study
supports your intended use, and which baselines a reader would have to rerun.
Do not assume C remains invisible after changing the kernel.

CMMD's image pipeline cannot be run directly on our synthetic vectors as if
they were images. If you adapt its kernel to the bench, name that adaptation;
do not claim to have reproduced CLIP-based CMMD. The reading supplies a
proposal to interrogate, not a compulsory new implementation.

## Where proposals fail

Use the [week 11 lecture](/lectures/week-11/) to rehearse a claim with its
protocol and uncertainty attached. Then apply the final report's four questions
to your own proposal: estimator bias, blind spots, human agreement and adoption
cost. State the evidence for each, or justify its absence. A synthetic bench
result is not a human evaluation.

A useful proposal can still be difficult to compare with published work.
Bring week 11's strongest case for retaining FID, not a claim that adoption
proves validity. Name the condition under which you would report both measures
and what extra evidence the second earns. This is preparation for Part C,
not an additional marking criterion.

## The last entry

Prepare the final comparison before presenting. Score A, B and C under finite
FID, fitted FID∞, KID, density and coverage, and your proposal. These are the
session's bench columns, not a demand to apply every image or video tool to
the synthetic vectors.

At each finite N, reuse the same reference and candidate draws across methods
where their inputs permit it. Retain week 4's pinned Gaussian calculation;
name each additional implementation and any changed representation. Keep the
reference protocol, dimensions, seeds and repetitions beside the scores.
For FID∞, report the matched N ladder, draws per rung, fit checks and repeated
intercepts from the method practised in weeks 5 and 6.

At d = 2048, the population Gaussian-distance baselines are A = 5.12,
B ≈ 4.88 and C = 0. Label them separately from empirical scores and fitted
intercepts. A reduced-dimensional run has different baselines; declare it.
Keep density and coverage separate, and explain each column's direction of
interpretation. Do not compare numerical magnitudes across different metrics
as though they shared a scale.

Put the table in your [measurement log](/assessments/measurement-log/), with
the prediction it tests. Mark an unrun cell **not computed**, explain why and
identify the next check; it does not become completed required work. Keep
earlier entries intact. This final comparison consolidates the semester's
evidence rather than retrospectively making every week agree.

## Exercise

Follow the [final report's in-person format](/assessments/final-report/#in-person):
**eight minutes to present and four minutes to defend Part C**, twelve minutes
in total. Rehearse the timed presentation before the session. Define the
proposal, explain the controlled bench comparison and end with its most
important limitation. Leave the defence time for questions rather than extra
slides.

Bring the log and the archive that reproduces your reported numbers from a
seed. The assessment brief governs submission; this session adds no separate
deliverable or deadline. If a rerun disagrees, retain both results and trace
the changed condition instead of replacing the inconvenient one.

After the defence, add a dated note to the final log entry: the question that
most challenged your claim, what your evidence answered, and what remains
unresolved. Revise the report's conclusion accordingly. A narrower claim
supported by the measurements is a stronger ending than a new metric declared
the winner.
