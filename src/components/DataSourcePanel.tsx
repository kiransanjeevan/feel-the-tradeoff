import { useEffect, useRef, useState } from 'react';
import type { ScoredDoc } from '../metrics';
import { PRESETS, DEFAULT_PRESET } from '../presets';
import { parseScoreLabelCsv } from '../csv';
import { scoreDocuments, type LabeledDoc, type EmbedProgress } from '../embeddings';

export interface SourceMeta {
  costFP?: number;
  costFN?: number;
}

type Source = 'preset' | 'csv' | 'embeddings';

const SAMPLE_CSV = `score,label
0.95,1
0.88,1
0.82,0
0.79,1
0.71,0
0.64,1
0.55,0
0.47,1
0.39,0
0.28,0`;

const SAMPLE_QUERY = 'How do I reset my password?';
const SAMPLE_DOCS: LabeledDoc[] = [
  { text: "Click 'Forgot password' on the sign-in page to reset it.", relevant: true },
  { text: 'Reset links expire after 30 minutes for security.', relevant: true },
  { text: 'You can update your billing address under Account settings.', relevant: false },
  { text: 'Our support team is available 24/7 via live chat.', relevant: false },
  { text: 'Two-factor authentication adds a second login step.', relevant: false },
];

export function DataSourcePanel({ onDocs }: { onDocs: (docs: ScoredDoc[], meta: SourceMeta) => void }) {
  const [source, setSource] = useState<Source>('preset');
  const [presetId, setPresetId] = useState(DEFAULT_PRESET.id);

  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvCount, setCsvCount] = useState(0);

  const [query, setQuery] = useState(SAMPLE_QUERY);
  const [edocs, setEdocs] = useState<LabeledDoc[]>(SAMPLE_DOCS);
  const [embedding, setEmbedding] = useState(false);
  const [progress, setProgress] = useState<EmbedProgress | null>(null);
  const [embedError, setEmbedError] = useState<string | null>(null);

  // Emit the default preset once so the metrics UI has data on first render.
  const emitted = useRef(false);
  useEffect(() => {
    if (emitted.current) return;
    emitted.current = true;
    emitPreset(DEFAULT_PRESET.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emitPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id) ?? DEFAULT_PRESET;
    onDocs(p.docs, { costFP: p.costFP, costFN: p.costFN });
  }

  function handlePreset(id: string) {
    setPresetId(id);
    emitPreset(id);
  }

  function loadCsvText(text: string) {
    const res = parseScoreLabelCsv(text);
    if (res.error) {
      setCsvError(res.error);
      setCsvCount(0);
      return;
    }
    setCsvError(null);
    setCsvCount(res.docs.length);
    onDocs(res.docs, {});
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => loadCsvText(String(reader.result));
    reader.readAsText(file);
  }

  async function runEmbedding() {
    const active = edocs.filter((d) => d.text.trim().length > 0);
    setEmbedError(null);
    setEmbedding(true);
    setProgress({ status: 'loading model' });
    try {
      const docs = await scoreDocuments(query, active, (p) => setProgress(p));
      onDocs(docs, {});
    } catch (e) {
      // FR-15 fallback: keep the app fully usable; just tell the user.
      setEmbedError('Live embeddings could not run in this browser. Presets and CSV still work.');
      console.error(e);
    } finally {
      setEmbedding(false);
      setProgress(null);
    }
  }

  const updateDoc = (i: number, patch: Partial<LabeledDoc>) =>
    setEdocs((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const addDoc = () => setEdocs((ds) => [...ds, { text: '', relevant: false }]);
  const removeDoc = (i: number) => setEdocs((ds) => ds.filter((_, j) => j !== i));

  const TABS: [Source, string][] = [
    ['preset', 'Presets'],
    ['csv', 'Upload CSV'],
    ['embeddings', 'Live embeddings'],
  ];
  const activePreset = PRESETS.find((p) => p.id === presetId) ?? DEFAULT_PRESET;
  const canEmbed = !embedding && query.trim().length > 0 && edocs.some((d) => d.text.trim().length > 0);

  return (
    <section className="panel">
      <p className="label">Data source</p>
      <div className="segmented" role="tablist" style={{ marginBottom: 'var(--s4)' }}>
        {TABS.map(([s, label]) => (
          <button key={s} role="tab" aria-selected={source === s} onClick={() => setSource(s)}>
            {label}
          </button>
        ))}
      </div>

      {source === 'preset' && (
        <div>
          <div className="cluster">
            <select value={presetId} onChange={(e) => handlePreset(e.target.value)} aria-label="Scenario">
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="muted">{activePreset.blurb}</span>
          </div>
          <p className="note" style={{ marginTop: 'var(--s4)' }}>
            {activePreset.lesson}
          </p>
        </div>
      )}

      {source === 'csv' && (
        <div>
          <p className="muted" style={{ marginTop: 0, marginBottom: 'var(--s3)' }}>
            Upload a CSV with <code>score,label</code> columns (label = 1/0, true/false, or relevant/irrelevant).
          </p>
          <div className="cluster">
            <input
              type="file"
              accept=".csv,text/csv"
              aria-label="Upload CSV"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <button className="btn" onClick={() => loadCsvText(SAMPLE_CSV)}>
              Try a sample
            </button>
          </div>
          {csvError && (
            <p className="note warn" style={{ marginTop: 'var(--s3)' }}>
              {csvError}
            </p>
          )}
          {!csvError && csvCount > 0 && (
            <p className="muted" style={{ marginTop: 'var(--s3)' }}>
              Loaded {csvCount} rows — explore them in the views below.
            </p>
          )}
        </div>
      )}

      {source === 'embeddings' && (
        <div>
          <p className="muted" style={{ marginTop: 0, marginBottom: 'var(--s3)' }}>
            Type a query and some documents, mark which are truly relevant, then embed — real cosine similarity
            becomes the score. Runs entirely in your browser.
          </p>
          <label className="field-label">Query</label>
          <input className="field block" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 'var(--s3)' }} />
          {edocs.map((d, i) => (
            <div key={i} className="doc-row">
              <input
                className="field"
                value={d.text}
                placeholder={`Document ${i + 1}`}
                onChange={(e) => updateDoc(i, { text: e.target.value })}
              />
              <label>
                <input type="checkbox" checked={d.relevant} onChange={(e) => updateDoc(i, { relevant: e.target.checked })} />{' '}
                relevant
              </label>
              <button className="btn icon" onClick={() => removeDoc(i)} aria-label={`Remove document ${i + 1}`}>
                ✕
              </button>
            </div>
          ))}
          <div className="cluster" style={{ marginTop: 'var(--s3)' }}>
            <button className="btn" onClick={addDoc}>
              + add document
            </button>
            <button className="btn btn-primary" onClick={runEmbedding} disabled={!canEmbed}>
              {embedding ? 'Embedding…' : 'Embed & score'}
            </button>
            {embedding && progress && (
              <span className="muted">
                {progress.status}
                {typeof progress.progress === 'number' ? ` ${Math.round(progress.progress)}%` : ''}
              </span>
            )}
          </div>
          <p className="faint" style={{ fontSize: 12, marginTop: 'var(--s3)' }}>
            First run downloads the model (~23 MB) and caches it. Nothing you type leaves your browser.
          </p>
          {embedError && (
            <p className="note warn" style={{ marginTop: 'var(--s3)' }}>
              {embedError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
