---
title: Human evaluation
description:
  The judgement the score stands in for. How a rating study is designed,
  what it costs, and why it is so rarely run.
week: 9
date: 2026-10-05
arc: C
required_reading: stein-2023
spec:
  - you have designed a rating protocol for the bench and costed it in
    hours and dollars
  - you can say what inter-rater agreement you would require before
    trusting it over the score
related:
  - 01-the-number
  - 06-blind-spots
  - assessments/a2-break-the-number
---

The bench has no images in it. It never has. R, A, B and C are vectors of
numbers standing in for what a network would have produced had there been
images, and every closed form this course has used depends on that.

From this week there are no closed forms. Arc C is about the thing the score
was standing in for, and that thing is a person looking at a picture.

## What the largest study actually did

Stein and colleagues report running the largest human evaluation of generative
models to date, following practice from psychophysics, on a design that
follows the HYPE∞ protocol with modifications. Copy the details carefully,
because the details are where these studies fail.

Each trial is a two alternative forced choice, and the two alternatives are
the responses rather than two images. A participant is shown one image, drawn
either from a model or from the training set, and answers real or fake. Models
are ranked by human error rate, the fraction classified wrongly, so a better
model is one that people get wrong more often. They report over 1000 paid
participants, 207,000 responses, 41 models and 4 datasets.

They also reject a looser design by name. Asking observers whether an image is
photo-realistic, they report, carries much more ambiguity than the forced
choice and introduces response biases into participants' judgments. Ambiguity
in the question becomes variance in the answer, and variance is the thing you
pay for.

## What it costs

Work an example before the session. Suppose two candidates differ by half a
percentage point in human error rate, around a rate of 30 percent. At eighty
percent power and the usual five percent significance level, separating them
needs roughly 130,000 trials each, so about 260,000 in total. At four seconds
a trial that is around 290 hours of paid attention, and at 25 dollars an hour
about 7,200 dollars, before screening, training, attention checks or rejected
work.

Halve the difference you want to detect and every one of those numbers
quadruples. That is the whole reason a number you can compute in a minute won
the argument.

## Exercise

Design a rating protocol that could rank A against B if they were images
rather than vectors, and cost it in hours and dollars from assumptions you
state.

Say what inter-rater agreement you would require before trusting the result
over a score you can compute in a minute. Then report the budget.
