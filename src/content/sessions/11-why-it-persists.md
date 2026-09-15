---
title: Why it persists
description:
  Comparability, reviewer expectation, and the cost of being the first
  table without the row. An honest account of why the number stays.
week: 11
date: 2026-10-19
arc: C
required_reading: kynkaanniemi-2023
further_reading: [heusel-2017]
spec:
  - you can make the strongest case for continuing to report the score,
    and mean it
  - you can name what it would cost a paper to stop
related:
  - 01-the-number
  - 04-getting-it-right
  - 07-dropping-the-gaussian
---

Open the results table of a generative modelling paper published this year,
then open one from 2019. Both carry an FID column. That continuity is the
strongest argument anyone has for the number, and it is a good argument.

## The case for the row

A score is only useful against other scores. Nine years of published results
carry FID, computed against reference sets that are named and architectures
that can be looked up. A new model reporting one can be placed in that record
immediately. A new model reporting none cannot be placed at all, and a reader
has no way to judge whether it beats the thing it says it beats.

Reviewers ask for it, and asking costs them nothing. The cost of answering
falls on the author, and it is small: one more evaluation against a reference
set they already have. The cost of refusing is a review saying the comparison
is incomplete, which is hard to argue with, because it is accurate.

Recomputing baselines under a different metric is the work that would end
this, and nobody is funded to do it. Every prior number would have to be
regenerated from checkpoints that are sometimes published and sometimes not,
by a person with no result of their own at the end of it. That work is a
public good, and public goods are underproduced.

## What the incentive produces

Kynkäänniemi and colleagues report that the score responds to matching the
ImageNet class histogram of the samples, with no corresponding change in what
a person would call quality. A model can be moved up the table by an
intervention that is not an improvement.

That result is published, it is cited, and FID remains standard. The reading
to take from it is not that the field is careless. It is that a metric's known
defects do not cancel the coordination value of everyone reporting the same
number, and coordination is what the row supplies.

## The bench, unchanged

Score A and B once more. The true values are still 5.12 and 4.88, fixed
since week 2, and B is still the closer candidate. Your estimates are not
those numbers, and at the sample sizes week 5 examined they need not even keep
that order. Ten weeks changed what you know about the estimate. They changed
nothing about the reason a researcher would report it.

The [week 11 lecture](/lectures/week-11/) makes you state the protocol behind a
claim like that one, runs it, and writes the sentence the evidence will
carry.

## Exercise

Write the paragraph a paper would need in order to justify omitting FID: what
it reports instead, why that suffices, and what a reader gives up.

Then write two sentences estimating how a reviewer reads that paragraph.
