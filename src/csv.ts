import type { ScoredDoc } from './metrics';

export interface CsvResult {
  docs: ScoredDoc[];
  error?: string;
}

const TRUTHY = new Set(['1', 'true', 'yes', 'relevant', 'rel', 'y', 't']);
const FALSY = new Set(['0', 'false', 'no', 'irrelevant', 'irrel', 'n', 'f']);

/**
 * Parse a CSV of (score, label) rows into ScoredDoc[] (FR-10).
 *
 * Accepts an optional header row containing `score` and `label`/`relevant`
 * columns (case-insensitive, any order). With no header, assumes column 0 =
 * score, column 1 = label. Returns a friendly error string on malformed input
 * rather than throwing — the UI surfaces it and keeps the previous data.
 */
export function parseScoreLabelCsv(text: string): CsvResult {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { docs: [], error: 'The file is empty.' };

  const split = (line: string) => line.split(',').map((c) => c.trim());

  const header = split(lines[0]).map((c) => c.toLowerCase());
  const headerScore = header.indexOf('score');
  const headerLabel = header.findIndex((c) => c === 'label' || c === 'relevant');

  let scoreIdx = 0;
  let labelIdx = 1;
  let startRow = 0;
  if (headerScore !== -1 && headerLabel !== -1) {
    scoreIdx = headerScore;
    labelIdx = headerLabel;
    startRow = 1;
  }

  const docs: ScoredDoc[] = [];
  for (let i = startRow; i < lines.length; i++) {
    const cols = split(lines[i]);
    const rawScore = cols[scoreIdx];
    const rawLabel = (cols[labelIdx] ?? '').toLowerCase();

    const score = Number(rawScore);
    if (rawScore === undefined || rawScore === '' || !Number.isFinite(score)) {
      return { docs: [], error: `Row ${i + 1}: "${rawScore ?? ''}" is not a numeric score.` };
    }

    let relevant: boolean;
    if (TRUTHY.has(rawLabel)) relevant = true;
    else if (FALSY.has(rawLabel)) relevant = false;
    else {
      return {
        docs: [],
        error: `Row ${i + 1}: "${cols[labelIdx] ?? ''}" is not a valid label (use 1/0, true/false, or relevant/irrelevant).`,
      };
    }
    docs.push({ score, relevant });
  }

  if (docs.length === 0) return { docs: [], error: 'No data rows found.' };
  return { docs };
}
