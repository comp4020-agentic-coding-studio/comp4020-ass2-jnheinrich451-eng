---
title: Dropping the Gaussian
description:
  An unbiased estimator need not detect every difference. Compare KID,
  density and coverage against the bench's known Gaussian-distance baseline.
week: 7
date: 2026-09-21
arc: B
log: >-
  the KID, density and coverage strips for R-again, A, B and C at each stated d
  and N, separating population baselines from estimates and uncomputed FID∞
instrument: three-scores
required_reading: binkowski-2018
further_reading: [kynkaanniemi-2019, naeem-2020]
spec:
  - you can distinguish precision and recall from the density and coverage
    quantities plotted here
  - you can explain KID's unbiased estimator without claiming complete
    sensitivity or an exact answer from one finite sample
  - you have an N-honest comparison of A, B and C with R-again under the
    three plotted scores, labelled separately from the population baseline
related:
  - 05-the-bias
  - 02-frechet-distance
---

A replacement earns its place by detecting a difference that matters, not by
having a better estimator alone. Week 5 challenged estimation; week 6 challenged
what the quantity can see. Keep those questions separate while scoring the
same bench with new quantities.

## Fidelity and coverage are different questions

Kynkäänniemi and colleagues split fidelity from coverage using approximate
feature-space manifolds. Around each reference point, draw a ball reaching its
k-th nearest neighbour. Precision counts generated points inside that union;
recall reverses the roles, asking how much of the reference lies inside the
generated neighbourhoods. Neither is a direct human judgement of image quality.

Naeem and colleagues propose density and coverage to address weaknesses in
those estimates. These are the pair plotted below, not precision and recall.
With k = 5, density counts reference balls containing each candidate point,
averaged and divided by k. It can exceed one. Coverage is the fraction of
reference balls containing at least one candidate point; it lies between zero
and one. Use R-again as a finite-sample comparison, not an assumption that
every reference-like sample must score exactly one.

## What unbiased means here

Bińkowski and colleagues define KID using squared maximum mean discrepancy
with the cubic kernel k(x,y) = (xᵀy/d + 1)³ on Inception features. Our panel
applies that kernel to synthetic bench vectors, not images.

For fixed features and kernel, independent draws within and between the two
sets, and finite required moments, the U-statistic estimates this population
quantity without bias. It excludes self-pairs within each set and includes
all cross-set pairs. Each average estimates the corresponding expectation;
the pairs need not themselves be mutually independent. A finite estimate can
be negative even though population squared MMD is nonnegative. Do not clip it.

The nonlinear plug-in Gaussian formula generally lacks that unbiasedness.
But neither unbiased estimation nor abandoning a Gaussian fit guarantees
sensitivity to every distributional difference. Read the KID definition before
the session and identify the population quantity its estimator targets.

## Exercise: compare like with like

Write down whether each plotted score will separate C from R-again and how it
will distinguish A from B. The displayed closed form is a population
Gaussian-distance baseline. The panel does not estimate FID∞ or empirical FID.
Keep any separately fitted week 5 intercept in its own column with its N
ladder, reference protocol and variation; otherwise mark FID∞ **not computed**.

Start at d = 2048, N = 250. Each **draw and score** press draws a new reference,
an independent R-again, and A, B and C. All three plotted scores reuse those
same sets within the press. Press five times, waiting for completion each
time. Save a screenshot, d, N, press count and your reading of each strip.
Keep density and coverage separate; they do not define one combined ranking.

Then select d = 2 and d = 16, taking five presses at each. Both use N = 1000;
changing dimensions clears the old dots, so record before switching. This is
N-honest within each setting, but the 2048-to-2 comparison changes both d and N.
Use 2 versus 16 for the equal-N dimensional comparison. Each setting is a
different bench, not a fresh estimate of the same population score.

The strip-overlap verdict is descriptive, not a significance test. Repeat an
unexpected result; retain it rather than forcing an ordering. Then open the fold.

<details class="expected-results">
<summary>Expected results</summary>

C matches R's population mean and covariance, so its population Gaussian
distance is exactly zero. Independent finite draws need not have identical
empirical moments. A fitted FID∞ intercept is not guaranteed to be exactly zero.

C also matches all joint moments through degree three: its coordinates are
independent and its changed coordinate is symmetric with unit variance. Its
fourth moment differs. Therefore population cubic-kernel MMD² is zero too;
finite KID estimates still fluctuate. More samples do not give this kernel
sensitivity to the missing fourth-moment distinction.

In the recorded bench runs at d = 2048, C overlaps R-again under all three
plotted scores. Coverage separates C at d = 2 but not at d = 16 in those runs.
These are observations under specified settings, not impossibility theorems
for density or coverage. Different repeats may change the observed overlap.

The population baseline places B closer than A. At d = 2048 the recorded KID
runs separate A, while coverage exposes B's missing neighbourhoods. Disagreement
reflects different questions, not permission to select the favourable score.

</details>

In your measurement log, retain predictions beside observations and state one
limitation of each comparison. Week 12's replacement must face both tests:
what quantity it can detect, and how reliably the protocol estimates it.
