---
title: Video
description:
  FVD keeps the Gaussian distance but changes the features. Test what a
  temporal instrument preserves before transferring claims from images.
week: 8
date: 2026-09-28
arc: B
log: >-
  the lecture's three-instrument comparison and an audit plan separating measured toy results from untested FVD claims
required_reading: unterthiner-2019
further_reading: [chong-forsyth-2020]
spec:
  - you can say exactly what changed between FID and FVD and what did not
  - you have compared all three lecture instruments on the same sequence sets,
    with predictions, settings and observed scores recorded
  - you can demonstrate a toy feature invariance and design a separate test
    of temporal sensitivity in an actual FVD pipeline
related:
  - 03-the-instrument
  - 05-the-bias
---

Changing from images to video does not discharge the questions raised by
weeks 1 to 7. It changes which features must answer them. A video score can
respond to some temporal failures without detecting the one your application
cares about.

FVD keeps week 2's formula exactly. What it swaps is the instrument. Features
come from an I3D action-recognition network rather than Inception-v3.
Means and covariances are
estimated in that space, the same closed form is applied to them, and the
result is reported as a distance.

## What transfers

The distinction between population quantity and sample estimate transfers.
The formula is still nonlinear in estimated moments; changing the encoder
does not establish unbiasedness. Week 5's leading 1/N expansion depends on
smoothness and sampling assumptions, not on whether we call the observations
images or videos. Its coefficients and useful sample-size range must be
checked for the new protocol.

An extrapolation can be investigated, but a fitted intercept is not an
automatic correction. Inspect repetitions, fit residuals and sensitivity to
the N range, as week 5 required. A fixed finite reference remains finite.
Count N as the number of clips supplied to the video encoder, not the total
number of frames; overlapping clips also require a declared dependence
structure. An N-honest comparison still needs compatible reference data and
features, not merely matching numbers of clips.

## What does not

Neither a feature map nor the Gaussian summary promises complete temporal
sensitivity. Week 3 asked what information survives the encoder; week 6
showed that different distributions can still share the moments the score
uses. A feature response is necessary for detecting a change through this
pipeline, but it does not guarantee that the final distance detects it.

This is not a claim that FVD ignores time. Read Unterthiner and colleagues for
their sensitivity experiments. Identify one tested temporal distortion,
the comparison used and what the result supports. Keep an untested distortion
as a hypothesis, not as a known blind spot.

## Before the session

Bring week 4's protocol record and week 5's distinction between variation
and bias. Choose one temporal intervention, such as frame reordering, and
write down a prediction for the feature map before inspecting its score.
The lecture supplies a runnable toy; an actual I3D experiment is a separate
proposal, not a hidden requirement to train a video model.

## Exercise

### Measure the toy, name its limits

Open the [week 8 lecture](/lectures/week-08/). Predict how its frame marginals,
frame-to-frame differences and whole-sequence features will rank E and F.
Press **Measure all three instruments**. Keep the R-again baseline and both
candidate scores for each instrument, with the displayed seed, N, frames per
sequence and correlation. Repeat without changing the controls; each run
uses new draws, while instruments within one run share the same sequence sets.

Next set correlation to zero and repeat. Compare your predictions with the
observations before opening the lecture's Expected results. Its flagging
threshold is a demonstration heuristic, not a calibrated significance test.

On paper, take one short numerical sequence and a permutation of it. Write
out their pooled frame values to check whether that feature representation
changes. This checks a toy feature invariance. It does not make independently
drawn reference and candidate sets identical, and it is not a test of I3D.

### Design the test you have not run

Write an audit plan for an actual FVD comparison. Specify the clip sets, N,
encoder checkpoint, frame rate, clip length, preprocessing and intervention.
Keep an unchanged control and repeated reference draws. State which observed
change would count against your prediction and how you would assess sampling
variation. Distinguish failure to detect a difference from evidence of
equivalence.

Bring the toy results and this plan to your measurement log under separate
labels: **measured here** and **not tested here**. Any extrapolated video score
not computed must be marked not computed. Week 9 asks what human evidence
would cost; the final report must defend these same limits rather than
turning a toy invariance into a verdict about video quality.
