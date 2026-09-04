# Week 02 Deck — Two Gaussians, One Number

> Build specification for the SLOP8412 Week 02 lecture deck.
>
> **Course:** SLOP8412 — Advanced Fréchet Inception Distance  
> **Lecture:** Week 02 — The Distance  
> **Deck title:** *Two Gaussians, One Number*  
> **Target length:** 16 slides  
> **Primary goal:** derive the Gaussian \(W_2^2\) / Fréchet distance clearly, then show exactly where FID turns that mathematical object into a measurement instrument.

---

## 0. Design intent

This deck should **not** behave like a conventional text-heavy university slideshow.

The deck has one narrative:

> We want a distance between distributions.  
> Optimal transport gives the right question.  
> The general problem is hard.  
> Gaussians make it tractable.  
> The closed form depends only on mean and covariance.  
> FID then applies that result to Inception features.  
> The mathematics is clean; the instrument introduces assumptions.

The deck should feel like entering a **measurement room / calibration bench** inside the wider SlopU course site.

### Visual language

- Background: near-black.
- Primary accent: SlopU mustard/gold.
- Main text: warm off-white.
- Secondary text / inactive diagrams: desaturated warm grey.
- Warning / deliberately bad coupling: muted magenta-red.
- Use gold only for the mathematical object currently under discussion.
- Use thin rules, sparse grid lines, restrained monospace metadata.
- Avoid cyberpunk/neon styling.
- Avoid generic AI imagery.
- Avoid stock photography.
- Prefer diagrams, distributions, ellipses, feature pipelines, and mathematical annotations.

### Reusable slide grammar

Use only three main layouts:

1. **Claim + large visual**
2. **Three-way comparison**
3. **Equation board**

This keeps the deck visually coherent without making every slide identical.

### Density rule

Every normal teaching slide should contain at least **two** of:

- a claim,
- a visual/evidence object,
- a mathematical object.

A slide with only 2–4 sentences and no visual or equation should normally be merged into another slide.

### Progressive disclosure rule

Do **not** create separate slides just to reveal one extra line of the same equation.

If animation/reveal is supported, reveal within one slide.

---

# 1. Slide plan

---

## Slide 01 — TWO GAUSSIANS, ONE NUMBER

### Purpose
Open with restraint. This is one of the few intentionally sparse slides.

### Content

**TWO GAUSSIANS,  
ONE NUMBER.**

Small metadata:

`SLOP8412 / LECTURE 02 / THE DISTANCE`

Small line near bottom:

> Where FID gets its mathematics — before we ask whether it deserves our trust.

### Visual
No decorative image. A single thin gold line or tiny covariance-ellipse motif is enough.

---

## Slide 02 — THE NUMBER WE ARE TRYING TO EXPLAIN

### Purpose
Give students the destination before beginning the derivation.

### Main equation

\[
\mathrm{FID}
=
\|\mu_r-\mu_g\|_2^2+
\operatorname{Tr}
\left(
\Sigma_r+\Sigma_g
-2(\Sigma_r^{1/2}\Sigma_g\Sigma_r^{1/2})^{1/2}
\right)
\]

### Visual decomposition

Split the equation visually into two labelled regions:

**LOCATION**

\[
\|\mu_r-\mu_g\|_2^2
\]

**SHAPE**

\[
\operatorname{Tr}
\left(
\Sigma_r+\Sigma_g
-2(\Sigma_r^{1/2}\Sigma_g\Sigma_r^{1/2})^{1/2}
\right)
\]

### Bottom line

> By the end of this lecture, every symbol on this slide should have a reason to be here.

---

## Slide 03 — FID DOES NOT COMPARE IMAGES

### Purpose
Replace the current hollow “What we want” slide with an actual conceptual explanation.

### Left visual

Two individual samples:

`real image  ×  generated image`

Place a crossed-out connector between them.

Label:

**NO CANONICAL PAIR**

### Right visual

Two point clouds / small sample sets:

```text
REAL SET                     GENERATED SET

 •  • •                        • •
   •   •                      •   •
 •                            • •

       P          ↔            Q
```

### Main claim

> **We need a distance between distributions, not a matching between individual samples.**

### Small supporting line

A generative model is judged by the distribution it produces, not by whether one generated image corresponds to one particular real image.

---

## Slide 04 — SAME MARGINALS. DIFFERENT COUPLINGS.

### Purpose
Teach what a coupling changes while the marginals remain fixed.

### Main visual
Use the existing strong three-panel coupling figure, enlarged.

Panels:

1. **independent**
   \[
   \mathbb E(X-Y)^2 = 6
   \]

2. **counter-monotone**
   \[
   \mathbb E(X-Y)^2 = 8
   \]

3. **optimal / monotone**
   \[
   \mathbb E(X-Y)^2 = 4
   \]

Top-right:

\[
X\sim P,\qquad Y\sim Q
\]

### Bottom statement

> \(P\) and \(Q\) tell us where \(X\) and \(Y\) live.  
> They do **not** tell us how to pair them.

### Notes
This is the **only** slide that should use the full three-panel coupling visual. Do not repeat it on the next slide.

---

## Slide 05 — WASSERSTEIN AS A SEARCH

### Purpose
Introduce the Wasserstein-2 definition and annotate it.

### Main equation

\[
W_2^2(P,Q)
=
\inf_{\pi\in\Pi(P,Q)}
\mathbb E_{(X,Y)\sim\pi}
\left[\|X-Y\|_2^2\right]
\]

### Inline annotations

Annotate three parts with thin leader lines:

**\(\Pi(P,Q)\)**  
all joint distributions with marginals \(P\) and \(Q\)

**\(\|X-Y\|^2\)**  
transport cost

**\(\inf\)**  
choose the cheapest admissible coupling

### Bottom line

> Wasserstein distance asks for the cheapest way to make \(P\) and \(Q\) coexist.

---

## Slide 06 — WHY THIS IS HARD

### Purpose
Explain the structural problem without repeating the previous visual.

### Left side — GENERAL DISTRIBUTIONS

\[
\pi(x,y)
\]

> an entire joint density / coupling

\[
\Downarrow
\]

**infinite-dimensional optimisation**

### Right side — GAUSSIANS

\[
(\mu_P,\Sigma_P),\qquad
(\mu_Q,\Sigma_Q)
\]

\[
\Downarrow
\]

**finite-dimensional structure**

### Closing line

> **This lecture works because Gaussians are unusually cooperative.**

### Accuracy note
Do not frame the Gaussian solution as an arbitrary restriction to jointly Gaussian couplings. The FID approximation comes later, when arbitrary feature distributions are represented by fitted Gaussian moments.

---

## Slide 07 — START IN ONE DIMENSION

### Purpose
Build intuition before matrix algebra.

### Main setup

\[
P=\mathcal N(\mu_P,\sigma_P^2),
\qquad
Q=\mathcal N(\mu_Q,\sigma_Q^2)
\]

Show two bell curves.

### Optimal coupling construction

\[
X=\mu_P+\sigma_P Z
\]

\[
Y=\mu_Q+\sigma_Q Z
\]

Highlight **the same \(Z\)** in gold.

Then:

\[
X-Y=(\mu_P-\mu_Q)+(\sigma_P-\sigma_Q)Z
\]

Using \(\mathbb E[Z]=0\), \(\mathbb E[Z^2]=1\):

\[
\boxed{
W_2^2(P,Q)
=
(\mu_P-\mu_Q)^2
+
(\sigma_P-\sigma_Q)^2
}
\]

### Bottom line

> In 1-D, Wasserstein separates **where the distributions are** from **how wide they are**.

---

## Slide 08 — TWO THINGS ARE BEING MEASURED

### Purpose
Make the 1-D decomposition visual.

### Left panel — LOCATION

Two bell curves with equal width, shifted means.

\[
(\mu_P-\mu_Q)^2
\]

Label:

**same spread / different centre**

### Right panel — SPREAD

Two bell curves with same mean but different widths.

\[
(\sigma_P-\sigma_Q)^2
\]

Label:

**same centre / different spread**

### Bottom vocabulary

**mean mismatch = location**

**variance mismatch = spread**

---

## Slide 09 — NOW GO TO \(d\) DIMENSIONS

### Purpose
Explain why covariance matrices appear.

### Main setup

\[
P=\mathcal N(\mu_P,\Sigma_P)
\]

\[
Q=\mathcal N(\mu_Q,\Sigma_Q)
\]

### Visual
Use two 2-D covariance ellipses:
- shifted centres,
- different axis lengths,
- different orientations.

Annotate:

**MEAN**
- centre / location

**COVARIANCE**
- scale
- orientation
- correlation

### Bottom line

> In multiple dimensions, “spread” is no longer one number.

---

## Slide 10 — THE DERIVATION BOARD

### Purpose
Put the full algebraic reduction on **one slide**.

Do not split these four rows across four slides.

### Setup

\[
U=X-\mu_P,\qquad V=Y-\mu_Q
\]

### Row 01

\[
X-Y=(\mu_P-\mu_Q)+(U-V)
\]

### Row 02

\[
\mathbb E\|X-Y\|^2
=
\|\mu_P-\mu_Q\|^2
+
\mathbb E\|U-V\|^2
\]

### Row 03

\[
=
\|\Delta\mu\|^2+
\operatorname{Tr}
(\Sigma_P+\Sigma_Q-C-C^\top)
\]

with

\[
C=\mathbb E[UV^\top]
\]

### Row 04

\[
=
\|\Delta\mu\|^2+
\operatorname{Tr}(\Sigma_P+\Sigma_Q)
-
2\operatorname{Tr}(C)
\]

### Main box

> **Everything is known except the cross-covariance \(C\).**

### Notes
If reveal animation exists, reveal Row 01 → Row 04 on the same slide.

---

## Slide 11 — THE PROBLEM HAS COLLAPSED

### Purpose
Show what remains to optimise.

### Joint Gaussian block covariance

\[
\begin{bmatrix}
X\\Y
\end{bmatrix}
\sim
\mathcal N
\left(
\begin{bmatrix}
\mu_P\\
\mu_Q
\end{bmatrix},
\begin{bmatrix}
\Sigma_P&C\\
C^\top&\Sigma_Q
\end{bmatrix}
\right)
\]

Validity requires

\[
\begin{bmatrix}
\Sigma_P&C\\
C^\top&\Sigma_Q
\end{bmatrix}
\succeq 0
\]

### Right-side logic chain

```text
MINIMISE COST
      ↓
MAXIMISE Tr(C)
      ↓
subject to a valid joint covariance
```

### Bottom line

> The infinite-dimensional coupling problem has collapsed to a structured matrix problem.

---

## Slide 12 — THE GAUSSIAN SOLUTION

### Purpose
Reveal the closed form and connect it back to the 1-D result.

### Key result

\[
\max_C\operatorname{Tr}(C)
=
\operatorname{Tr}
\left[
(\Sigma_P^{1/2}\Sigma_Q\Sigma_P^{1/2})^{1/2}
\right]
\]

Therefore

\[
\boxed{
W_2^2(P,Q)=
\|\mu_P-\mu_Q\|_2^2+
\operatorname{Tr}
\left(
\Sigma_P+\Sigma_Q-
2(\Sigma_P^{1/2}\Sigma_Q\Sigma_P^{1/2})^{1/2}
\right)
}
\]

### Sanity check

In 1-D (or the commuting covariance case):

\[
\text{covariance term}
\rightarrow
(\sigma_P-\sigma_Q)^2
\]

### Bottom line

> The matrix expression is the multidimensional version of “centre + spread”.

---

## Slide 13 — FID ADDS AN INSTRUMENT

### Purpose
This is the conceptual hinge of the whole course.

### Pipeline

```text
REAL IMAGES
     ↓
INCEPTION-V3
     ↓
FEATURE VECTORS
     ↓
μr , Σr
                         ┐
                         ├── Gaussian W₂ ──→ FID
                         ┘
GENERATED IMAGES
     ↓
INCEPTION-V3
     ↓
FEATURE VECTORS
     ↓
μg , Σg
```

Annotate near Inception:

`ImageNet-trained representation`

Annotate near moments:

`retain only first two moments`

### Main statement

> **The Gaussian distance is the mathematics. Everything before it is a measurement decision.**

### Source grounding
Heusel et al. introduce FID by passing real and generated images through Inception, using the coding/pooling representation, fitting mean and covariance, assuming a multivariate Gaussian, and computing the Fréchet/Wasserstein-2 distance.

---

## Slide 14 — WHY PEOPLE BELIEVED THE NUMBER

### Purpose
Show that FID had a plausible empirical motivation.

### Main claim

> **WORSE IMAGES → LARGER FID**

### Visual
Recreate a clean 2 × 3 disturbance grid inspired by Heusel et al.:

- Gaussian noise
- Gaussian blur
- black rectangles
- swirl
- salt & pepper
- dataset contamination

For each mini-panel:
- tiny disturbance icon or image progression,
- simple rising FID curve.

### Bottom statement

> In the original experiments, FID increased monotonically as these disturbances became stronger.

### Source
Heusel et al. (2017), Figure 3 and associated discussion.

---

## Slide 15 — FOUR ASSUMPTIONS ENTER THE NUMBER

### Purpose
Show the assumptions later weeks will audit.

Use four vertical blocks.

### 1. REPRESENTATION
**Inception-V3** decides what visual differences are visible to the metric.

`→ Week 03`

### 2. COMPRESSION
A high-dimensional feature distribution is reduced to:

\[
\mu,\Sigma
\]

`→ Week 03 / 07`

### 3. GAUSSIANISATION
Only first and second moments survive.

`→ Week 07`

### 4. ESTIMATION
Finite samples estimate those moments.

`→ Week 05`

### Bottom line

> The formula is exact for Gaussians. FID is an engineered measurement pipeline around that formula.

---

## Slide 16 — THE DISTANCE IS CLEAN. THE INSTRUMENT IS NOT.

### Purpose
Close the lecture by opening the semester.

### Left side — MATHEMATICS

\[
W_2^2(\mathcal N_1,\mathcal N_2)
\]

**closed form**

**geometrically meaningful**

### Right side — INSTRUMENT

```text
images
 → preprocessing
 → chosen encoder
 → finite sample
 → estimated moments
 → Gaussian approximation
 → one scalar
```

### Teaser 01 — FINITE-SAMPLE EFFECT

Finite-sample FID is biased, and the bias depends on the generator; fixing the same \(N\) does not eliminate that generator-dependent bias.

### Teaser 02 — IMPLEMENTATION EFFECT

Low-level preprocessing choices such as resizing and compression can alter Inception activations and materially change FID.

### Final line

> **Next: what exactly is Inception measuring?**

`W03 / THE INSTRUMENT`

---

# 2. Optional worked example

If the existing R/A/B numerical example is used elsewhere in the course, keep **one** worked example only.

Recommended placement: between Slides 12 and 13.

If inserted, the deck becomes 17 slides.

## Optional Slide — WHICH MODEL IS CLOSER?

Show reference Gaussian \(R\), candidate \(A\), candidate \(B\).

Use the closed form to calculate:

\[
W_2^2(R,A)=5.12
\]

\[
W_2^2(R,B)\approx 4.88
\]

Then:

> **B wins.**

Small line:

> We will spend the rest of the course asking whether that ranking deserves to survive the full measurement pipeline.

Do not add multiple nearly identical arithmetic slides.

---

# 3. Content to delete from the current deck

Remove or merge:

- A standalone “What we want” slide containing only:
  > “A distance between distributions, not between samples.”
- A second slide repeating the exact same three coupling diagrams.
- Separate slides that reveal only one additional algebraic line of the same derivation.
- Repeated copies of the final FID equation used only as reminders.
- Text-only slides where most of the canvas is empty and the text does not need dramatic isolation.
- Any slide whose only function is “formula continuation”.

The deck should become **shorter in repeated material and richer in explanation**.

---

# 4. Figure / asset requirements

## Figure A — Coupling comparison
Keep the existing three-panel concept:
- independent,
- counter-monotone,
- monotone / optimal.

## Figure B — 1-D location vs spread
Two mini-panels:
- same variance, shifted mean;
- same mean, different variance.

## Figure C — 2-D covariance ellipses
Two Gaussians represented as covariance ellipses showing centre, principal axes, and orientation.

## Figure D — FID pipeline
Custom diagram:
real/generated images → Inception-V3 → feature vectors → moments → Gaussian \(W_2\) → FID.

## Figure E — Original disturbance sanity check
Redraw the logic of the Heusel disturbance experiment instead of pasting a full PDF screenshot.

---

# 5. Mathematical notation conventions

Use consistently:

- \(P,Q\) for abstract distributions.
- \(X\sim P,\;Y\sim Q\) for coupled random variables.
- \(\pi\in\Pi(P,Q)\) for a coupling.
- \(\mu_P,\Sigma_P\) and \(\mu_Q,\Sigma_Q\) in the derivation.
- \(\mu_r,\Sigma_r\) and \(\mu_g,\Sigma_g\) only after moving to FID.
- \(C=\mathbb E[UV^\top]\) for cross-covariance.
- \(W_2^2\) throughout.

Avoid switching between \(m,C\), \(\mu,\Sigma\), and other notation without an explicit reason.

---

# 6. Mathematical accuracy notes

## Gaussian Wasserstein wording

Do **not** write:

> “We approximate Wasserstein distance by restricting the coupling to jointly Gaussian couplings.”

Prefer:

> “For Gaussian marginals, the Wasserstein-2 problem admits the Gaussian / affine structure that yields the closed form.”

The FID approximation comes later:

> arbitrary Inception feature distributions are represented by fitted Gaussian moments.

## Matrix square root form

Prefer the symmetric positive-semidefinite expression:

\[
\operatorname{Tr}
\left(
\Sigma_P+\Sigma_Q
-
2(\Sigma_P^{1/2}\Sigma_Q\Sigma_P^{1/2})^{1/2}
\right)
\]

rather than presenting \((\Sigma_P\Sigma_Q)^{1/2}\) without qualification.

---

# 7. Source grounding

## Heusel et al. (2017)
**GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium**

Use for:
- original FID motivation,
- Inception feature representation,
- first-two-moments / Gaussian assumption,
- Fréchet / Wasserstein formula,
- 50,000 generated images in the reported setup,
- disturbance experiment where FID rises with corruption level.

Relevant material:
- Section 3, “Performance Measure”
- Figure 3

## Chong & Forsyth (2020)
**Effectively Unbiased FID and Inception Score and where to find them**

Use only as a closing teaser:
- finite-sample FID is biased,
- the bias depends on the generator,
- fixing \(N\) is therefore insufficient.

Save \(FID_\infty\) for Week 05.

## Parmar, Zhang & Zhu (2022)
**On Aliased Resizing and Surprising Subtleties in GAN Evaluation**

Use only as a closing teaser:
- resizing choices can introduce aliasing,
- low-level preprocessing affects Inception activations,
- compression/JPEG can materially affect FID.

Save detailed Clean-FID content for the implementation-focused week.

## Unterthiner et al. (2019)
**FVD: A New Metric for Video Generation**

Do not teach FVD here.

Optional speaker-note connection:
- FVD reuses the same Gaussian Fréchet machinery with video features.

---

# 8. Lecture-page copy

## Two Gaussians, One Number

There is one formal lecture in SLOP8412.

The Fréchet distance has to be derived once, carefully. After that, the course leaves the whiteboard and moves to the measurement bench.

This lecture starts from a simple requirement — compare two distributions without inventing sample-to-sample correspondences — and arrives at the Gaussian Wasserstein-2 closed form used by FID. The final part separates the clean mathematical object from the practical measurement pipeline built around Inception features, finite samples, preprocessing, and Gaussian moment fitting.

**After this lecture you should be able to:**

- explain what a coupling is and why Wasserstein distance optimises over couplings;
- derive the mean/covariance decomposition of the Gaussian case;
- interpret the two terms of the FID expression;
- distinguish Gaussian Wasserstein distance from the engineering choices that make it “FID”;
- identify which assumptions the rest of the semester will audit.

---

# 9. Build acceptance checklist

- [ ] Exactly one full coupling-comparison visual appears.
- [ ] No derivation is spread across multiple nearly identical slides.
- [ ] The 1-D case appears before the matrix case.
- [ ] Covariance is explained visually with ellipses.
- [ ] The whole algebraic reduction fits on one derivation-board slide.
- [ ] The FID pipeline is visually separated from the Gaussian mathematics.
- [ ] At least one slide explains why FID originally looked convincing.
- [ ] The closing slide points explicitly to later weeks.
- [ ] No normal content slide is mostly empty without a deliberate rhetorical reason.
- [ ] Equations use consistent notation.
- [ ] Gold accent marks the active mathematical object, not decoration.
- [ ] Paper evidence is paraphrased/redrawn rather than pasted as full-page screenshots.
- [ ] Speaker notes contain source references for research-derived claims and figures.
