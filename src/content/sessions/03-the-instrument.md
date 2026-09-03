---
title: The instrument
description:
  Inception-v3 was trained to name a thousand ImageNet classes. The score
  measures distance in the space it built to do that.
week: 3
date: 2026-08-17
arc: A
spec:
  - you can say which layer the features come from and how many dimensions
    it has
  - you can state one way the classifier's objective shapes what the score
    can and cannot see
  - you have re-scored the bench through a second feature extractor and
    recorded how much the number moved
related:
  - 01-the-number
---

Load the network the score is computed on and look at what it was built for.
Inception-v3 was trained to assign one of a thousand ImageNet labels to a
photograph. Nothing in that training mentions generative models, image
quality, or distance between distributions.

Call it **the instrument**. Every FID in the literature is a distance measured
in the 2048-dimensional space of that classifier's pool3 activations, and the
instrument is what built the space.

## What the space was built for

A classifier learns to keep apart whatever its labels distinguish, and it is
free to discard everything they do not. Those thousand labels are mostly
objects and animals. Anything no two ImageNet classes ever disagree about can
be thrown away at no cost to the training objective, and a coordinate the
network threw away is a coordinate the score cannot measure.

So the question for the rest of the semester is not whether the score is
accurate. It is what the instrument was built to be sensitive to, and whether
that overlaps with what you care about.

## Two things already known about it

Bińkowski and colleagues note that a noticeable fraction of the activation
coordinates are exactly zero, which is what a ReLU does. A distribution with
an atom at zero in many of its coordinates is not Gaussian and cannot be made
Gaussian by fitting a mean and a covariance to it. Week 2's closed form is
being applied to features that do not satisfy the assumption it was derived
under.

Kynkäänniemi and colleagues report something sharper. They report that the
score is driven strongly by the ImageNet class histogram of the samples, that
matching class frequencies alone can move FID substantially without any change
a person would call an improvement, and that a small set of what they call
fringe features accounts for much of the effect. Read them for the mechanism
rather than for the headline.

## What the bench stands in for

The bench has no images in it and no network. What it has is the instrument's
output: 2048 coordinates, with R a standard Gaussian and A and B differing
from it in one moment each. Everything this course does to those vectors is
what FID does to activations.

That makes the instrument swappable, which is this week's experiment.

## Exercise

Pass A, B and R through a second fixed map: a random rotation, then a ReLU.
Nothing about the samples has changed. Re-score both candidates and record how
far each number moved, at what N, beside the originals from week 1.

Then say which of the two numbers is the FID. Both are.
