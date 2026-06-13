import { useMemo, useState } from 'react';
import { metricsAt, confusionMatrix, expectedCost } from './metrics';
import { PRESETS, DEFAULT_PRESET } from './presets';

// Phase-0 shell: proves the metrics core is wired end-to-end (a real threshold
// slider recomputing P/R/F1 + confusion matrix live). The polished UI, charts,
// and cost viz land in Phase 1 (v1.0). This is intentionally minimal.
export function App() {
  const [presetId, setPresetId] = useState(DEFAULT_PRESET.id);
  const [threshold, setThreshold] = useState(0.5);

  const preset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) ?? DEFAULT_PRESET,
    [presetId],
  );

  const m = metricsAt(preset.docs, threshold);
  const cm = confusionMatrix(preset.docs, threshold);
  const cost = expectedCost(preset.docs, threshold, preset.costFP, preset.costFN);

  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Retrieval Metrics Lab</h1>
      <p style={{ color: '#555' }}>Phase 0 shell — the metrics core is live. UI polish comes in v1.0.</p>

      <label>
        Scenario:{' '}
        <select value={presetId} onChange={(e) => setPresetId(e.target.value)}>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <p style={{ color: '#555', fontStyle: 'italic' }}>{preset.blurb}</p>

      <label style={{ display: 'block', margin: '1.5rem 0 0.5rem' }}>
        Threshold: <strong>{threshold.toFixed(2)}</strong>
      </label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={threshold}
        onChange={(e) => setThreshold(Number(e.target.value))}
        style={{ width: '100%' }}
        aria-label="Score threshold"
      />

      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
        <Stat label="Precision" value={pct(m.precision)} />
        <Stat label="Recall" value={pct(m.recall)} />
        <Stat label="F1" value={pct(m.f1)} />
        <Stat label="Expected cost" value={cost.toFixed(0)} />
      </div>

      <table style={{ marginTop: '1.5rem', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <Cell>TP {cm.tp}</Cell>
            <Cell>FP {cm.fp}</Cell>
          </tr>
          <tr>
            <Cell>FN {cm.fn}</Cell>
            <Cell>TN {cm.tn}</Cell>
          </tr>
        </tbody>
      </table>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td style={{ border: '1px solid #ccc', padding: '0.5rem 1rem', minWidth: 60 }}>{children}</td>;
}
