---
title: The instrument
description:
  Inception-v3 was trained to name a thousand ImageNet classes. The score
  measures distance in the space it built to do that.
week: 3
date: 2026-08-17
arc: A
log: >-
  the identity, rotation and rotation-plus-ReLU scores on saved samples, with N,
  seeds and a distinction between a toy Gaussian distance and image-based FID
required_reading: kynkaanniemi-2023
further_reading: [binkowski-2018]
spec:
  - you can say which layer the features come from and how many dimensions
    it has
  - you can state one way the classifier's objective shapes what the score
    can and cannot see
  - you have re-scored saved bench samples through a fixed toy feature map,
    checked a rotation-only control and labelled the resulting distances correctly
related:
  - 01-the-number
---

An exact distance can answer the wrong question if its features discard what
you care about. Week 2 justified a formula; it did not justify the space in
which we apply it. Load the network used by your FID implementation and inspect
what it was trained to distinguish.

Call the feature extractor **the instrument**. Standard image-based FID uses
2,048-dimensional Inception-v3 pool3 features, before the classification head.
The classifier was trained to distinguish a thousand ImageNet classes, not to
judge generative models. Record the checkpoint and layer, not just the network
family: these identify the space your score measures.

## What the space was built for

A classification objective rewards distinctions useful for its labels. It
does not guarantee sensitivity to every difference a viewer notices. This
does not mean we know every detail the trained network discards; that needs
measurement. But if two image sets produce identical feature vectors, more
precise downstream arithmetic cannot recover the missing distinction.

Keep that conditional claim separate from an observation about a particular
encoder. Week 8 will need it when changing from images to video, and week 10
will ask whether the measured distinctions agree with human judgements.

## Two things already known about it

Bińkowski and colleagues discuss non-Gaussian Inception activations, including
zeros introduced by ReLU. Fitting moments does not make the feature distribution
Gaussian. Week 2's expression still gives the squared Wasserstein distance
between the fitted Gaussians; it is not generally the squared Wasserstein
distance between the original feature distributions. The formula remains
well-defined while its interpretation becomes narrower.

Kynkäänniemi and colleagues show that aligning ImageNet classification
histograms can substantially reduce FID without improving image quality.
Before the session, identify their intervention, what stayed fixed, and the
evidence for the quality claim. Bring one limitation of transferring that
result to a different dataset or checkpoint.

## What the bench stands in for

Week 1's bench has no images or Inception network. Its synthetic vectors stand
in for feature outputs: R is standard Gaussian; A shifts the mean; B changes
the covariance. Applying week 2's formula to these moments is a toy Gaussian
distance, not standard image-based FID. The shorthand on the bench names the
formula being studied, not an image-evaluation protocol.

Changing the map while keeping the source samples fixed tests dependence on
the representation. It does not establish which map agrees better with people.

## Exercise

Use your week 1 notebook. Start with a two-dimensional projection so you can
inspect the calculation, then repeat on the 2,048-dimensional bench when
resources permit; label any unrun case **not computed**. Save one draw each
of R, A and B, with N and the sampling seed. Do not redraw between maps.

Write down a prediction for each candidate under identity, rotation only,
and rotation followed by coordinatewise ReLU. Fix one orthogonal matrix Q,
using a seeded QR decomposition, and apply the same Q to every set. ReLU
replaces negative coordinates by zero; it is not a trained replacement encoder.

Estimate means and full covariances after each map, retaining the same
covariance convention, arithmetic and square-root routine. Keep off-diagonal
entries. Make a table with three map rows and two candidate-score columns.
Record differences from identity, the map seed, Q and a numerical tolerance
chosen before comparing results.

Use rotation alone as the control: a common orthogonal change of coordinates
preserves the Gaussian distance. A discrepancy above tolerance challenges the
implementation or the control, not the feature-sensitivity claim. Resolve it
before interpreting ReLU. A negligible ReLU effect is also a result; do not
keep changing seeds until a preferred story appears.

In your measurement log, distinguish changed coordinates from changed source
samples. Explain why none of these toy scores is standard image-based FID.
Week 4 inherits this fixed-map comparison and asks what happens when the
preprocessing changes instead.
