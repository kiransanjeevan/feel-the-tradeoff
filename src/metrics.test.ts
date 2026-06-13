import { describe, it, expect } from 'vitest';
import {
  confusionMatrix,
  f1,
  fBeta,
  metricsAt,
  expectedCost,
  costOptimalThreshold,
  optimalFBetaThreshold,
  prCurve,
  precisionAtK,
  recallAtK,
  hitRateAtK,
  reciprocalRank,
  averagePrecision,
  dcgAtK,
  ndcgAtK,
  mrr,
  meanAveragePrecision,
  type ScoredDoc,
} from './metrics';

// A small, fully hand-verifiable dataset. 3 relevant, 2 irrelevant.
// Note: the relevant doc at 0.4 sits BELOW the irrelevant doc at 0.7 —
// this is the deliberately hard case where you can't separate them cleanly.
const docs: ScoredDoc[] = [
  { score: 0.9, relevant: true },
  { score: 0.8, relevant: true },
  { score: 0.7, relevant: false },
  { score: 0.4, relevant: true },
  { score: 0.3, relevant: false },
];

describe('confusion matrix', () => {
  it('threshold 0.5 → TP2 FP1 FN1 TN1', () => {
    expect(confusionMatrix(docs, 0.5)).toEqual({ tp: 2, fp: 1, fn: 1, tn: 1 });
  });
  it('threshold 0.75 → TP2 FP0 FN1 TN2', () => {
    expect(confusionMatrix(docs, 0.75)).toEqual({ tp: 2, fp: 0, fn: 1, tn: 2 });
  });
  it('threshold above all scores → nothing predicted positive', () => {
    expect(confusionMatrix(docs, 0.95)).toEqual({ tp: 0, fp: 0, fn: 3, tn: 2 });
  });
});

describe('precision / recall / F1', () => {
  it('threshold 0.5: P=2/3, R=2/3, F1=2/3', () => {
    const m = metricsAt(docs, 0.5);
    expect(m.precision).toBeCloseTo(2 / 3, 10);
    expect(m.recall).toBeCloseTo(2 / 3, 10);
    expect(m.f1).toBeCloseTo(2 / 3, 10);
  });
  it('threshold 0.75: perfect precision, recall 2/3, F1 0.8', () => {
    const m = metricsAt(docs, 0.75);
    expect(m.precision).toBeCloseTo(1, 10);
    expect(m.recall).toBeCloseTo(2 / 3, 10);
    expect(m.f1).toBeCloseTo(0.8, 10);
  });
  it('no positive predictions → precision is 1 (PR-curve convention), recall 0, F1 0', () => {
    const m = metricsAt(docs, 0.95);
    expect(m.precision).toBe(1);
    expect(m.recall).toBe(0);
    expect(m.f1).toBe(0);
  });
});

describe('F-beta', () => {
  it('F2 (recall-weighted): p=0.6, r=0.9 → 0.8182', () => {
    expect(fBeta(0.6, 0.9, 2)).toBeCloseTo(0.81818, 4);
  });
  it('F0.5 (precision-weighted): p=0.6, r=0.9 → 0.6429', () => {
    // 1.25·0.54 / (0.25·0.6 + 0.9) = 0.675 / 1.05 = 0.642857
    expect(fBeta(0.6, 0.9, 0.5)).toBeCloseTo(0.64286, 4);
  });
  it('F1 equals fBeta with beta=1', () => {
    expect(f1(0.6, 0.9)).toBeCloseTo(fBeta(0.6, 0.9, 1), 10);
  });
});

describe('cost of error', () => {
  it('expected cost at 0.5 with costFP=1, costFN=10 → 11', () => {
    expect(expectedCost(docs, 0.5, 1, 10)).toBe(11); // FP1*1 + FN1*10
  });
  it('with FN 10x costlier, the cost-optimal threshold accepts the FP to keep recall', () => {
    // Best you can do is exclude the 0.3 irrelevant while keeping all 3 relevant,
    // accepting the 0.7 false positive: FP1*1 + FN0*10 = 1.
    const opt = costOptimalThreshold(docs, 1, 10);
    expect(opt.cost).toBe(1);
    expect(opt.threshold).toBeGreaterThan(0.3);
    expect(opt.threshold).toBeLessThanOrEqual(0.4);
  });
  it('when FP is costlier, the optimum tightens to avoid false positives', () => {
    const opt = costOptimalThreshold(docs, 10, 1);
    // Excluding the 0.7 FP costs the 0.4 FN (they can't be separated): FN-driven.
    expect(opt.threshold).toBeGreaterThan(0.4);
  });
});

describe('optimal F-beta threshold', () => {
  it('returns a threshold and its F-beta score', () => {
    const opt = optimalFBetaThreshold(docs, 1);
    expect(opt.fBeta).toBeGreaterThan(0);
    expect(opt.threshold).toBeGreaterThanOrEqual(0);
    expect(opt.threshold).toBeLessThanOrEqual(1);
  });
});

describe('PR curve', () => {
  it('starts at (recall 0, precision 1) and reaches recall 1', () => {
    const curve = prCurve(docs);
    expect(curve[0]).toEqual({ recall: 0, precision: 1, threshold: Infinity });
    expect(curve[curve.length - 1].recall).toBeCloseTo(1, 10);
    // sorted ascending by recall
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].recall).toBeGreaterThanOrEqual(curve[i - 1].recall);
    }
  });
});

// Ranked relevance list: relevant docs at positions 1, 3, 4. Total relevant = 3.
const rel = [1, 0, 1, 1, 0];

describe('ranking @k family', () => {
  it('precision@k', () => {
    expect(precisionAtK(rel, 1)).toBeCloseTo(1, 10);
    expect(precisionAtK(rel, 3)).toBeCloseTo(2 / 3, 10);
    expect(precisionAtK(rel, 5)).toBeCloseTo(3 / 5, 10);
  });
  it('recall@k', () => {
    expect(recallAtK(rel, 1)).toBeCloseTo(1 / 3, 10);
    expect(recallAtK(rel, 3)).toBeCloseTo(2 / 3, 10);
    expect(recallAtK(rel, 5)).toBeCloseTo(1, 10);
  });
  it('hit rate @k', () => {
    expect(hitRateAtK(rel, 5)).toBe(1);
    expect(hitRateAtK([0, 0, 1], 2)).toBe(0);
    expect(hitRateAtK([0, 0, 1], 3)).toBe(1);
  });
  it('reciprocal rank', () => {
    expect(reciprocalRank(rel)).toBeCloseTo(1, 10);
    expect(reciprocalRank([0, 0, 1])).toBeCloseTo(1 / 3, 10);
    expect(reciprocalRank([0, 0, 0])).toBe(0);
  });
  it('average precision = (1 + 2/3 + 3/4) / 3 ≈ 0.8056', () => {
    expect(averagePrecision(rel)).toBeCloseTo(0.80556, 4);
  });
  it('DCG@5 ≈ 1.9307', () => {
    expect(dcgAtK(rel, 5)).toBeCloseTo(1.93068, 4);
  });
  it('NDCG@5 ≈ 0.9060', () => {
    expect(ndcgAtK(rel, 5)).toBeCloseTo(0.90603, 4);
  });
  it('perfectly ranked list → NDCG 1', () => {
    expect(ndcgAtK([1, 1, 1, 0, 0], 5)).toBeCloseTo(1, 10);
  });
});

describe('mean variants over queries', () => {
  it('MRR averages reciprocal ranks', () => {
    // first relevant at rank 2 → 1/2; at rank 1 → 1; mean = 0.75
    expect(mrr([[0, 1], [1, 0]])).toBeCloseTo(0.75, 10);
  });
  it('MAP averages average precision', () => {
    // AP([1,0]) = 1 ; AP([0,1]) = 0.5 ; mean = 0.75
    expect(meanAveragePrecision([[1, 0], [0, 1]])).toBeCloseTo(0.75, 10);
  });
});
