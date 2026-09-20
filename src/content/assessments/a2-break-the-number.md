---
title: "Assignment 2: Break the number"
description:
  Construct a bench candidate that scores well and is visibly wrong, or
  scores badly and is visibly fine. Submit the set, the score and the
  mechanism.
week: 9
due: 2026-10-09T12:00:00+10:00
weight: 25
marking:
  mode: weighted
  criteria:
    - name: The construction
      weight: 40
    - name: The mechanism, stated in terms of the estimator or the quantity
      weight: 40
    - name: The write-up
      weight: 20
spec:
  - the candidate is reproducible from a seed
  - the score is reported N-honestly against the bench
  - you say which layer the failure lives in
related:
  - a1-reproduce-the-number
  - final-report
---

Build something the score gets wrong, then show exactly how you did it.

A candidate that scores well and is visibly wrong, or one that scores badly
and is visibly fine. Either direction counts. What is marked is whether you
can name the part of the machinery you exploited, and whether the object you
built matches the account you give of it.

Due end of week 9. Deadlines, extensions and the use of generative tools are
course-wide and live on the [policies page](/policies/).

## Before you start

1. Individual work. 100 points, worth 25 per cent of the course.
2. Three parts. Part A is 40 points, Part B 40, Part C 20. The marking
   criteria on this page are those three parts.
3. The parts are not independent. Part B must explain the object built in
   Part A, and Part C must report on both. A mechanism that does not match
   the construction earns nothing for either.
4. Generative tools are governed by the [policies page](/policies/). Read it
   before you start rather than before you submit.
5. Submit one PDF of at most three pages, and one archive that rebuilds your
   candidate from a single seed on a clean machine.

## Part A, the construction [40]

Build a bench candidate that scores well and is visibly wrong, or scores badly
and is visibly fine. "Visibly" means by a per-sample measure that you define
in this part and defend.

Score it against the bench N-honestly, with both FID and FID∞, and state N and
the implementation for each number.

Candidate C from week 6 is the worked example. It is not an acceptable
submission.

## Part B, the mechanism [40]

Say which layer your construction breaks.

If it is the estimator, show the bias term and how your candidate inflates it.
If it is the quantity, show which moments match and what the score therefore
cannot see. Name the week that predicted it.

One layer argued properly beats two named loosely. The stronger submissions
tend to break the quantity, because a broken estimator can be repaired by
measuring more and a broken quantity cannot be repaired at all.

## Part C, the write-up [20]

What would a reader of a results table have needed to see in order to catch
your candidate? One page.

This is the part that becomes your final report.

## In person

Ten minutes, week 10, at the [codewalk](/sessions/codewalk-a2/), which carries the day, the rooms and the booking. Your archive is run from its seed on our machine and the
score must reproduce to one decimal place. Then one question on Part B. Bring
your ID.
