---
title: Change the instrument
description:
  Moving from images to video does not establish what a score can see.
  Carry the earlier measurement checks into a different feature space.
week: 8
date: 2026-09-28
arc: B
lecture_format: formal
lecture_stage: outline
related:
  - lectures/week-05
  - sessions/08-video
  - sessions/03-the-instrument
---

A familiar formula does not validate a new instrument. Week 3 made the
feature extractor part of the argument; week 5 made the sampling protocol
part of the evidence. Moving to video means checking both again.

## Bring a testable failure

Choose a temporal failure you expect a video metric to miss. State the
controlled comparison that could prove you wrong. A compelling pair of
clips is a hypothesis about the instrument, not yet a measurement of it.

## The planned lecture

Follow the path from input to features to score. Mark what changes between
the image and video pipelines, then design a temporal perturbation test.
Use the week 5 protocol questions to decide what must be held fixed before
interpreting the resulting numbers.

The [week 8 session](/sessions/08-video/) supplies the reading and exercise.
The browser labs use synthetic distributions; they do not extract video
features or compute image-based FID or FVD.

## Carry it forward

Retain a proposed test, its controls and the claim its outcome would support.
The [week 11 lecture](/lectures/week-11/) will ask whether your final report
makes any stronger claim than that evidence permits.
