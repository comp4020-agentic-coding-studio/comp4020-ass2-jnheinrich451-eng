/**
 * The bench, in the browser.
 *
 * A second implementation of the score is exactly the situation week 4 warns
 * about, so this one is pinned: `figures/bench-reference.py` computes the same
 * quantities in numpy and writes `spec/bench-reference.json`, and the vitest
 * suite holds this file to it. Closed forms must agree to 1e-9; estimates
 * must land inside envelopes six standard errors wide.
 *
 * Everything here is dependency-free on purpose. The workbench ships on a
 * static site, is marked over someone else's connection, and must cost
 * nothing to load. At the capped d = 64 one full scoring is a few
 * milliseconds, most of it in the Jacobi eigensolver.
 *
 * The cross term uses the symmetric form (S1^1/2 S2 S1^1/2)^1/2 from week 2:
 * same trace as (S1 S2)^1/2, but symmetric, so a symmetric eigensolver
 * applies and no complex parts appear to be quietly discarded.
 */

export interface BenchParams {
  /** Mean shift in every coordinate: candidate mean = shift * 1. */
  shift: number;
  /** Variance scale: candidate covariance = v * I. */
  v: number;
  /** Dimension. The UI caps this at 64; the maths does not. */
  d: number;
}

export interface ScoreResult {
  estimate: number;
  /** First two coordinates of each sample, for the scatter. */
  reference2d: Array<[number, number]>;
  candidate2d: Array<[number, number]>;
}

/** Closed-form FID between N(0, I) and N(shift*1, v*I), exact. */
export function closedForm({ shift, v, d }: BenchParams): number {
  return d * shift * shift + d * (1 + v - 2 * Math.sqrt(v));
}

// --- seeded randomness ----------------------------------------------------
// splitmix32: small, well-distributed, and deterministic for a given seed,
// so "the same seed reproduces the same score" holds in the browser the way
// the assessments demand it of the students.

export function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    z = z ^ (z >>> 15);
    return (z >>> 0) / 4294967296;
  };
}

/** Standard normals via Box-Muller, spare value cached. */
export function gaussian(random: () => number): () => number {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return value;
    }
    let u = 0;
    while (u === 0) u = random();
    const r = Math.sqrt(-2 * Math.log(u));
    const theta = 2 * Math.PI * random();
    spare = r * Math.sin(theta);
    return r * Math.cos(theta);
  };
}

// --- linear algebra, d x d symmetric --------------------------------------

/** Eigenvalues and eigenvectors of a symmetric matrix, by cyclic Jacobi. */
export function eighSym(a: number[][]): { values: number[]; vectors: number[][] } {
  const d = a.length;
  const m = a.map((row) => row.slice());
  const vectors: number[][] = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (_, j) => (i === j ? 1 : 0)),
  );
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < d - 1; p++)
      for (let q = p + 1; q < d; q++) off += m[p][q] * m[p][q];
    if (off < 1e-22) break;
    for (let p = 0; p < d - 1; p++) {
      for (let q = p + 1; q < d; q++) {
        if (Math.abs(m[p][q]) < 1e-15) continue;
        const theta = (m[q][q] - m[p][p]) / (2 * m[p][q]);
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < d; k++) {
          const mkp = m[k][p];
          const mkq = m[k][q];
          m[k][p] = c * mkp - s * mkq;
          m[k][q] = s * mkp + c * mkq;
        }
        for (let k = 0; k < d; k++) {
          const mpk = m[p][k];
          const mqk = m[q][k];
          m[p][k] = c * mpk - s * mqk;
          m[q][k] = s * mpk + c * mqk;
        }
        for (let k = 0; k < d; k++) {
          const vkp = vectors[k][p];
          const vkq = vectors[k][q];
          vectors[k][p] = c * vkp - s * vkq;
          vectors[k][q] = s * vkp + c * vkq;
        }
      }
    }
  }
  return { values: m.map((row, i) => row[i]), vectors };
}

function matmul(a: number[][], b: number[][]): number[][] {
  const d = a.length;
  const out = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  for (let i = 0; i < d; i++)
    for (let k = 0; k < d; k++) {
      const aik = a[i][k];
      if (aik === 0) continue;
      for (let j = 0; j < d; j++) out[i][j] += aik * b[k][j];
    }
  return out;
}

/** Symmetric positive square root via the eigendecomposition. */
export function sqrtSym(a: number[][]): number[][] {
  const { values, vectors } = eighSym(a);
  const d = a.length;
  const roots = values.map((value) => Math.sqrt(Math.max(value, 0)));
  const out = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  for (let i = 0; i < d; i++)
    for (let j = 0; j < d; j++) {
      let sum = 0;
      for (let k = 0; k < d; k++) sum += vectors[i][k] * roots[k] * vectors[j][k];
      out[i][j] = sum;
    }
  return out;
}

function meanAndCov(samples: number[][]): { mean: number[]; cov: number[][] } {
  const n = samples.length;
  const d = samples[0].length;
  const mean = new Array<number>(d).fill(0);
  for (const row of samples) for (let j = 0; j < d; j++) mean[j] += row[j];
  for (let j = 0; j < d; j++) mean[j] /= n;
  const cov = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  for (const row of samples) {
    for (let i = 0; i < d; i++) {
      const ci = row[i] - mean[i];
      for (let j = i; j < d; j++) cov[i][j] += ci * (row[j] - mean[j]);
    }
  }
  for (let i = 0; i < d; i++)
    for (let j = i; j < d; j++) {
      cov[i][j] /= n - 1;
      cov[j][i] = cov[i][j];
    }
  return { mean, cov };
}

/** FID from two moment pairs, the same arithmetic every week uses. */
export function frechet(
  m1: number[],
  s1: number[][],
  m2: number[],
  s2: number[][],
): number {
  const d = m1.length;
  let meanTerm = 0;
  for (let j = 0; j < d; j++) {
    const diff = m1[j] - m2[j];
    meanTerm += diff * diff;
  }
  let trace = 0;
  for (let j = 0; j < d; j++) trace += s1[j][j] + s2[j][j];
  const root = sqrtSym(s1);
  const inner = matmul(matmul(root, s2), root);
  const { values } = eighSym(inner);
  let cross = 0;
  for (const value of values) cross += Math.sqrt(Math.max(value, 0));
  return meanTerm + trace - 2 * cross;
}

export type Candidate =
  | { kind: "gaussian"; shift: number; v: number }
  | { kind: "mixture"; a: number };

/** Draw N samples of R and of the candidate, and score the pair. */
export function score(
  candidate: Candidate,
  d: number,
  n: number,
  seed: number,
): ScoreResult {
  const normal = gaussian(rng(seed));
  const uniform = rng(seed ^ 0x5eed);
  const reference: number[][] = [];
  const sampled: number[][] = [];
  for (let i = 0; i < n; i++) {
    reference.push(Array.from({ length: d }, () => normal()));
    const row = Array.from({ length: d }, () => normal());
    if (candidate.kind === "gaussian") {
      const sigma = Math.sqrt(candidate.v);
      for (let j = 0; j < d; j++) row[j] = row[j] * sigma + candidate.shift;
    } else {
      const sign = uniform() < 0.5 ? -1 : 1;
      row[0] = sign * candidate.a + row[0] * Math.sqrt(1 - candidate.a * candidate.a);
    }
    sampled.push(row);
  }
  const r = meanAndCov(reference);
  const c = meanAndCov(sampled);
  return {
    estimate: frechet(r.mean, r.cov, c.mean, c.cov),
    reference2d: reference.map((row) => [row[0], row[1] ?? 0]),
    candidate2d: sampled.map((row) => [row[0], row[1] ?? 0]),
  };
}

// --- the week 5 extrapolator ----------------------------------------------
// Week 1 shows that an estimate at one N disagrees with the truth. Week 5
// asks what the disagreement is made of. A linear fit in 1/N models the
// leading bias trend; sampling variation and higher-order bias can remain.
// Its intercept estimates the unlimited-sample limit, not the bias itself.
//
// spec/bench-extrapolation.test.ts checks numerical agreement and variability,
// not a proof of unbiasedness for finite sample-size ladders.

/** Independent seeds for rung i, trial j of a ladder started at `seed`. */
function ladderSeed(seed: number, rung: number, trial: number): number {
  let z = (seed + Math.imul(rung + 1, 0x9e3779b9) + Math.imul(trial + 1, 0x85ebca6b)) >>> 0;
  z = Math.imul(z ^ (z >>> 15), 0x2c1b3c6d);
  return (z ^ (z >>> 12)) >>> 0;
}

/** Least squares of `mean` against 1/n: the line the ladder is read from. */
export function fitInverseN(
  points: Array<{ n: number; mean: number }>,
): { intercept: number; slope: number } {
  const k = points.length;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const { n, mean } of points) {
    const x = 1 / n;
    sx += x;
    sy += mean;
    sxx += x * x;
    sxy += x * mean;
  }
  const denominator = k * sxx - sx * sx;
  const slope = denominator === 0 ? 0 : (k * sxy - sx * sy) / denominator;
  return { intercept: (sy - slope * sx) / k, slope };
}

export interface Rung {
  n: number;
  /** Mean of `trials` independent estimates at this sample size. */
  mean: number;
  /** The individual estimates, so the page can show the spread it averaged. */
  draws: number[];
}

export interface LadderResult {
  rungs: Rung[];
  intercept: number;
  slope: number;
  truth: number;
}

/** One rung: `trials` independent scorings at sample size `n`. */
export function rung(
  candidate: Candidate,
  d: number,
  n: number,
  trials: number,
  seed: number,
  index = 0,
): Rung {
  const draws: number[] = [];
  for (let j = 0; j < trials; j++) {
    draws.push(score(candidate, d, n, ladderSeed(seed, index, j)).estimate);
  }
  return { n, mean: draws.reduce((a, b) => a + b, 0) / trials, draws };
}

/** The true score of a candidate, with no sampling in it. */
export function truthOf(candidate: Candidate, d: number): number {
  return candidate.kind === "mixture"
    ? 0
    : closedForm({ shift: candidate.shift, v: candidate.v, d });
}

/** A full ladder: every rung, and the line fitted through them. */
export function ladder(
  candidate: Candidate,
  d: number,
  sizes: number[],
  trials: number,
  seed: number,
): LadderResult {
  const rungs = sizes.map((n, index) => rung(candidate, d, n, trials, seed, index));
  const { intercept, slope } = fitInverseN(rungs);
  return { rungs, intercept, slope, truth: truthOf(candidate, d) };
}

// --- the week 8 instrument bench ------------------------------------------
// Week 3 named the instrument and argued that a score can only see what the
// instrument was built to tell apart. Week 8 puts that on the bench: the same
// recordings, scored through three instruments at once, each of which throws
// away something different before the arithmetic begins.
//
// Recordings are sequences of d frames from an AR(1) process, so neighbouring
// frames are correlated the way frames of a video are. The claims this makes
// about the resulting numbers are measured in figures/instruments-reference.py
// and held in spec/instruments.test.ts, including the two that matter most:
// each instrument is blind to one candidate, and two of them rank the
// candidates in opposite orders.

/** N sequences of d frames each. */
export type Recording = number[][];

export type SequenceCandidate =
  /** R itself, drawn again: what an instrument reports when nothing changed. */
  | "plain"
  /** E: every frame raised by the same constant. Order untouched. */
  | "shift"
  /** F: each sequence's frames permuted. Every frame value survives. */
  | "shuffle";

export type Lens =
  /** Every frame of every sequence, pooled into one distribution. */
  | "frame"
  /** Differences between consecutive frames. Constants cancel. */
  | "temporal"
  /** All d frames jointly, the instrument the bench has used since week 1. */
  | "joint";

export interface RecordingParams {
  n: number;
  d: number;
  rho: number;
  shift: number;
  seed: number;
}

/** Sequences whose neighbouring frames are correlated, marginals N(0, 1). */
export function ar1(n: number, d: number, rho: number, seed: number): Recording {
  const normal = gaussian(rng(seed));
  const innovation = Math.sqrt(1 - rho * rho);
  const out: Recording = [];
  for (let i = 0; i < n; i++) {
    const row = new Array<number>(d);
    row[0] = normal();
    for (let t = 1; t < d; t++) row[t] = rho * row[t - 1] + innovation * normal();
    out.push(row);
  }
  return out;
}

/** R, or one of the two week 8 candidates built from it. */
export function recordings(
  kind: SequenceCandidate,
  { n, d, rho, shift, seed }: RecordingParams,
): Recording {
  const base = ar1(n, d, rho, seed);
  if (kind === "shift") return base.map((row) => row.map((value) => value + shift));
  if (kind === "plain") return base;
  const random = rng((seed ^ 0x5417f1e) >>> 0);
  return base.map((row) => {
    const shuffled = row.slice();
    for (let i = d - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const swap = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = swap;
    }
    return shuffled;
  });
}

/** What one instrument passes through to the arithmetic. */
export function through(lens: Lens, x: Recording): number[][] {
  if (lens === "frame") return x.flatMap((row) => row.map((value) => [value]));
  if (lens === "temporal") return x.map((row) => row.slice(1).map((value, i) => value - row[i]));
  return x;
}

/** Score two sets of recordings as one instrument sees them. */
export function lensScore(lens: Lens, reference: Recording, candidate: Recording): number {
  const a = through(lens, reference);
  const b = through(lens, candidate);
  const left = meanAndCov(a);
  const right = meanAndCov(b);
  return frechet(left.mean, left.cov, right.mean, right.cov);
}

export type InstrumentTable = Record<SequenceCandidate, Record<Lens, number>>;

/** The recordings and their scores travel together; plots must use these rows. */
export function instrumentExperiment(params: RecordingParams) {
  const reference = ar1(params.n, params.d, params.rho, params.seed);
  const table = {} as InstrumentTable;
  const candidates = {} as Record<SequenceCandidate, Recording>;
  const kinds: SequenceCandidate[] = ["plain", "shift", "shuffle"];
  const lenses: Lens[] = ["frame", "temporal", "joint"];
  kinds.forEach((kind, index) => {
    // Every candidate is drawn independently of the reference, so a cell
    // never borrows luck from the draw it is compared against.
    const drawn = recordings(kind, { ...params, seed: (params.seed + 9973 * (index + 1)) >>> 0 });
    candidates[kind] = drawn;
    table[kind] = {} as Record<Lens, number>;
    for (const lens of lenses) table[kind][lens] = lensScore(lens, reference, drawn);
  });
  return {reference, candidates, table};
}

/** Compatibility wrapper for the numerical reference checks. */
export function instrumentTable(params: RecordingParams): InstrumentTable {
  return instrumentExperiment(params).table;
}

/** Shared two-baseline protocol for both the grid and every claim-checker run. */
export function instrumentMeasurement(params: RecordingParams) {
  const experiment = instrumentExperiment(params);
  const secondSeed = (params.seed ^ 0x7f4a7c15) >>> 0;
  const reference = ar1(params.n, params.d, params.rho, secondSeed);
  const plain = recordings('plain', {...params, seed: (secondSeed + 9973) >>> 0});
  const floors = {} as Record<Lens, number[]>;
  const verdicts = {} as Record<Lens, Verdict>;
  for (const lens of ['frame','temporal','joint'] as Lens[]) {
    floors[lens] = [experiment.table.plain[lens], lensScore(lens, reference, plain)];
    verdicts[lens] = verdictFor(lens, experiment.table, floors[lens]);
  }
  return {...experiment, floors, verdicts};
}

// --- week 11: what a declared protocol actually supports -------------------
// Week 11 asks a reader to state a claim and the protocol behind it, then
// runs that protocol repeatedly and reports what it supports. Two rules do
// the work, and both live here rather than in the page so the week 8 grid,
// the week 11 checker and the test suite cannot disagree about them.

/**
 * Classroom heuristic, not a significance test or proof of equal distributions.
 * The constants define a demonstration threshold; they are not confidence levels.
 */
export function belowFloor(value: number, floors: number[]): boolean {
  const highest = Math.max(...floors);
  const spread = Math.max(...floors) - Math.min(...floors);
  return value < highest * 1.6 + spread * 4 + 1e-3;
}

/** Which candidate an instrument calls worse in one run, if either. */
export type Verdict = SequenceCandidate | "neither";

export function verdictFor(
  lens: Lens,
  table: Record<SequenceCandidate, Record<Lens, number>>,
  floors: number[] = [table.plain[lens]],
): Verdict {
  const e = table.shift[lens];
  const f = table.shuffle[lens];
  const eBlind = belowFloor(e, floors);
  const fBlind = belowFloor(f, floors);
  if (eBlind && fBlind) return "neither";
  if (eBlind) return "shuffle";
  if (fBlind) return "shift";
  return e > f ? "shift" : "shuffle";
}

export interface ReportRuns {
  verdicts: Record<Lens, Verdict[]>;
  floors: Record<Lens, number[]>;
  /** The scores from the last repeat, for a page that wants to show one. */
  last: Record<SequenceCandidate, Record<Lens, number>>;
}

/** Run the whole protocol `repeats` times, independently each time. */
export function reportRuns(params: RecordingParams, repeats: number): ReportRuns {
  const lenses: Lens[] = ["frame", "temporal", "joint"];
  const verdicts = { frame: [], temporal: [], joint: [] } as Record<Lens, Verdict[]>;
  const floors = { frame: [], temporal: [], joint: [] } as Record<Lens, number[]>;
  let last = {} as Record<SequenceCandidate, Record<Lens, number>>;
  for (let i = 0; i < repeats; i++) {
    const measured = instrumentMeasurement({ ...params, seed: (params.seed + 104729 * (i + 1)) >>> 0 });
    const {table} = measured;
    for (const lens of lenses) {
      floors[lens].push(table.plain[lens]);
      verdicts[lens].push(measured.verdicts[lens]);
    }
    last = table;
  }
  return { verdicts, floors, last };
}

// --- week 7: does anything see C? -----------------------------------------
// Week 7 scores the bench three ways. The course once claimed KID and
// coverage both notice C's two lumps; measured, on the bench as built,
// neither does. KID's kernel is cubic and C matches R in every moment up to
// order three; density and coverage compare nearest-neighbour distances, in
// which C's one bimodal coordinate is diluted among the rest. What the three
// scores disagree about at d = 2048 is A against B. Pinned against numpy in
// spec/week7.test.ts (figures/week7-reference.py).

export type BenchKind = "R" | "A" | "B" | "C";

/** N draws of one bench member in d dimensions: R, A, B, or the mixture C. */
export function sampleBench(kind: BenchKind, n: number, d: number, seed: number): number[][] {
  const normal = gaussian(rng(seed));
  const coin = rng((seed ^ 0x1f123bb5) >>> 0);
  const spread = Math.sqrt(1.1);
  const component = Math.sqrt(0.19);
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row = new Array<number>(d);
    for (let j = 0; j < d; j++) row[j] = normal();
    if (kind === "A") for (let j = 0; j < d; j++) row[j] += 0.05;
    else if (kind === "B") for (let j = 0; j < d; j++) row[j] *= spread;
    else if (kind === "C") row[0] = (coin() < 0.5 ? -0.9 : 0.9) + component * normal();
    out.push(row);
  }
  return out;
}

/** The population FID of a bench member in d dimensions; C's is exactly zero. */
export function benchClosedForm(kind: BenchKind, d: number): number {
  if (kind === "A") return closedForm({ shift: 0.05, v: 1, d });
  if (kind === "B") return closedForm({ shift: 0, v: 1.1, d });
  return 0;
}

function flatten(rows: number[][]): Float64Array {
  const n = rows.length;
  const d = rows[0].length;
  const out = new Float64Array(n * d);
  for (let i = 0; i < n; i++) for (let j = 0; j < d; j++) out[i * d + j] = rows[i][j];
  return out;
}

/** Inner products of every row of a against every row of b. */
function inner(a: Float64Array, na: number, b: Float64Array, nb: number, d: number, symmetric: boolean): Float64Array {
  const g = new Float64Array(na * nb);
  for (let i = 0; i < na; i++) {
    const oi = i * d;
    for (let j = symmetric ? i : 0; j < nb; j++) {
      const oj = j * d;
      let s = 0;
      for (let k = 0; k < d; k++) s += a[oi + k] * b[oj + k];
      g[i * nb + j] = s;
      if (symmetric) g[j * nb + i] = s;
    }
  }
  return g;
}

/** The reference half of every score, computed once per draw of R. */
export interface PreparedReference {
  n: number;
  d: number;
  k: number;
  flat: Float64Array;
  norms: Float64Array;
  /** Sum over i != j of the cubic kernel on R against itself. */
  kernelSum: number;
  /** Distance from each reference point to its k-th nearest neighbour. */
  radius: Float64Array;
}

export function prepareReference(real: number[][], k = 5): PreparedReference {
  const n = real.length;
  const d = real[0].length;
  const flat = flatten(real);
  const g = inner(flat, n, flat, n, d, true);
  const norms = new Float64Array(n);
  for (let i = 0; i < n; i++) norms[i] = g[i * n + i];
  let kernelSum = 0;
  const radius = new Float64Array(n);
  const row = new Float64Array(n - 1);
  for (let i = 0; i < n; i++) {
    let c = 0;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      kernelSum += (g[i * n + j] / d + 1) ** 3;
      row[c++] = Math.sqrt(Math.max(norms[i] + norms[j] - 2 * g[i * n + j], 0));
    }
    radius[i] = row.slice().sort()[k - 1];
  }
  return { n, d, k, flat, norms, kernelSum, radius };
}

/** KID (unbiased, cubic kernel), density and coverage of one candidate draw. */
export function scoreAgainst(
  ref: PreparedReference,
  fake: number[][],
): { kid: number; density: number; coverage: number } {
  const { n, d, k } = ref;
  const m = fake.length;
  const flat = flatten(fake);
  const gff = inner(flat, m, flat, m, d, true);
  const gfr = inner(flat, m, ref.flat, n, d, false);
  let fakeSum = 0;
  for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (i !== j) fakeSum += (gff[i * m + j] / d + 1) ** 3;
  let crossSum = 0;
  let inside = 0;
  const covered = new Uint8Array(n);
  for (let j = 0; j < m; j++) {
    const fn = gff[j * m + j];
    for (let i = 0; i < n; i++) {
      const dot = gfr[j * n + i];
      crossSum += (dot / d + 1) ** 3;
      if (Math.sqrt(Math.max(fn + ref.norms[i] - 2 * dot, 0)) <= ref.radius[i]) {
        inside++;
        covered[i] = 1;
      }
    }
  }
  let coveredCount = 0;
  for (let i = 0; i < n; i++) coveredCount += covered[i];
  return {
    kid: ref.kernelSum / (n * (n - 1)) + fakeSum / (m * (m - 1)) - (2 * crossSum) / (n * m),
    density: inside / (k * m),
    coverage: coveredCount / n,
  };
}

/** Convenience for one pair of draws. */
export function threeScores(real: number[][], fake: number[][], k = 5) {
  return scoreAgainst(prepareReference(real, k), fake);
}
