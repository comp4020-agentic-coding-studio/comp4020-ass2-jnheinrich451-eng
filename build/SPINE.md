# SLOP8412 — course spine

Frontmatter for every session and assessment. Bodies are written against this;
this is not written against bodies. Every `related:` edge here must resolve,
so create all entries before building.

Conventions
- `arc`, `required_reading`, `further_reading` are loose keys; the template must render them.
- `related:` uses bare ids within a collection, `collection/id` across.
- Every session from week 3 on has at least one `related:` edge to a session two or more weeks earlier.
- Reading keys below are the three already verified. Anything else is in the
  "to verify" table and must not enter `src/` until it has a `verified:` date.

## Lecture rhythm: 4+1

Weekly sessions remain the twelve-week backbone. A live introduction in
week 1 precedes four formal lectures, roughly three teaching weeks apart.
Dates follow the corresponding scheduled session, including the teaching break.

| Week | Format | Role in the argument | Later use |
|---|---|---|---|
| 1 | Live introduction | Meet the bench and observe sampling variation | Week 5 revisits the gap |
| 2 | Formal lecture | Derive the Gaussian squared distance | Week 5 separates population quantity from estimate |
| 5 | Formal lecture | Question the estimate using the pinned protocol | Week 8 tests what transfers to video |
| 8 | Formal lecture | Change the instrument without assuming its validity | Week 11 must defend the evidence behind a report |
| 11 | Formal lecture | Defend a reporting protocol with the semester's evidence | Week 12 presentations test that defence |

Weeks 5, 8 and 11 initially ship as explicitly labelled outline previews,
with existing session/lab links, not as completed slide decks. The week 2
deck is retained pending the author's separate refinement direction.

## Reading keys on every session

| Session | required_reading | further_reading |
|---|---|---|
| 01-the-number | heusel-2017 | |
| 02-frechet-distance | heusel-2017 | binkowski-2018, dowson-landau-1982 |
| 03-the-instrument | kynkaanniemi-2023 | binkowski-2018 |
| 04-getting-it-right | parmar-2022 | |
| 05-the-bias | chong-forsyth-2020 | binkowski-2018, heusel-2017 |
| 06-blind-spots | | binkowski-2018 |
| 07-dropping-the-gaussian | binkowski-2018 | kynkaanniemi-2019, naeem-2020 |
| 08-video | unterthiner-2019 | chong-forsyth-2020 |
| 09-human-evaluation | stein-2023 | |
| 10-correlation | stein-2023 | kynkaanniemi-2023 |
| 11-why-it-persists | kynkaanniemi-2023 | heusel-2017 |
| 12-what-you-would-report-instead | jayasumana-2024 | stein-2023, chong-forsyth-2020 |

---

## Sessions

### `sessions/01-the-number.md`

```yaml
title: The number
description:
  Where the score comes from, who reports it, and what a gap of 0.4 is
  taken to mean. The bench is built.
week: 1
date: 2026-08-03
arc: A
required_reading: heusel-2017
spec:
  - you can name three things a reported FID depends on besides the model
  - you have a working bench, two generators and a reference set, and have
    scored it once
  - you can say what sample size the paper that introduced the score used,
    and what reason it gave
related:
  - assessments/measurement-log
```

### `sessions/02-frechet-distance.md` (exists; align to this)

```yaml
title: The Fréchet distance
description:
  The closed form for two Gaussians, derived rather than quoted, and the
  assumption it smuggles in
week: 2
date: 2026-08-10
arc: A
required_reading: heusel-2017
further_reading: [binkowski-2018]
spec:
  - you can derive the closed form from the definition without notes
  - you can say which step requires the Gaussian assumption and what
    breaks without it
  - you have computed the distance on the bench by hand for a two
    dimensional projection and matched the library
related:
  - 01-the-number
```

### `sessions/03-the-instrument.md`

Inherits week 2's formula and week 1's saved bench samples; supplies the
feature-space distinction for weeks 4, 8 and 10. Compare identity, a common
orthogonal rotation and rotation-plus-ReLU without redrawing. The toy distances
are not standard image-based FID; the rotation alone is a numerical control.

```yaml
title: The instrument
description:
  Inception-v3 was trained to name a thousand ImageNet classes. The score
  measures distance in the space it built to do that.
week: 3
date: 2026-08-17
arc: A
required_reading: kynkaanniemi-2023
further_reading: [binkowski-2018]
spec:
  - you can say which layer the features come from and how many dimensions
    it has
  - you can state one way the classifier's objective shapes what the score
    can and cannot see
  - you have re-scored saved bench samples through a fixed toy feature map,
    checked a rotation-only control and labelled the resulting distances correctly
related:
  - 01-the-number
```

### `sessions/04-getting-it-right.md`

Inherits week 2's exact formula and baseline; supplies the pinned protocol for
A1 and week 5's sampling comparison. Compare candidate resizing with cached
reference features, then four arithmetic configurations on the same saved
moments. Keep A and B separately: eight scores, not four.

```yaml
title: Getting it right
description:
  The same samples can receive different scores. Separate preprocessing
  from numerical arithmetic, then pin the protocol you can defend.
week: 4
date: 2026-08-24
arc: A
required_reading: parmar-2022
spec:
  - you have compared two candidate resize settings while keeping the source
    images, reference features and the rest of the scoring pipeline fixed
  - you have compared four numerical configurations on the same saved bench
    moments, reporting A and B separately and checking numerical residuals
  - the bench is scored through a single pinned implementation from here on,
    and you can say what it pins
related:
  - 02-frechet-distance
  - assessments/a1-reproduce-the-number
```

### `sessions/05-the-bias.md` (exists; add these keys)

Inherits week 4's pinned implementation and week 2's population baseline.
FID∞ recording begins here: three lecture ladders at fixed settings, with
finite estimates, fitted intercepts and truth kept separate. Week 6 transfers
that practice to A and the student's own D. Retain week 4's original record.

```yaml
arc: B
log: >-
  the sampling protocol, seed, N and repetitions; the lecture's finite estimate,
  fitted FID∞ and population baseline, with the ladder and repeated intercepts
required_reading: chong-forsyth-2020
further_reading: [binkowski-2018, heusel-2017]
```

### `sessions/06-blind-spots.md`

Inherits week 5's first recorded fit and tests what estimation cannot repair.
Compare A and D using a shared ladder and declared reference protocol in the
student's notebook; the lecture cannot accept D. Carry the evidence into A2.

```yaml
title: Blind spots
description:
  A generator that memorised the reference set scores perfectly. What else
  the score cannot see, demonstrated on the bench.
week: 6
date: 2026-09-07
arc: B
log: >-
  the finite FID comparison and fitted FID∞ for A and your candidate D, with
  the shared ladder and reference protocol, and the per-sample measure chosen first
further_reading: [binkowski-2018]
spec:
  - you can construct a bench candidate that scores well and is obviously
    wrong, and say why the score cannot tell
  - you can distinguish a failure of the estimator from a failure of the
    quantity it estimates
related:
  - 01-the-number
  - 04-getting-it-right
  - assessments/a2-break-the-number
```

### `sessions/07-dropping-the-gaussian.md`

Inherits week 5's estimator/quantity distinction and week 6's candidate C;
supplies week 12's test of a replacement metric. Compare the actual plotted
KID, density and coverage estimates with a population Gaussian baseline, not
an alleged computed FID∞. Changing from d = 2048 to d = 2 also changes N;
use d = 2 versus d = 16 for the equal-N dimensional comparison.

```yaml
title: Dropping the Gaussian
description:
  An unbiased estimator need not detect every difference. Compare KID,
  density and coverage against the bench's known Gaussian-distance baseline.
week: 7
date: 2026-09-21
arc: B
required_reading: binkowski-2018
further_reading: [kynkaanniemi-2019, naeem-2020]
spec:
  - you can distinguish precision and recall from the density and coverage
    quantities plotted here
  - you can explain KID's unbiased estimator without claiming complete
    sensitivity or an exact answer from one finite sample
  - you have an N-honest comparison of A, B and C with R-again under the
    three plotted scores, labelled separately from the population baseline
related:
  - 05-the-bias
  - 02-frechet-distance
```

### `sessions/08-video.md`

Inherits week 3's feature question, week 5's sampling caution and week 6's
moment limitation. Supplies a measured toy comparison and an explicitly
untested FVD audit plan for week 9's human study and the final report.

```yaml
title: Video
description:
  FVD keeps the Gaussian distance but changes the features. Test what a
  temporal instrument preserves before transferring claims from images.
week: 8
date: 2026-09-28
arc: B
required_reading: unterthiner-2019
further_reading: [chong-forsyth-2020]
spec:
  - you can say exactly what changed between FID and FVD and what did not
  - you have compared all three lecture instruments on the same sequence sets,
    with predictions, settings and observed scores recorded
  - you can demonstrate a toy feature invariance and design a separate test
    of temporal sensitivity in an actual FVD pipeline
related:
  - 03-the-instrument
  - 05-the-bias
```

### `sessions/09-human-evaluation.md`

```yaml
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
```

### `sessions/10-correlation.md`

```yaml
title: Correlation
description:
  Does the score rank models the way people do? The studies that asked,
  and what they found.
week: 10
date: 2026-10-12
arc: C
required_reading: stein-2023
further_reading: [kynkaanniemi-2023]
spec:
  - you can cite a study where the score and human raters disagreed on a
    ranking, and say what changed the result
  - you can say what an N-honest correlation study would require
related:
  - 05-the-bias
  - 09-human-evaluation
```

### `sessions/11-why-it-persists.md`

```yaml
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
```

### `sessions/12-what-you-would-report-instead.md`

Inherits the estimator/quantity distinction from weeks 5 and 6, week 7's
metric comparison and week 11's reporting argument. Consolidates the final
log and prepares the final report defence: eight minutes to present and four
to defend Part C, following the assessment brief. Preserve distinct scales,
population baselines and fitted intercepts; record a dated post-defence note.

```yaml
title: What you would report instead
description:
  Defend your proposal by the standard built across the semester. Bring the
  final bench comparison and the conditions under which you would still report FID.
week: 12
date: 2026-10-26
arc: C
log: >-
  the final A, B and C comparison under finite FID, fitted FID∞, KID, density,
  coverage and your proposal, with protocols, baselines and a dated defence note
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
```

---

## Assessments (weights total 100)

### `assessments/measurement-log.md`

Weeks 1–4 retain the original measurements without requiring FID∞. Week 5
records three reduced-dimensional lecture ladders. From week 6 apply the fit
when assigned, starting with A and D. Keep finite estimates, fitted intercepts
and population baselines separate. "Not computed" must have a reason and does
not complete required work; later corrections are dated, not backfilled.

```yaml
title: Measurement log
description:
  One entry a week from week 1. Every entry records a number, the sample
  size it was computed at, and the implementation that produced it.
week: 12
due: 2026-10-30T12:00:00+10:00
weight: 10
marking:
  mode: weighted
  criteria:
    - name: Completeness across the twelve weeks
      weight: 50
    - name: Predictions checked against measurements
      weight: 50
spec:
  - twelve dated entries, one per teaching week
  - every number is accompanied by its N and its implementation
  - at least one entry compares a prediction recorded before measuring with
    the observed result and explains the agreement or discrepancy
related:
  - final-report
```

### `assessments/a1-reproduce-the-number.md`

```yaml
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
```

### `assessments/a2-break-the-number.md`

```yaml
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
```

### `assessments/final-report.md`

```yaml
title: Final report
description:
  Propose what you would report in place of the score, then evaluate your
  proposal by the standard this course applied to FID. Most proposals fail.
  Say how yours does.
week: 12
due: 2026-10-30T12:00:00+10:00
weight: 45
marking:
  mode: weighted
  criteria:
    - name: The proposal
      weight: 25
    - name: Evaluation by the course's own standard
      weight: 45
    - name: Honesty about where it fails
      weight: 30
spec:
  - your metric is scored on the bench against FID and FID∞
  - its bias, blind spots and human correlation are each addressed, or
    their absence is justified
  - the report names the condition under which you would still report FID
related:
  - a2-break-the-number
  - measurement-log
```
