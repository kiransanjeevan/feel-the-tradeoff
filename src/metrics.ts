// metrics.ts — framework-agnostic retrieval-metric core.
//
// ZERO React/DOM imports by design: this file is the project's correctness
// anchor (PRD Risk #1 — "incorrect metric math is credibility-killing"), so it
// must be unit-testable in complete isolation. The UI only ever *reads* these
// pure functions; it never reimplements the math.
//
// Two metric families live here:
//   1. Threshold metrics  — you set a score cutoff; everything >= cutoff is
//      "predicted relevant". Drives the precision/recall/F1 trade-off + cost model.
//   2. Ranking @k metrics — you keep an ordered list and judge the top k.
//      Drives MRR / MAP / NDCG / Hit-Rate (how real RAG systems are evaluated).

export interface ScoredDoc {
  /** model score, typically a cosine similarity in [0, 1] (any real number works) */
  score: number;
  /** ground truth: is this document actually relevant? */
  relevant: boolean;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

// ── Threshold family ────────────────────────────────────────────────────────

/** A doc is "predicted relevant" when its score is >= threshold. */
export function confusionMatrix(docs: ScoredDoc[], threshold: number): ConfusionMatrix {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (const d of docs) {
    const predictedRelevant = d.score >= threshold;
    if (d.relevant && predictedRelevant) tp++;
    else if (!d.relevant && predictedRelevant) fp++;
    else if (d.relevant && !predictedRelevant) fn++;
    else tn++;
  }
  return { tp, fp, fn, tn };
}

/**
 * Precision = TP / (TP + FP) — of what we returned, how much was relevant.
 *
 * Edge case: when nothing is predicted relevant (TP + FP = 0) we return 1.
 * This is the precision–recall-curve convention: as the threshold rises past
 * every score, precision → 1 (vacuously — zero false positives among zero
 * predictions). It keeps the sweep chart continuous and teaches the intuition
 * "raise the threshold → precision climbs toward 1."
 */
export function precision(cm: ConfusionMatrix): number {
  const denom = cm.tp + cm.fp;
  return denom === 0 ? 1 : cm.tp / denom;
}

/** Recall = TP / (TP + FN) — of all relevant docs, how many we caught. */
export function recall(cm: ConfusionMatrix): number {
  const denom = cm.tp + cm.fn;
  return denom === 0 ? 0 : cm.tp / denom;
}

/**
 * F-beta. beta > 1 weights recall more; beta < 1 weights precision more;
 * beta = 1 is the symmetric F1. This is the "which error matters is a business
 * choice" knob (FR-05).
 */
export function fBeta(p: number, r: number, beta = 1): number {
  const b2 = beta * beta;
  const denom = b2 * p + r;
  return denom === 0 ? 0 : ((1 + b2) * p * r) / denom;
}

export function f1(p: number, r: number): number {
  return fBeta(p, r, 1);
}

export interface MetricPoint {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
}

/** Compute P / R / F1 at one threshold in a single call. */
export function metricsAt(docs: ScoredDoc[], threshold: number): MetricPoint {
  const cm = confusionMatrix(docs, threshold);
  const p = precision(cm);
  const r = recall(cm);
  return { threshold, precision: p, recall: r, f1: f1(p, r) };
}

/** Evenly spaced thresholds in [0, 1] — the x-axis for the sweep chart (FR-03). */
export function linspaceThresholds(steps = 101): number[] {
  const out: number[] = [];
  for (let i = 0; i < steps; i++) out.push(i / (steps - 1));
  return out;
}

/** P / R / F1 across many thresholds — the threshold-sweep data (FR-03). */
export function sweep(docs: ScoredDoc[], thresholds = linspaceThresholds()): MetricPoint[] {
  return thresholds.map((t) => metricsAt(docs, t));
}

export interface PRPoint {
  recall: number;
  precision: number;
  threshold: number;
}

/**
 * Precision–recall curve (FR-04). Uses each distinct score as a threshold
 * breakpoint (the only places the curve actually changes), then appends the
 * (recall = 0, precision = 1) endpoint per convention, sorted by recall.
 */
export function prCurve(docs: ScoredDoc[]): PRPoint[] {
  const thresholds = Array.from(new Set(docs.map((d) => d.score))).sort((a, b) => a - b);
  const points: PRPoint[] = thresholds.map((t) => {
    const m = metricsAt(docs, t);
    return { recall: m.recall, precision: m.precision, threshold: t };
  });
  points.push({ recall: 0, precision: 1, threshold: Infinity });
  return points.sort((a, b) => a.recall - b.recall);
}

// ── Cost-of-error (the differentiator, FR-06) ────────────────────────────────

/** Expected total cost at a threshold: FP·costFP + FN·costFN. */
export function expectedCost(
  docs: ScoredDoc[],
  threshold: number,
  costFP: number,
  costFN: number,
): number {
  const cm = confusionMatrix(docs, threshold);
  return cm.fp * costFP + cm.fn * costFN;
}

export interface CostOptimum {
  threshold: number;
  cost: number;
}

/** The threshold that minimizes expected cost (ties → lowest threshold). */
export function costOptimalThreshold(
  docs: ScoredDoc[],
  costFP: number,
  costFN: number,
  thresholds = linspaceThresholds(),
): CostOptimum {
  let best: CostOptimum = { threshold: thresholds[0], cost: Infinity };
  for (const t of thresholds) {
    const cost = expectedCost(docs, t, costFP, costFN);
    if (cost < best.cost) best = { threshold: t, cost };
  }
  return best;
}

/** The threshold that maximizes F-beta (FR-05). Ties → lowest threshold. */
export function optimalFBetaThreshold(
  docs: ScoredDoc[],
  beta = 1,
  thresholds = linspaceThresholds(),
): { threshold: number; fBeta: number } {
  let best = { threshold: thresholds[0], fBeta: -Infinity };
  for (const t of thresholds) {
    const m = metricsAt(docs, t);
    const fb = fBeta(m.precision, m.recall, beta);
    if (fb > best.fBeta) best = { threshold: t, fBeta: fb };
  }
  return best;
}

// ── Ranking @k family (FR-09) ────────────────────────────────────────────────
// Input is an ordered list, best-ranked first. Binary relevance uses 1/0;
// graded relevance (e.g. 0–3) is supported by the DCG/NDCG `gains` form.

export function precisionAtK(relevances: number[], k: number): number {
  if (k <= 0) return 0;
  const hits = relevances.slice(0, k).filter((r) => r > 0).length;
  return hits / k;
}

export function recallAtK(relevances: number[], k: number, totalRelevant?: number): number {
  const denom = totalRelevant ?? relevances.filter((r) => r > 0).length;
  if (denom === 0) return 0;
  const hits = relevances.slice(0, k).filter((r) => r > 0).length;
  return hits / denom;
}

/** Hit Rate @k: 1 if any relevant doc appears in the top k, else 0. */
export function hitRateAtK(relevances: number[], k: number): number {
  return relevances.slice(0, k).some((r) => r > 0) ? 1 : 0;
}

/** Reciprocal Rank: 1 / (rank of first relevant doc), 0 if none. */
export function reciprocalRank(relevances: number[]): number {
  const idx = relevances.findIndex((r) => r > 0);
  return idx === -1 ? 0 : 1 / (idx + 1);
}

/** Average Precision: mean of precision@k taken at each relevant position. */
export function averagePrecision(relevances: number[], totalRelevant?: number): number {
  const denom = totalRelevant ?? relevances.filter((r) => r > 0).length;
  if (denom === 0) return 0;
  let hits = 0;
  let sum = 0;
  for (let i = 0; i < relevances.length; i++) {
    if (relevances[i] > 0) {
      hits++;
      sum += hits / (i + 1); // precision@(i+1)
    }
  }
  return sum / denom;
}

/** Discounted Cumulative Gain @k. `gains` are graded relevances in ranked order. */
export function dcgAtK(gains: number[], k: number): number {
  let dcg = 0;
  const top = gains.slice(0, k);
  for (let i = 0; i < top.length; i++) {
    dcg += top[i] / Math.log2(i + 2); // i + 2 because rank positions are 1-indexed
  }
  return dcg;
}

/** Normalized DCG @k = DCG / ideal-DCG (perfect ordering). Range [0, 1]. */
export function ndcgAtK(gains: number[], k: number): number {
  const idcg = dcgAtK([...gains].sort((a, b) => b - a), k);
  return idcg === 0 ? 0 : dcgAtK(gains, k) / idcg;
}

// Mean variants over a set of queries (each query is one relevance list).
export function mrr(queries: number[][]): number {
  return mean(queries.map(reciprocalRank));
}

export function meanAveragePrecision(queries: number[][]): number {
  return mean(queries.map((q) => averagePrecision(q)));
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}
