---
title: Correlation
description:
  Does the score rank models the way people do? The studies that asked,
  and what they found.
week: 10
date: 2026-10-12
arc: C
required_reading: stein-2023
further_reading: [kynkaanniemi-2023]
spec:
  - you can cite a study where the score and human raters disagreed on a
    ranking, and say what changed the result
  - you can say what an N-honest correlation study would require
related:
  - 05-the-bias
  - 09-human-evaluation
---

Put the ranking a score produces beside the ranking people produce, for the
same models, and ask whether the two agree. That question decides whether any
of the previous nine weeks was worth doing.

Stein and colleagues asked it at scale. Across their models and datasets, no
existing metric correlated strongly with human judgement.

## What they did about it

They report that Inception-based metrics treat diffusion models unfairly, and
they put the cause in the instrument rather than in the arithmetic. Their
replacement is DINOv2-ViT-L/14, which they propose as the encoder that best
improves on Inception-v3, and the metric built on it is written FD_DINOv2.
Appendix E of their paper publishes it across every model they tested, as a
leaderboard you can read against the FID one. They report that DINOv2-B/14
correlates nearly as strongly at roughly a quarter of the compute, and suggest
B/14 while a model is being developed with L/14 kept for numbers that get
reported.

Week 3's term earns its keep here. The fix was to the instrument, and the
distance was left alone.

## The recommendation worth arguing with

They say it plainly: "we thus recommend using FD as-is given that its use is
already widespread." Their grounds are two. That the encodings are likely
approximately Gaussian, so two moments suffice. And that a bias behaving
similarly across generated datasets will have no impact on model rankings.

Read the second against week 5. Chong and Forsyth fit the bias separately for
each model and found the slopes differ substantially between them, which is
exactly the case where a bias does move a ranking. Stein and colleagues call
both hypotheses unproven and leave them to future work, which is honest and
also leaves the question sitting there.

## What these studies rarely say

A correlation study compares metric scores against human rankings, and every
one of those metric scores was computed at some N. Whether the comparison was
N-honest is almost never stated. Where it was not, some part of the
disagreement being reported is the estimator rather than the metric, and
nobody can say which part.

## Exercise

Write the one-paragraph method section for an N-honest correlation study: the
sample sizes, the reference set, the instrument, and the human protocol from
week 9. The bench cannot stand in for this one, and saying why is part of the
paragraph.

Note everything you had to specify that the papers you read did not.
