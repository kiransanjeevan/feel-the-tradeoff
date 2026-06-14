import { useMemo, useState } from 'react';
import {
  metricsAt,
  confusionMatrix,
  fBeta,
  sweep,
  linspaceThresholds,
  expectedCost,
  costOptimalThreshold,
  optimalFBetaThreshold,
} from './metrics';
import { DEFAULT_PRESET } from './presets';
import { ScoreAxis } from './components/ScoreAxis';
import { SweepChart, type Marker } from './components/SweepChart';
import { CostChart } from './components/CostChart';
import { DataSourcePanel, type SourceMeta } from './components/DataSourcePanel';
import type { ScoredDoc } from './metrics';
import { COLORS } from './theme';
import './styles.css';

const THRESHOLDS = linspaceThresholds(101);
const BETA_PRESETS = [
  { label: 'F0.5', beta: 0.5, hint: 'precision-weighted' },
  { label: 'F1', beta: 1, hint: 'balanced' },
  { label: 'F2', beta: 2, hint: 'recall-weighted' },
];

export function App() {
  const [docs, setDocs] = useState<ScoredDoc[]>(DEFAULT_PRESET.docs);
  const [threshold, setThreshold] = useState(0.5);
  const [beta, setBeta] = useState(1);
  const [costFP, setCostFP] = useState(DEFAULT_PRESET.costFP);
  const [costFN, setCostFN] = useState(DEFAULT_PRESET.costFN);
  const [predict, setPredict] = useState<null | 'up' | 'down'>(null);

  // The data source (presets / CSV / live embeddings) produces ScoredDoc[];
  // the metrics UI below is identical regardless of where the scores came from.
  function handleDocs(newDocs: ScoredDoc[], meta: SourceMeta) {
    setDocs(newDocs);
    if (meta.costFP !== undefined) setCostFP(meta.costFP);
    if (meta.costFN !== undefined) setCostFN(meta.costFN);
  }

  // Everything below recomputes on every drag — pure, memoized, < 50 ms (NFR).
  const sweepData = useMemo(() => sweep(docs, THRESHOLDS), [docs]);
  const m = metricsAt(docs, threshold);
  const cm = confusionMatrix(docs, threshold);
  const fbetaVal = fBeta(m.precision, m.recall, beta);
  const fbetaOpt = useMemo(() => optimalFBetaThreshold(docs, beta, THRESHOLDS), [docs, beta]);
  const costData = useMemo(
    () => THRESHOLDS.map((t) => ({ threshold: t, cost: expectedCost(docs, t, costFP, costFN) })),
    [docs, costFP, costFN],
  );
  const costOpt = useMemo(() => costOptimalThreshold(docs, costFP, costFN, THRESHOLDS), [docs, costFP, costFN]);

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const betaLabel = beta === 1 ? 'F1' : `F${beta}`;

  const sweepMarkers: Marker[] = [
    { x: fbetaOpt.threshold, label: `${betaLabel}-best`, color: COLORS.fbetaOptimal },
  ];

  return (
    <div className="wrap">
      <h1>Retrieval Metrics Lab</h1>
      <p className="tagline">
        Move the slider and feel the precision / recall / F1 trade-off — with a business-cost lens.
      </p>

      {/* Data source (FR-07 presets / FR-10 CSV / FR-14 live embeddings) */}
      <DataSourcePanel onDocs={handleDocs} />

      {/* Predict-then-reveal beat (active recall) */}
      {predict === null ? (
        <section className="card">
          <h2>Predict first</h2>
          <p style={{ margin: '0 0 0.8rem' }}>
            Before you touch the slider — as you raise the threshold, what happens to <strong>precision</strong>?
          </p>
          <div className="controls">
            <button className="btn" onClick={() => setPredict('up')}>
              It goes up
            </button>
            <button className="btn" onClick={() => setPredict('down')}>
              It goes down
            </button>
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>Predict first</h2>
          <p className="lesson">
            {predict === 'up' ? '✓ Usually right — ' : 'Look closely — '}
            raising the threshold keeps only the highest-scoring docs, so <strong>precision tends to rise while
            recall falls</strong>. It isn't guaranteed monotonic, though: drag the slider and watch the curves
            cross below.
            <button className="btn" style={{ marginLeft: '0.6rem' }} onClick={() => setPredict(null)}>
              reset
            </button>
          </p>
        </section>
      )}

      {/* Documents & the gate (FR-01 / FR-02) */}
      <section className="card">
        <h2>Documents &amp; the threshold gate</h2>
        <ScoreAxis docs={docs} threshold={threshold} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          aria-label="Score threshold"
        />
        <div className="controls" style={{ justifyContent: 'space-between' }}>
          <span className="controls" style={{ gap: '0.35rem' }}>
            <span className="dot" style={{ background: COLORS.relevant }} /> relevant
          </span>
          <span className="controls" style={{ gap: '0.35rem' }}>
            <span className="dot" style={{ background: COLORS.irrelevant }} /> irrelevant
          </span>
          <span className="muted">faded dots are below the gate (predicted not relevant)</span>
        </div>
      </section>

      {/* Metrics + confusion matrix (FR-01) */}
      <section className="card">
        <h2>At this threshold</h2>
        <div className="row">
          <div className="stat">
            <div className="label">Precision</div>
            <div className="value" style={{ color: COLORS.precision }}>
              {pct(m.precision)}
            </div>
          </div>
          <div className="stat">
            <div className="label">Recall</div>
            <div className="value" style={{ color: COLORS.recall }}>
              {pct(m.recall)}
            </div>
          </div>
          <div className="stat">
            <div className="label">{betaLabel}</div>
            <div className="value" style={{ color: COLORS.f1 }}>
              {pct(fbetaVal)}
            </div>
          </div>
          <div className="confusion" style={{ marginLeft: 'auto' }}>
            <div className="cell tp">
              <div className="n">{cm.tp}</div>
              <div className="k">True Pos</div>
            </div>
            <div className="cell fp">
              <div className="n">{cm.fp}</div>
              <div className="k">False Pos</div>
            </div>
            <div className="cell fn">
              <div className="n">{cm.fn}</div>
              <div className="k">False Neg</div>
            </div>
            <div className="cell tn">
              <div className="n">{cm.tn}</div>
              <div className="k">True Neg</div>
            </div>
          </div>
        </div>
      </section>

      {/* Threshold sweep (FR-03) + F-beta control (FR-05) */}
      <section className="card">
        <h2>Threshold sweep</h2>
        <SweepChart data={sweepData} threshold={threshold} markers={sweepMarkers} />
        <div className="controls" style={{ marginTop: '0.5rem' }}>
          <span className="muted">Optimize for:</span>
          {BETA_PRESETS.map((b) => (
            <button
              key={b.label}
              className={`btn ${beta === b.beta ? 'active' : ''}`}
              onClick={() => setBeta(b.beta)}
              title={b.hint}
            >
              {b.label}
            </button>
          ))}
          <button className="btn btn-primary" onClick={() => setThreshold(fbetaOpt.threshold)}>
            jump to {betaLabel}-best ({fbetaOpt.threshold.toFixed(2)})
          </button>
        </div>
      </section>

      {/* Cost of error (FR-06) — the differentiator */}
      <section className="card">
        <h2>Cost of error — metric → decision</h2>
        <div className="controls" style={{ marginBottom: '0.75rem' }}>
          <label>
            Cost of a false positive{' '}
            <input
              type="number"
              min={0}
              value={costFP}
              onChange={(e) => setCostFP(Math.max(0, Number(e.target.value)))}
            />
          </label>
          <label>
            Cost of a false negative{' '}
            <input
              type="number"
              min={0}
              value={costFN}
              onChange={(e) => setCostFN(Math.max(0, Number(e.target.value)))}
            />
          </label>
        </div>
        <CostChart data={costData} threshold={threshold} optimal={costOpt.threshold} />
        <div className="controls" style={{ marginTop: '0.5rem' }}>
          <span className="muted">
            Cost-optimal threshold is <strong>{costOpt.threshold.toFixed(2)}</strong> (expected cost {costOpt.cost.toFixed(0)}).
            You're paying <strong>{expectedCost(docs, threshold, costFP, costFN).toFixed(0)}</strong>.
          </span>
          <button className="btn btn-primary" onClick={() => setThreshold(costOpt.threshold)}>
            jump to cost-optimal
          </button>
        </div>
      </section>

      <footer className="muted" style={{ textAlign: 'center', marginTop: '2rem' }}>
        All math is computed client-side by a unit-tested core. No data leaves your browser.
      </footer>
    </div>
  );
}
