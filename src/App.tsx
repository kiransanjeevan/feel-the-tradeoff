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
  const sweepMarkers: Marker[] = [{ x: fbetaOpt.threshold, label: `${betaLabel}-best`, color: COLORS.fbetaOptimal }];

  return (
    <div className="wrap">
      <header className="masthead">
        <h1>Feel the Trade-off</h1>
        <p className="sub">
          Move the slider and feel the precision / recall / F1 trade-off — on real embeddings, through a
          business-cost lens.
        </p>
      </header>

      {/* Data source (FR-07 presets / FR-10 CSV / FR-14 live embeddings) */}
      <DataSourcePanel onDocs={handleDocs} />

      {/* Predict-then-reveal beat (active recall) */}
      {predict === null ? (
        <section className="panel">
          <p className="label">Predict first</p>
          <p style={{ margin: '0 0 var(--s4)' }}>
            Before you touch the slider — as you raise the threshold, what happens to <strong>precision</strong>?
          </p>
          <div className="cluster">
            <button className="btn" onClick={() => setPredict('up')}>
              It goes up
            </button>
            <button className="btn" onClick={() => setPredict('down')}>
              It goes down
            </button>
          </div>
        </section>
      ) : (
        <section className="panel">
          <p className="label">Predict first</p>
          <p className="note">
            {predict === 'up' ? '✓ Usually right — ' : 'Look closely — '}
            raising the threshold keeps only the highest-scoring docs, so <strong>precision tends to rise while
            recall falls</strong>. Not guaranteed monotonic, though — drag and watch the curves cross.
            <button className="btn" style={{ marginLeft: 'var(--s3)' }} onClick={() => setPredict(null)}>
              reset
            </button>
          </p>
        </section>
      )}

      {/* HERO — documents, gate, live readout (FR-01 / FR-02) */}
      <section className="panel hero">
        <p className="label">Documents &amp; the threshold gate</p>
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
        <div className="cluster between" style={{ marginTop: 'var(--s2)' }}>
          <span className="cluster tight">
            <span className="dot" style={{ background: COLORS.relevant }} /> <span className="muted">relevant</span>
            <span className="dot" style={{ background: COLORS.irrelevant, marginLeft: 'var(--s3)' }} />{' '}
            <span className="muted">irrelevant</span>
          </span>
          <span className="faint" style={{ fontSize: 12 }}>
            dim dots are below the gate (predicted not relevant)
          </span>
        </div>

        <hr className="rule" />

        <div className="readout">
          <div className="metrics">
            <div className="metric">
              <div className="k">
                <span className="swatch" style={{ background: COLORS.precision }} /> Precision
              </div>
              <div className="v">{pct(m.precision)}</div>
            </div>
            <div className="metric">
              <div className="k">
                <span className="swatch" style={{ background: COLORS.recall }} /> Recall
              </div>
              <div className="v">{pct(m.recall)}</div>
            </div>
            <div className="metric">
              <div className="k">
                <span className="swatch" style={{ background: COLORS.f1 }} /> {betaLabel}
              </div>
              <div className="v">{pct(fbetaVal)}</div>
            </div>
          </div>

          <div className="cm">
            <div />
            <div className="cm-h">predicted relevant</div>
            <div className="cm-h">predicted not</div>

            <div className="cm-rh">actual relevant</div>
            <div className="cm-cell ok">
              <div className="n">{cm.tp}</div>
              <div className="t">True Pos</div>
            </div>
            <div className="cm-cell err">
              <div className="n">{cm.fn}</div>
              <div className="t">False Neg</div>
            </div>

            <div className="cm-rh">actual irrelevant</div>
            <div className="cm-cell err">
              <div className="n">{cm.fp}</div>
              <div className="t">False Pos</div>
            </div>
            <div className="cm-cell ok">
              <div className="n">{cm.tn}</div>
              <div className="t">True Neg</div>
            </div>
          </div>
        </div>
      </section>

      {/* Threshold sweep (FR-03) + F-beta control (FR-05) */}
      <section className="panel">
        <p className="label">Threshold sweep</p>
        <SweepChart data={sweepData} threshold={threshold} markers={sweepMarkers} />
        <div className="cluster" style={{ marginTop: 'var(--s3)' }}>
          <span className="muted">Optimize for</span>
          <div className="cluster tight">
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
          </div>
          <button className="btn btn-primary" onClick={() => setThreshold(fbetaOpt.threshold)}>
            jump to {betaLabel}-best ({fbetaOpt.threshold.toFixed(2)})
          </button>
        </div>
      </section>

      {/* Cost of error (FR-06) — the differentiator */}
      <section className="panel">
        <p className="label">Cost of error — metric → decision</p>
        <div className="cluster" style={{ marginBottom: 'var(--s3)' }}>
          <label className="muted">
            Cost of a false positive{' '}
            <input
              type="number"
              min={0}
              value={costFP}
              onChange={(e) => setCostFP(Math.max(0, Number(e.target.value)))}
            />
          </label>
          <label className="muted">
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
        <div className="cluster between" style={{ marginTop: 'var(--s3)' }}>
          <span className="muted">
            Cost-optimal threshold is <strong>{costOpt.threshold.toFixed(2)}</strong> (cost {costOpt.cost.toFixed(0)}).
            You're paying <strong>{expectedCost(docs, threshold, costFP, costFN).toFixed(0)}</strong>.
          </span>
          <button className="btn btn-primary" onClick={() => setThreshold(costOpt.threshold)}>
            jump to cost-optimal
          </button>
        </div>
      </section>

      <footer className="foot">All math runs client-side in a unit-tested core. No data leaves your browser.</footer>
    </div>
  );
}
