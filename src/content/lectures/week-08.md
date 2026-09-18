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
correlated. Each candidate starts from an independent draw of R's process.
E raises every frame by the same amount and leaves the order alone. F
permutes the frames within each sequence. It preserves the values in its own
draw, not those in the separate reference set. Each scored set is reused
across the three instruments, and the plot shows its first five sequences.

Then three instruments score them. **Frame marginals** pools every frame of
every sequence and fits one distribution to the values, which is what a
frame-wise measure sees. **Frame to frame** scores the differences between
consecutive frames. **Whole sequence** takes all the frames jointly, which is
what the bench has done since week 1.

## Read the first row first

The first row scores R against a second independent draw of R. Although the
population distributions match, sample estimates generally do not report
zero. Read this baseline before comparing the candidate scores; it is a
random baseline, not a lower bound on every possible score.

The labels use two independent baseline draws and an explicitly stated
demonstration threshold. A cell below that threshold is not flagged by the
heuristic. That is not a significance test or proof of blindness.

There are also exact properties we can establish from the construction:
pooling frame values discards their order, and taking consecutive differences
removes a constant shift. These operations lose information regardless of
where a particular finite-sample score lands.

## The disagreement

Before you run it, write down which of E and F you expect each instrument to
call further from R. Then press **Measure all three instruments** at the
default settings and record, for each instrument, the two scores and which candidate it ranks higher.
Record the actual scores, not only the order; another draw will not repeat
them exactly. Compare them with your prediction, then open the fold.

<details class="expected-results">
<summary>Expected results</summary>

Frame to frame should rank F higher, and whole sequence should rank E higher.
Expect that direction, not a fixed ratio or the same verdict on every draw.
The same recordings can support different rankings because the feature maps
preserve different properties before the Gaussian formula is applied.

</details>

Set the correlation to zero and run it again. Permuting independent,
identically distributed frames preserves their population distribution.
Finite samples can still produce nonzero scores and occasional flags; the
population invariance is not a promise about every displayed verdict.

## Carry it forward

Record which instrument produced each number in your
[measurement log](/assessments/measurement-log/), beside the sampling protocol
week 5 asked for. Work the reading and the exercise in the
[week 8 session](/sessions/08-video/). The
[week 11 lecture](/lectures/week-11/) asks whether your final report claims
more than a named instrument at a named sample size can support.
