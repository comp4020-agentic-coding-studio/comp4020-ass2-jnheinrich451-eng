---
title: Change the instrument
description:
  Two honest numbers from the same recordings can disagree about which
  candidate is worse. Put three instruments on one bench and find out why.
week: 8
date: 2026-09-28
arc: B
instruments: true
lecture_format: formal
lecture_stage: ready
related:
  - lectures/week-05
  - sessions/08-video
  - sessions/03-the-instrument
---

A score is never a measurement of the thing. It is a measurement of the thing
through an instrument, and the instrument decides what counts as a difference
before any arithmetic happens. Week 3 made that argument about Inception.
This week it stops being an argument, because two instruments on this page
disagree about which of two candidates is worse, at the same sample size,
from the same recordings, with the same formula applied to both.

Nothing has gone wrong when that happens. That is the difficulty.

## Bring a testable failure

Bring one temporal failure you expect a video metric to miss, and the
controlled comparison that would prove you wrong. A convincing pair of clips
is a hypothesis about an instrument, not yet a measurement of one.

## Three instruments, one bench

The bench below is not video. It is the one property of video this lecture
needs: sequences whose neighbouring frames are related, so that the order of
the frames carries information. Set how many frames each sequence has, how
many sequences are drawn, and how strongly neighbouring frames are
correlated. Two candidates differ from the reference R in one way each. E
raises every frame by the same amount and leaves the order alone. F keeps
every frame value R produced and destroys only their order.

Then three instruments score them. **Frame marginals** pools every frame of
every sequence and fits one distribution to the values, which is what a
frame-wise measure sees. **Frame to frame** scores the differences between
consecutive frames. **Whole sequence** takes all the frames jointly, which is
what the bench has done since week 1.

## Read the first row first

The first row scores R against a second independent draw of R. Nothing
changed, and none of the three instruments reports zero, because week 5's
bias arrives here unaltered. That row is each instrument's floor, and no
other cell in its column means anything until you have read it.

Now read down. Frame marginals report F at its own floor: not a small
number, but the number that instrument produces when nothing changed at all.
Frame to frame does the same for E, because differencing removes any constant
and E is a constant. Each instrument is not merely less sensitive to one
candidate. It is blind to it.

## The disagreement

Frame to frame says F is the serious failure and E is not a failure at all.
Whole sequence says E is worse than F by a factor of three. Both comparisons
are N-honest. Both are computed from the same recordings, through the same
closed form. They disagree because they are not measuring the same thing, and
nothing in the score announces which one you are holding.

Set the correlation to zero and run it again. F becomes invisible to every
instrument, because with independent frames there is no order left to destroy.
The failure existed only because the recordings had something for it to
damage.

## Carry it forward

Record which instrument produced each number in your
[measurement log](/assessments/measurement-log/), beside the sampling protocol
week 5 asked for. Work the reading and the exercise in the
[week 8 session](/sessions/08-video/). The
[week 11 lecture](/lectures/week-11/) asks whether your final report claims
more than a named instrument at a named sample size can support.
