# SLOP8412 — content brief

What each page argues. CC drafts prose from this; the facts are fixed, the
sentences are not. Claims marked are from memory of the paper and
must be checked against the PDF before they ship. Everything else has been
read against the source.

---

## The bench (fixed for the whole course)

Feature space, d = 2048, so every number is checkable against a closed form.

| Name | Distribution | Role |
|---|---|---|
| **R** | N(0, I) | the reference set |
| **A** | N(0.05·**1**, I) | candidate: mean shifted, same covariance |
| **B** | N(0, 1.1·I) | candidate: same mean, wider covariance |

True scores (closed form, week 2):
- FID(A, R) = 2048 × 0.05² = **5.12**
- FID(B, R) = 2048 × (2.1 − 2√1.1) ≈ **4.88**

So **B is better than A**, by a little. The two candidates are chosen so the
finite-N bias can flip that ordering: B's wider covariance gives it the larger
bias term K, so at small N the estimate for B sits further above its true value
than A's does. Expect the ordering to invert somewhere below N ≈ 5,000 and
right itself above; the exact crossing is what `figures/fid-bias.py` must find
and report. If it does not invert, the constants change, not the story.

Every week that scores the bench states N and the implementation. Week 1 scores
at N = 10,000. Week 4 pins the implementation. Week 5 retires week 4's numbers
and introduces FID∞. From week 6 the bench is always scored N-honestly and with
FID∞ alongside FID.

Week 6 adds a third candidate, **C**: an equal mixture of N(+a·e₁, I − a²e₁e₁ᵀ)
and N(−a·e₁, I − a²e₁e₁ᵀ) with a = 0.9. Its mean is 0 and its covariance is I,
so FID(C, R) = **0** exactly, and it is bimodal along the first axis. That is
the blind-spot demonstration: the score cannot see anything past the second
moment.

---

## Sessions

### 1 · The number

- Open with a results table from any recent generative-modelling paper: a column
  of numbers to two decimal places, one bold. That column is what the semester
  is about.
- What a reported FID depends on besides the model: the reference set, the
  sample size, the feature extractor and its weights, the resize pipeline, the
  implementation. Five things, none of them usually stated in the table.
- Heusel et al. 2017 introduce the score in a paper about GAN training
  dynamics; the metric is a section, not the subject. They generate 50,000
  samples. No reason is given. (Verified.)
- Build the bench. Say why two candidates: one number tells you nothing; a
  comparison is the smallest unit of meaning the score has.
- Exercise: score A and B against R at N = 10,000. Record both numbers, the N,
  and the implementation. This is log entry 1.

### 2 · The Fréchet distance

- Shape: a derivation. One equation chain, worked.
- Wasserstein-2 between two distributions is an optimisation over couplings.
  For two Gaussians it has a closed form:
  d² = ‖μ₁ − μ₂‖² + Tr(Σ₁ + Σ₂ − 2(Σ₁Σ₂)^½). Source: Dowson & Landau 1982,
  cited via Heusel. (Not in readings.ts; name it in prose only via Heusel.)
- The step that needs the assumption: restricting the coupling to be jointly
  Gaussian. Say so, and say what breaks without it (no closed form; week 7
  returns here).
- Two forms of the cross term, (Σ₁Σ₂)^½ and (Σ₁^½ Σ₂ Σ₁^½)^½, have equal trace.
  The second is symmetric and numerically better. Week 4 cares.
- Exercise: compute FID(A, R) and FID(B, R) by hand from the bench parameters
  (both reduce to scalars times 2048). Match the library at large N. Note that
  the library is above both.

#### Deck figures (src/decks/week-02.deck.mdx)

Each figure is a script in `figures/`, exports SVG with a transparent
background, uses colours legible on both the site cream and the deck black,
and prints every plotted value to stdout. No figure is copied from a paper.

| Script | Shows | Slide |
|---|---|---|
| `figures/couplings.py` | Two 1-D Gaussians (μ = 0 and μ = 2, σ = 1) drawn as densities. Three couplings between them shown as connecting lines: an independent coupling, a poor monotone one, and the optimal (monotone, rank-preserving) one. The expected squared cost of each printed and labelled. | 3–4: what "inf over couplings" means |
| `figures/moments-only.py` | R = N(0, I) and C (the week 6 bimodal candidate, a = 0.9) as histograms along e₁, N = 20,000 each. Both have mean 0 and variance 1. Annotate the two moments and the FID of 0. | 5: what the Gaussian assumption throws away |
| `figures/bench-truth.py` | A, B, R as 1-σ ellipses in the (e₁, e₂) projection, with the two true distances annotated: FID(A,R) = 5.12, FID(B,R) = 4.88. Use the closed form, not samples. | 10–11: the worked numbers, seen |
| `figures/fid-vs-invN.py` | FID(A,R) and FID(B,R) estimated at N ∈ {500, 1000, 2000, 5000, 10000, 20000, 50000}, ten trials each, plotted against 1/N. Linear fit through each series. True values as dashed horizontals. Mark the crossing where the estimated ordering flips, or print that it did not. Caption names Chong & Forsyth Figure 2 as the figure's ancestor. Reused on the week 5 page as Figure 5.1. | 12: "every number you compute is above these" |

### 3 · The instrument

- Coin the term: **the instrument** is Inception-v3, the network whose
  2048-dimensional pool3 activations the score is computed on. It was trained
  to assign one of a thousand ImageNet labels. The score measures distance in
  the space it built for that job.
- Bińkowski et al. note that a noticeable fraction of Inception feature
  coordinates are exactly zero (ReLU), so the features cannot literally be
  Gaussian. (Verified, Appendix D.2.)
- Kynkäänniemi et al. 2023: the score is strongly driven by the
  ImageNet class histogram of the samples; matching class frequencies alone
  moves FID substantially without changing perceived quality; a small set of
  "fringe" features dominates.
- Bench: the bench simulates the instrument's output. Exercise: pass A, B and R
  through a second fixed map (a random rotation, then ReLU) and re-score. The
  number moves. Same samples, different instrument, different score.

### 4 · Getting it right

- Shape: a measurement, then a rule.
- Parmar, G., Zhang, R. and Zhu, J.-Y 2022: image resizing without
  anti-aliasing (as in several common library defaults) versus with it (PIL)
  changes FID on identical images by several points; JPEG compression and
  quantisation choices add more. Their clean-fid pins the pipeline.
- Numerics the bench can show: matrix square root of a 2048×2048 product in
  float32 versus float64; scipy `sqrtm` returning small imaginary parts;
  the symmetric form from week 2 behaving better. Hedge the count: "several
  public implementations" not "four" unless you have run four.
- Rule from here: one pinned implementation, stated in every log entry.
- Exercise: score the bench in float32 and float64 with both square-root forms.
  Record all four. Then pin one and say why.

### 6 · Blind spots

- Shape: a construction. No required reading; the bench is the argument.
- Introduce candidate C (above). Its first two moments equal R's. Its FID is
  zero. It is bimodal and R is not. Show the histogram along e₁.
- A candidate equal to a subsample of R scores 0 too: memorisation is
  invisible to a two-moment statistic.
- Distinguish: week 5 was the **estimator** failing (right quantity, wrong
  number). This week the **quantity** fails (right number, wrong quantity).
  A2 asks students to say which layer their construction breaks.
- Exercise: build a candidate D that scores *worse* than A and is visibly
  closer to R by any per-sample measure. Record FID and FID∞ N-honestly.

### 7 · Dropping the Gaussian

- Shape: a comparison scored three ways.
- Kynkäänniemi et al. NIPS 2019: precision and recall via k-nearest-
  neighbour manifolds in feature space; precision = fraction of generated
  samples inside the real manifold, recall the reverse.
- Naeem et al. 2020: those P/R fail sanity checks (two identical
  distributions do not score 1; outliers inflate the manifold); density and
  coverage fix both.
- Bińkowski et al.: KID is MMD with a polynomial kernel, has an **unbiased**
  estimator, and needs no Gaussian assumption. Say why: MMD² is a U-statistic
  in the samples; FID is a nonlinear function of estimated moments. (Verified,
  §3 and Appendix.)
- Bench: score A, B, C under FID∞, KID, and density/coverage, N-honestly.
  C is caught by coverage and by KID; FID gave it zero.

### 8 · Video

- Shape: a reading, short. This week has one workshop paper and is honest about it.
- Unterthiner et al. 2019: FVD replaces the instrument with an
  I3D network trained on Kinetics-400 and Kinetics-600 and keeps the
  formula. Everything else is FID.
- Therefore everything from week 5 transfers with no new work: same estimator,
  same K/N bias, same N-honesty requirement, same FID∞ repair.
- What does not transfer is any guarantee about time. A temporal failure is
  invisible exactly when the new instrument's features are insensitive to it.
  Do not claim a specific failure without checking Unterthiner's sensitivity
  experiments; frame it as a property of the instrument.
- Exercise: state, in one paragraph, what you would need to re-run from weeks
  1–7 to trust an FVD table. The answer is "all of it".

### 9 · Human evaluation

- Shape: a design exercise. Arc C begins: no closed forms from here.
- The bench has no images. Say so. It has been a model of the problem; this
  week is where the course meets the problem. A student should feel the shift.
- Stein et al. 2023 ran what they describe as the largest human evaluation of
  generative models to date, using psychophysics practice. (Verified, abstract.)
  Method, verified §3: each trial is a two alternative forced choice task, and
  the two alternatives are the *responses*, not two images. One image is shown,
  drawn either from a model or from the training set, and the participant
  chooses real or fake. Models are ranked by human error rate, the fraction
  misclassified. The design follows HYPE∞. Scale: over 1000 paid participants,
  207k responses, 41 models, 4 datasets.
- They reject the looser framing by name, which is the design point to teach:
  asking observers whether an image is "photo-realistic" carries "much more
  ambiguity than our two alternative forced choice assessment, and introduces
  various response biases into participants' judgments". (Verified, §3.)
- Design content: 2AFC versus rating scales; how many raters and images; inter-
  rater agreement and what level you would demand; the cost in hours × wage.
- Exercise: design and cost a rating study that could rank A versus B if they
  were images. Report the budget. That number is why this is rarely done.

### 10 · Correlation

- Shape: an argument from evidence.
- Stein et al. 2023: across their models and datasets, no existing metric
  strongly correlated with human judgement. (Verified, abstract.) They report
  Inception-based metrics treat diffusion models unfairly (title) and propose
  DINOv2-ViT-L/14 as the encoder that best improves on Inception-v3. The
  resulting metric is written FD_DINOv2, and Appendix E publishes it across
  every model they tested as an updated leaderboard. (Verified, abstract and
  Appendix D.2.) DINOv2-B/14 correlates nearly as strongly at roughly a quarter
  of the compute, so they suggest B/14 while developing a model and L/14 for
  final reported numbers. (Verified, Appendix D.2.)
- What they change is the *instrument*, not the distance: "we thus recommend
  using FD as-is given that its use is already widespread". Their stated grounds
  are that the encodings are "likely approximately Gaussian", so two moments
  suffice, and that a bias which "behaves similarly across generated datasets
  will have no impact in model rankings" — which is the assumption Chong and
  Forsyth's per-model slopes deny in week 5. They call both hypotheses unproven
  and leave them to future work. (Verified, Appendix D.3.) Week 3's term earns
  its keep here: the fix was to the instrument.
- Connect to week 5: a correlation study compares metric scores with human
  rankings, and the metric scores were computed at some N. Was it N-honest?
  Usually unstated.
- Exercise: write the one-paragraph method section for an N-honest correlation
  study. Note everything you had to fix that the papers did not.

### 11 · Why it persists

- Shape: institutional analysis. Completely straight. No jokes.
- The strongest case for reporting the score: every prior result carries the
  row, so a new paper without it cannot be placed; reviewers ask; the cost of
  the question falls on the author, not the reviewer; recomputing baselines
  under a new metric is work nobody is funded for.
- Kynkäänniemi et al. 2023 show the score can be moved by class-
  histogram matching alone, and it remains standard. Present that as a fact
  about incentives, not a scandal.
- Bench: score A and B one more time. The numbers have not changed since week
  1. Neither has the reason people would report them.
- Exercise: write the paragraph a paper would need to justify omitting FID.
  Then estimate how a reviewer reads it.

### 12 · What you would report instead

- Shape: presentations, and the bench's last scoring.
- Jayasumana et al. 2024 propose CMMD: CLIP embeddings with an
  MMD distance, unbiased, no Gaussian assumption, sample-efficient. It is a
  proposal of exactly the kind the final report asks for. Judge it by the
  course's standard: bias (week 5), blind spots (week 6), human correlation
  (week 10), and the week 11 cost.
- Most student proposals will fail on week 11, not on the maths. Say that
  before presentations, not after.
- The last log entry: A, B and C under every score the course has used.
- The only forward-looking paragraph in the course: what would have to be true
  of the field for the row to disappear from the table.

---

## Assessments (bodies)

### Measurement log
Twelve dated entries. Each records: what was scored, against what, at what N,
through which implementation, and the number. From week 5 both FID and FID∞.
Format: one Markdown file, one heading per week, tables allowed. Marked on
completeness and on whether discrepancies were written down or tidied away —
an entry that says "got 5.31, expected 5.12, do not yet know why" is worth
more than one that matches. The strongest logs read as a record of someone
finding out what their own numbers meant.

### A1 · Reproduce the number
Choose a published FID from a real paper (cite the paper, the table and the
page). Rebuild enough of the pipeline to compute it: same reference set if
obtainable, same N if stated, same instrument weights if you can find them.
Report your number next to theirs. Then account for the gap: every difference
between your setup and the paper's, named. Marked on the account, not the gap.
Almost nobody closes it. Format: one PDF of at most four pages covering Parts
A to C, plus an archive that re-runs Part A on a clean machine.
Strong submissions state what they could not determine from the paper and
what they assumed instead. Due end of week 5, because week 5 explains why the
standard deviations you computed did not warn you.

### A2 · Break the number
Construct a bench candidate that scores well and is visibly wrong, or scores
badly and is visibly fine. "Visibly" means by a per-sample measure you define
and defend. Submit the construction (reproducible from a seed), the scores
(FID and FID∞, N-honest against the bench), and the mechanism: which layer
your construction breaks — the estimator (week 5) or the quantity (week 6) —
and why. Format: code plus a three-page report. Strong submissions break the
quantity, because that is harder to repair. Due end of week 9.

### Final report
Propose what a paper should report in place of the score. Evaluate the
proposal by the standard this course applied to FID: its estimator bias, its
blind spots, its correlation with human judgement, its cost, and what it would
take for a reviewer to accept its absence of a FID row. Most proposals fail,
usually on the last point, and the mark is for saying where yours fails and
how badly. End with the condition under which you would still report FID.
Format: six pages plus the bench scored under your metric. Presentations in
week 12. Due end of week 12.

---

## Home page

**What you will do.** Build a bench in week 1: a reference distribution and two
candidates, small enough to run on a laptop and simple enough that every score
has a closed form. Re-score it every week with that week's method. Reproduce a
published number and account for the gap. Construct a candidate the score gets
wrong. Propose a replacement and judge it by the same standard. Keep a log.

**Who it is for.** Postgraduates who have trained or evaluated a generative
model at least once and have read a results table without asking what N was.
Assumes comfort with multivariate Gaussians, matrix decompositions, and Python
with NumPy. Not for anyone who wants to learn to build generative models;
this course never trains one. Not for anyone who needs the number to be fine.

---

## Policies (full draft)

**Attendance.** Sessions are not recorded. The bench is re-scored in the room.

**Late work.** Every deadline carries a grace period of 12 hours. Late
submissions are not accepted; after the grace period the entry is recorded as
absent, at the sample size it arrived with.

**Reporting.** Every number in every submission states its N, its reference
set and its implementation. A number without these is not a result and will
not be read as one.

**Precision.** Report scores to one decimal place. Week 5 explains why the
second is not yours to claim.

**Use of generative tools.** Permitted for code and for prose, and must be
disclosed, with prompts. Undisclosed use is a reporting failure under the rule
above, and is marked as one. Text produced by a model is subject to the same standard as a number
produced by one: state what generated it and at what setting.

**Academic integrity.** The School of Continuous Improvement applies the
University's policy without variation. Note that the bench is shared, so
identical scores are expected; identical explanations are not.

**Re-marks.** A different marker marks from scratch. Their mark replaces the
original, higher or lower. The course does not report the standard deviation
of its own marking.
