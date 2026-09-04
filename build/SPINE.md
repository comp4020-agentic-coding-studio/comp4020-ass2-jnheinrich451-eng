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

## Reading keys on every session

| Session | required_reading | further_reading |
|---|---|---|
| 01-the-number | heusel-2017 | |
| 02-frechet-distance | heusel-2017 | binkowski-2018 |
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
  - you have re-scored the bench through a second feature extractor and
    recorded how much the number moved
related:
  - 01-the-number
```

### `sessions/04-getting-it-right.md`

```yaml
title: Getting it right
description:
  The same reference set through different public implementations, and
  the different numbers that come back. Resizing, pixel ranges and the
  matrix square root, each in turn.
week: 4
date: 2026-08-24
arc: A
required_reading: parmar-2022
spec:
  - you can produce two scores for the same images that differ only in the
    resize filter, and say which is right
  - the bench is scored through a single pinned implementation from here on,
    and you can say what it pins
related:
  - 02-frechet-distance
  - assessments/a1-reproduce-the-number
```

### `sessions/05-the-bias.md` (exists; add these keys)

```yaml
arc: B
required_reading: chong-forsyth-2020
further_reading: [binkowski-2018, heusel-2017]
```

### `sessions/06-blind-spots.md`

```yaml
title: Blind spots
description:
  A generator that memorised the reference set scores perfectly. What else
  the score cannot see, demonstrated on the bench.
week: 6
date: 2026-09-07
arc: B
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

```yaml
title: Dropping the Gaussian
description:
  Precision and recall split fidelity from coverage. KID keeps the features
  and drops the Gaussian. The bench is scored all three ways.
week: 7
date: 2026-09-21
arc: B
required_reading: binkowski-2018
further_reading: [kynkaanniemi-2019, naeem-2020]
spec:
  - you can say what precision and recall each report that a single scalar
    cannot
  - you can state why KID's estimator is unbiased where FID's is not
  - you have an N-honest comparison of the two bench generators under all
    three scores
related:
  - 05-the-bias
  - 02-frechet-distance
```

### `sessions/08-video.md`

```yaml
title: Video
description:
  FVD swaps the instrument for an action classifier and keeps everything
  else. The bias comes with it. Temporal failures do not show.
week: 8
date: 2026-09-28
arc: B
required_reading: unterthiner-2019
further_reading: [chong-forsyth-2020]
spec:
  - you can say exactly what changed between FID and FVD and what did not
  - you can name one temporal failure that leaves the score unchanged, and
    show it
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

```yaml
title: What you would report instead
description:
  Your proposal, judged by the standard you spent eight weeks applying to
  the score. Presentations, and the bench scored one last time.
week: 12
date: 2026-10-26
arc: C
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
    - name: Discrepancies recorded rather than smoothed
      weight: 50
spec:
  - twelve dated entries, one per teaching week
  - every number is accompanied by its N and its implementation
  - at least one entry records a result you did not expect
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
    - name: The mechanism, stated in terms of the estimator or the instrument
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
