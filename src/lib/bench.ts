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
