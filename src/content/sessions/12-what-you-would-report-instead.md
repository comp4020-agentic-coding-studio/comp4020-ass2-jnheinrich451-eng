---
title: What you would report instead
description:
  Your proposal, judged by the standard you spent eight weeks applying to
  the score. Presentations, and the bench scored one last time.
week: 12
date: 2026-10-26
arc: C
log: >-
  every score this course has used, on A, B and C, N-honestly beside the closed forms
required_reading: jayasumana-2024
further_reading: [stein-2023, chong-forsyth-2020]
spec:
  - your replacement has been scored on the bench N-honestly against both
    FID and FID∞
  - you can say where your proposal fails, in the same terms you used for
    the score
related:
  - 05-the-bias
  - 09-human-evaluation
  - assessments/final-report
---

Bring your proposal and defend it in front of the room. Then score the bench
one last time.

## A proposal to measure yours against

Jayasumana and colleagues propose CMMD, which pairs CLIP embeddings with a
maximum mean discrepancy in place of the Fréchet distance. That makes the
estimator unbiased, drops the Gaussian assumption, and needs fewer samples. It
is exactly the kind of thing the final report asks you to produce, which makes
it the fairest object to test your own standard on.

Judge it the way you are about to be judged. Does it carry a bias that depends
on N, and would week 5's fit find it? Is there a candidate like C that it
scores perfectly and should not, and does week 6's construction survive the
change of instrument? Does it track human judgement better than what it
replaces, and measured by whom? And what would it cost a paper to report it
instead of the row every reader already knows how to read?

## Where proposals fail

Better said before the presentations than after: most proposals in this room
will fail on the last of those questions rather than on the mathematics. The
mathematics is the part you can check. A metric can be unbiased, blind to
nothing, well correlated with people, and still lose, because a reviewer
cannot place a number they have never seen among a literature of numbers they
have.

That is not an argument for proposing nothing. It is why the final report asks
where yours fails rather than whether it does.

## The last entry

Score A, B and C under every score this course has used: FID, FID∞, KID,
density and coverage, and whatever you are proposing. N-honestly, at a sample
size you state, through the implementation pinned in week 4.

Under the closed form A is 5.12, B is 4.88 and C is 0. Those three are fixed:
A and B since week 2, C since you built it in week 6. Every other number in that table is a claim about
the score in its column, and this is the only page of your log where the
columns can be set against each other, because for once every entry was
computed the same way.

## What would have to change

The row leaves the table when reporting something else costs less than
reporting it, and that needs three things: a metric with a published
leaderboard covering the models people actually cite, an argument a reviewer
accepts in one sentence, and a first paper willing to be the one without the
row. None of the three is a mathematical problem, and none of them is
impossible.

## Exercise

Present in ten minutes: the proposal, its bench numbers, and the place it
fails.

Bring the log.
