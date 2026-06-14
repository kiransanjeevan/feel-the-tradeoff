import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from './embeddings';
import { parseScoreLabelCsv } from './csv';

describe('cosineSimilarity', () => {
  it('identical vectors → 1', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 10);
  });
  it('orthogonal vectors → 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });
  it('parallel (scaled) vectors → 1', () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 10);
  });
  it('opposite vectors → -1', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });
  it('zero vector → 0 (guarded, no NaN)', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe('parseScoreLabelCsv', () => {
  it('parses a header + score,label rows', () => {
    const { docs, error } = parseScoreLabelCsv('score,label\n0.9,1\n0.4,0');
    expect(error).toBeUndefined();
    expect(docs).toEqual([
      { score: 0.9, relevant: true },
      { score: 0.4, relevant: false },
    ]);
  });
  it('handles columns in any order via the header', () => {
    const { docs } = parseScoreLabelCsv('label,score\nrelevant,0.8\nirrelevant,0.2');
    expect(docs).toEqual([
      { score: 0.8, relevant: true },
      { score: 0.2, relevant: false },
    ]);
  });
  it('assumes score,label when there is no header', () => {
    const { docs } = parseScoreLabelCsv('0.7,true\n0.3,false');
    expect(docs).toEqual([
      { score: 0.7, relevant: true },
      { score: 0.3, relevant: false },
    ]);
  });
  it('accepts varied label spellings', () => {
    const { docs } = parseScoreLabelCsv('score,label\n0.5,yes\n0.4,no\n0.3,1\n0.2,0');
    expect(docs.map((d) => d.relevant)).toEqual([true, false, true, false]);
  });
  it('errors on a non-numeric score', () => {
    const { error } = parseScoreLabelCsv('score,label\nabc,1');
    expect(error).toMatch(/not a numeric score/);
  });
  it('errors on an unrecognized label', () => {
    const { error } = parseScoreLabelCsv('score,label\n0.5,maybe');
    expect(error).toMatch(/not a valid label/);
  });
  it('errors on empty input', () => {
    expect(parseScoreLabelCsv('   ').error).toMatch(/empty/);
  });
});
