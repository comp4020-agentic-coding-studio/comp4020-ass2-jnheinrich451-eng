---
title: Getting it right
description:
  One reference set, four public implementations, four different numbers.
  Resizing, pixel ranges and the matrix square root, each in turn.
week: 4
date: 2026-08-24
arc: A
spec:
  - you can produce two scores for the same images that differ only in the
    resize filter, and say which is right
  - the bench is scored through a single pinned implementation from here on,
    and you can say what it pins
related:
  - 02-frechet-distance
  - assessments/a1-reproduce-the-number
---

Take one folder of images and one reference set, and score the pair through
several public implementations. The numbers do not agree, and they do not
disagree by a margin small enough to ignore.

None of those implementations is wrong. They differ in decisions the
definition of the score does not make.

## Resizing

Parmar and colleagues report that resizing images without anti-aliasing, which
several common library defaults do, against resizing with it, as PIL does,
changes FID on identical images by several points. They report that JPEG
compression and the choice of quantisation add more on top, and they argue the
anti-aliased result is the one to trust. Their clean-fid exists to pin the
pipeline rather than to improve the score, and it is worth reading for what a
pinned pipeline turns out to have to specify.

Several points is larger than most of the differences papers report as
progress.

## Numerics

The bench shows the rest without any images at all. The cross term from week 2
is a matrix square root of a 2048 by 2048 product, and computing it is where
the arithmetic starts to matter. In float32 the answer differs from the one
float64 gives. scipy's sqrtm returns small imaginary parts that somebody has
to decide what to do with. The symmetric form from week 2 behaves better than
the form the papers write down, which is why week 2 bothered with the
distinction at all.

None of these is a bug. Each is a choice, made once, inside a library, by
somebody who was not thinking about your comparison.

## The rule

From this week the bench is scored through a single pinned implementation, and
every log entry names it and its version alongside the number and the sample
size. A score without its implementation is not a measurement. It cannot be
reproduced and it cannot be compared, which are the only two things anyone
wants a score for.

A1 asks you to do this to somebody else's number, so practise it on your own.

## Exercise

Score the bench in float32 and in float64, with both forms of the square root.
That is four numbers for two candidates whose true distances are 5.12 and
4.88, and all four are estimates of those same two quantities.

Record all four with their sample size. Then pin one implementation and write
down why you chose it, in a sentence you would be willing to show a marker.
