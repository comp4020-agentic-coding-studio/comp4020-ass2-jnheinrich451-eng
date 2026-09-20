---
title: The number
description:
  The bold number in a results table is the field's account of what got
  better, and nothing in the table says what it was computed against. The
  bench is built here.
week: 1
date: 2026-08-03
arc: A
log: >-
  the two scores, their sample size, and the implementation that produced them
required_reading: heusel-2017
spec:
  - you can name three things a reported FID depends on besides the model
  - you have a working bench, two generators and a reference set, and have
    scored it once
  - you can say what sample size the paper that introduced the score used,
    and what reason it gave
related:
  - assessments/measurement-log
---

Open any generative modelling paper from the past three years and find the
table where it reports results. There is a column of numbers to two decimal
places, one of them in bold. Read down that column and you are reading the
field's account of what got better. Read across a row and you get a model
name, a parameter count, and then the number.

Nothing in the table says what the number was computed against.

## Five things the model does not decide

A reported FID depends on the model. It also depends on the reference set the
samples were scored against, the number of samples drawn to compute it, the
feature extractor and the exact weights loaded into it, the pipeline that
resized the images on the way in, and the implementation that did the
arithmetic. Change any one of those five and the number changes. A results
table states none of them, and a caption rarely states more than the name of a
dataset.

This is not sloppiness. Each of the five was settled once, by someone, and
then stopped being worth mentioning. The semester is an attempt to find out
what each of those settlements is worth.

## Where the number came from

Heusel and colleagues introduced the score in 2017. Read them for the shape of
the paper rather than for the metric: the subject is GAN training dynamics,
and the score arrives partway through as an instrument the argument needs.
Find the number of samples they generate, then look for the sentence that
argues for it. Come to the session able to state the figure and to say what
stands behind it.

## The bench

The bench is the object we score every week. It is small enough to run on a
laptop and simple enough that every score on it has a closed form, so you can
always tell whether a number is right. The reference set R is a standard
Gaussian in 2048 dimensions, the width of the feature space the score is
usually computed in. Two candidates sit against it. A is N(0.05·1, I), where
the mean is displaced and the covariance is untouched. B is N(0, 1.1·I), where
the mean is exact and the covariance is too wide.

Two candidates rather than one, because a single score says nothing. There is
no scale on which a score of five is good. A comparison is the smallest unit
of meaning the score has, and every claim this course makes about FID is a
claim about an ordering.

## Exercise

The [week 1 lecture](/lectures/week-01/) runs a small version of this bench in
your browser. Press draw again there first, and watch the estimate move while
the true value does not.

Score A and B against R at N = 10,000, through whatever implementation you
reach for first. Record both numbers, the sample size, and the name and
version of the implementation. That is entry one of your measurement log, and
every entry after it carries those same three things.
