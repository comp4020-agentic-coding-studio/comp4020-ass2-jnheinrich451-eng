---
title: The bench, live
description:
  The week 1 exercise as an instrument you can run in this page. Draw your
  own samples, score them, and watch the estimate disagree with the truth.
week: 1
date: 2026-08-03
arc: A
workbench: true
related:
  - sessions/01-the-number
---

The session tells you to score A and B against R and record what you get.
This page is the same exercise with the waiting removed, on a bench small
enough that your browser is the laptop.

Two controls set the candidate. The mean shift moves every coordinate of its
mean, and the covariance scale v widens every coordinate of its variance.
The other two set the measurement: d is how many dimensions the bench runs
in, and N is how many samples each press draws from R and from the candidate.

Press score and read two numbers. The true FID comes from the closed form,
straight from the parameters, with no sampling anywhere in it. The estimated
FID is computed from the N samples you just drew, the way every published
score is computed. Press draw again and the estimate moves while the truth
does not. Raise d toward 64 and the two stop being on speaking terms.

Everything here runs in your browser, through an implementation pinned
against the course's reference implementation, and nothing you press leaves
the page. Why the gap behaves the way it does is week 5's whole subject;
this page only lets you meet it early.
