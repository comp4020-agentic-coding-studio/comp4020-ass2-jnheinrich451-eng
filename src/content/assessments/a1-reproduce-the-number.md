---
title: "Assignment 1: Reproduce the number"
description:
  Take a published FID from a real paper. Reproduce it. Explain the gap.
  Marked on the explanation, not on the size of the gap.
week: 5
due: 2026-09-04T12:00:00+10:00
weight: 20
marking:
  mode: weighted
  criteria:
    - name: The reproduction attempt, pinned and repeatable
      weight: 30
    - name: Explanation of the discrepancy
      weight: 50
    - name: N-honesty of the comparison
      weight: 20
spec:
  - the paper, the number and its page are cited
  - the reproduction can be re-run by the marker from what is submitted
  - every difference between your setup and the paper's is named
related:
  - a2-break-the-number
---

Take a number somebody published and get it back.

Choose a published FID, rebuild enough of the pipeline to compute it yourself,
and report what you get beside what they got. Then account for the difference.
Almost nobody closes it, and the mark is in the account rather than in the size
of the gap.

Due end of week 5, which is the week that explains why the standard deviations
you computed did not warn you. Grace period 12 hours. Late submissions are not
accepted, and after the grace period the entry is recorded as absent, at the
sample size it arrived with.

## Before you start

1. Individual work. 100 points, worth 20 per cent of the course.
2. Three parts. Part A is 30 points, Part B 50, Part C 20. The marking
   criteria on this page are those three parts.
3. Generative tools may be used for code and for prose and must be disclosed,
   with prompts. Undisclosed use is a reporting failure under the course
   policy and is marked as one.
4. Submit one PDF containing Parts A to C, at most four pages, and one archive
   holding everything needed to re-run Part A on a clean machine.

## Part A, the reproduction [30]

Choose a published FID from a paper of your choice. Cite the paper, the table
and the page. Rebuild enough of the pipeline to compute it. Report your number
beside theirs, with N and implementation stated for both.

Match what you can: the same reference set if it is obtainable, the same N if
the paper states one, the same instrument weights if you can find them. Where
you cannot match, that is Part B's material rather than a failure.

## Part B, the account [50]

Every difference between your setup and theirs, named. Where the paper does
not say, state what you assumed and why.

This part is marked on completeness and honesty, not on the size of the gap. A
submission that closes the gap and cannot say how is worth less than one that
misses by a wide margin and can account for every step of it. The strongest
submissions are the ones where the assumptions are visible: what could not be
determined from the paper, what was assumed in its place, and roughly what
each assumption could be worth.

## Part C, the comparison [20]

Was your comparison N-honest? If it was not, say what it would take to make it
so, and what that would cost.

## In person

Ten minutes, week 6. You bring the PDF and the archive. We pick one difference
from Part B and ask you to defend it. Bring your ID.
