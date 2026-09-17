# Session handles (temporary working file)

A map of what each session takes from earlier weeks and hands to later ones,
kept while the sessions are edited in batches. It is the one-line "inherits /
hands on" check CLAUDE.md asks for before any week is touched, written down
once so an edit to one week can be checked against every week that leans on
it. Untracked on purpose; delete or commit it when the batches are done.

## Facts every page must agree on

| Fact | Fixed in | Pages that state it |
|---|---|---|
| True FID: A 5.12, B 4.88 (d = 2048) | week 2 | home, 02, 04, 11, 12, lecture 2 |
| C's true FID is 0 | week 6 (C is built there) | home, 06, 07, 12 |
| B is truly closer than A; estimates need not say so | week 2 / week 5 | home figure, 02, 05, 11 |
| "the instrument" coined | week 3 | used 08, 10, lecture 8 |
| One pinned implementation from here on | week 4 | 05, 12 |
| "N-honest" coined | week 5 | used 06, 07, 08, 10, 12 |
| FID∞ used on the bench | from week 6 (05 says so) | 06, 07, 12 |
| Candidate D is the student's own | week 6 | home |
| Candidates E and F are sequences, not the 2048-d bench | lecture 8 | home, lectures 8 and 11 |
| Every log entry carries number, N, implementation | week 1 | 04, 05, 12 |
| Rating study at 30%, 0.5 points, 5%, 80%: 132,484 per candidate, 294 h, $7,360 | week 9 | 09 prose (held to its calculator by spec/rating-cost.test.ts) |
| Halving the difference multiplies trials by close to 4, not exactly (3.99 at the example, 3.5–4.03 across the calculator) | week 9 | 09 prose, calculator caption |
| KID (cubic kernel) cannot see C at any N: C matches R through the third moment, first differs at the fourth | week 7 | 07 prose, spec/week7.test.ts |
| At d = 2048 no score in week 7 sees C; they disagree about A and B (KID sees A, density and coverage call B missing, FID puts B closer) | week 7 | 07 prose, three-scores instrument |
| Coverage sees C at d = 2 and loses it by d = 16 | week 7 | 07 prose, three-scores instrument |
| A correlation study's verdict follows its budgets: 10 models, 400 trials, metric at N = 5,000 gives tau about 0.44 over [0.13, 0.69]; 40,000 trials and N = 50,000 give 0.94 | week 10 | 10 prose, rank-agreement instrument |
| At a small budget the metric tracks the truth (0.65) better than the study can see (0.44) | week 10 | 10 prose, rank-agreement instrument |

## Per session

| Wk | Arc | Takes from | Hands to | Coins / builds | In-page activity | Required reading |
|---|---|---|---|---|---|---|
| 01 | A | the results table (outside) | bench R, A, B; the five dependencies; log format → every week | the bench | lecture 1 workbench | heusel-2017 |
| 02 | A | 01 bench | closed form, 5.12 / 4.88 → 04, 05, 11, 12; two trace forms → 04; Gaussian step → 06, 07 | the population baseline | math-lab correlation; workspace activity; lecture 2 deck | heusel-2017 |
| 03 | A | 01 bench, 02 closed form | "the instrument" → 08, 10, lecture 8 | the instrument | workspace activity | kynkaanniemi-2023 |
| 04 | A | 02 trace forms | pinned implementation → 05, 12; A1 | the pin | workspace activity | parmar-2022 |
| 05 | B | 02 baseline, 04 pin | N-honest, FID∞ → 06, 07, 08, 10, 12 | N-honest, FID∞ | workspace activity; lecture 5 extrapolator | chong-forsyth-2020 |
| 06 | B | 05 estimator vs quantity, 02 moments | C → 07, 09, 12; D; A2 | C, the copy, D | workspace activity | (further only) |
| 07 | B | 05 FID∞, 06 C, 02 Gaussian | KID, density/coverage → 12; "nobody sees C" → 12's question about C | three scores on one bench, and none sees C | three-scores instrument (batch 3) | binkowski-2018 |
| 08 | B | 03 instrument, 05 bias and N-honest | temporal failure → lecture 8, 11 | FVD as a swapped instrument | lecture 8 instruments | unterthiner-2019 |
| 09 | C | 01–08 bench has no images | human protocol → 10, lecture 11, 12 | the cost arithmetic | rating-cost calculator (batch 2) | stein-2023 |
| 10 | C | 03 term, 05 slopes and N-honest, 09 protocol | N-honest correlation study → 12 | rank agreement as a measurement with its own budget | rank-agreement instrument (batch 4) | stein-2023 |
| 11 | C | 01 table, 02 values, 03 reading | the case for the row → 12, final report | | lecture 11 claim checker | kynkaanniemi-2023 |
| 12 | C | 04 pin, 05 fit, 06 C, 07 scores, 09 protocol | final report | the last log entry | **none** | jayasumana-2024 |

## Batches

1. Text fixes (this batch): 11's "They are 5.12 and 4.88" conflated true
   values with scores; 12 said C was fixed in week 2; 01, 05, 08 and 11 gain
   one sentence pointing at their lecture's instrument.
2. Week 9 cost calculator. Done: the prose's $7,200 was corrected to $7,400
   by its own arithmetic, and "quadruples" was measured rather than assumed.
4. Week 10: what a correlation study can see, built on week 5's bias slopes
   and week 9's trial budget. The verdict changes on budget alone.
3. Week 7: C scored by FID, KID and coverage. Done, and it reversed the
   week's claim: measured, KID and coverage do not see C on the bench. The
   author chose "nobody sees C" as the week's argument; the prose now says so
   and a spec test guards against the old claim returning.

Open, not in any batch: the citation rule in CLAUDE.md against author names
in every session body (author's decision). Session 06 has the author's
uncommitted edits in flight; not touched by any batch until they land.
