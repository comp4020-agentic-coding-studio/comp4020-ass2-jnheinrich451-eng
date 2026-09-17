---
title: Video
description:
  FVD swaps the instrument for an action classifier and keeps everything
  else. The bias comes with it. Temporal failures do not show.
week: 8
date: 2026-09-28
arc: B
log: >-
  what you would have to re-run, from weeks 1 to 7, before trusting a published FVD table
required_reading: unterthiner-2019
further_reading: [chong-forsyth-2020]
spec:
  - you can say exactly what changed between FID and FVD and what did not
  - you can name one temporal failure that leaves the score unchanged, and
    show it
related:
  - 03-the-instrument
  - 05-the-bias
---

Read Unterthiner and colleagues this week, and read the header before the
method. It is a workshop paper, and the metric it proposes is now standard for
video generation. Both of those are true at once, and the second is not
evidence for the first.

FVD keeps week 2's formula exactly. What it swaps is the instrument. Features
come from an I3D network trained on Kinetics-400 and Kinetics-600 to recognise
human actions, rather than from Inception-v3. Means and covariances are
estimated in that space, the same closed form is applied to them, and the
result is reported as a distance.

## What transfers

Everything from week 5, without a line of new work. The estimator is the same
estimator, so it carries the same bias falling off as 1/N, the same dependence
of that bias on the model being measured, and therefore the same requirement
that any comparison be N-honest. The FID∞ repair applies unchanged, because
nothing in it ever referred to images.

A paper reporting FVD at one sample size against a baseline computed at
another has the week 5 problem, and has it for the same reason.

## What does not

Any guarantee about time.

FVD is a distance between distributions of features, so whether it can see a
temporal failure depends entirely on whether the features respond to that
failure. I3D was trained to name actions. What an instrument was optimised to
tell apart is what a score built on it can tell apart, which is week 3's
argument with a different network inside it.

Notice the shape of that claim. It is not that FVD ignores time. It is that
the burden of proof sits with the instrument, and Unterthiner's sensitivity
experiments are where you go to discharge it for a failure you care about.

The [week 8 lecture](/lectures/week-08/) puts the claim on a bench of its own.
Three instruments score the same recordings, each discards something
different before the arithmetic starts, and at the default settings two of
them rank the candidates in opposite orders.

## Before the session

Bring one temporal failure you believe these features would not register, and
the experiment that would settle whether they do. Do not assert it. The
exercise is to find out what knowing would cost.

## Exercise

Write one paragraph naming what you would have to re-run, from weeks 1 to 7,
before trusting a published FVD table.

The answer is all of it. The paragraph is for saying why, item by item.
