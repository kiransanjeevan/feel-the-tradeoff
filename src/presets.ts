import type { ScoredDoc } from './metrics';

export interface Preset {
  id: string;
  name: string;
  /** one-line framing of the scenario shown in the UI */
  blurb: string;
  /** the teaching point — why this scenario's error asymmetry matters */
  lesson: string;
  docs: ScoredDoc[];
  /** suggested starting costs for the cost-of-error model (FR-06) */
  costFP: number;
  costFN: number;
  asymmetry: 'fp-costly' | 'fn-costly' | 'balanced';
}

// Helper to keep preset data terse: tuples of [score, relevant?].
const mk = (rows: [number, boolean][]): ScoredDoc[] =>
  rows.map(([score, relevant]) => ({ score, relevant }));

export const PRESETS: Preset[] = [
  {
    id: 'pm-compass',
    name: 'PM Compass',
    blurb: 'A balanced search feature where false positives and misses cost about the same.',
    lesson:
      'With symmetric costs, F1 is a reasonable default and the cost-optimal threshold lands near the F1-optimal one.',
    asymmetry: 'balanced',
    costFP: 1,
    costFN: 1,
    docs: mk([
      [0.94, true],
      [0.91, true],
      [0.88, false],
      [0.83, true],
      [0.79, true],
      [0.74, false],
      [0.66, true],
      [0.58, false],
      [0.51, true],
      [0.42, false],
      [0.35, false],
      [0.21, false],
    ]),
  },
  {
    id: 'medical-triage',
    name: 'Medical Triage',
    blurb: 'Flagging scans for disease. Missing a sick patient (FN) is far worse than a false alarm.',
    lesson:
      'When a miss is catastrophic, you push the threshold LOW — accept false positives to drive recall up. Watch the cost-optimal threshold move left as you raise cost(FN).',
    asymmetry: 'fn-costly',
    costFP: 1,
    costFN: 20,
    docs: mk([
      [0.96, true],
      [0.89, true],
      [0.84, false],
      [0.77, true],
      [0.71, false],
      [0.63, true],
      [0.55, false],
      [0.48, true],
      [0.4, false],
      [0.33, true],
      [0.25, false],
      [0.12, false],
    ]),
  },
  {
    id: 'spam-filter',
    name: 'Spam Filter',
    blurb: 'Sending a real email to spam (FP) infuriates users; a little spam slipping through is tolerable.',
    lesson:
      'When false positives are expensive, you push the threshold HIGH — protect precision even if some spam gets through (lower recall).',
    asymmetry: 'fp-costly',
    costFP: 15,
    costFN: 1,
    docs: mk([
      [0.97, true],
      [0.92, true],
      [0.85, true],
      [0.8, false],
      [0.73, true],
      [0.69, false],
      [0.6, true],
      [0.52, false],
      [0.44, false],
      [0.38, false],
      [0.29, false],
      [0.18, false],
    ]),
  },
  {
    id: 'legal-discovery',
    name: 'Legal Discovery',
    blurb: 'Surfacing responsive documents in litigation. Missing one (FN) can be sanctionable.',
    lesson:
      'Recall is near-sacred here. The two-stage pattern shines: cast a wide net for recall, then rerank to claw back precision — instead of just raising the threshold and dropping documents.',
    asymmetry: 'fn-costly',
    costFP: 1,
    costFN: 30,
    docs: mk([
      [0.93, true],
      [0.9, false],
      [0.86, true],
      [0.81, true],
      [0.76, false],
      [0.7, true],
      [0.64, true],
      [0.57, false],
      [0.5, true],
      [0.41, false],
      [0.31, true],
      [0.19, false],
    ]),
  },
  {
    id: 'clean-separation',
    name: 'Clean Separation',
    blurb: 'The easy case: relevant and irrelevant docs sit in two well-separated clusters.',
    lesson:
      'When the model separates classes cleanly, a wide band of thresholds all give perfect precision AND recall. The trade-off only bites when the clusters overlap — compare this to PM Compass.',
    asymmetry: 'balanced',
    costFP: 1,
    costFN: 1,
    docs: mk([
      [0.96, true],
      [0.93, true],
      [0.91, true],
      [0.88, true],
      [0.85, true],
      [0.82, true],
      [0.22, false],
      [0.18, false],
      [0.15, false],
      [0.11, false],
      [0.08, false],
      [0.05, false],
    ]),
  },
];

export const DEFAULT_PRESET = PRESETS[0];
