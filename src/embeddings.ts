import type { ScoredDoc } from './metrics';

/** Cosine similarity of two equal-length vectors. Pure + unit-tested. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export interface LabeledDoc {
  text: string;
  relevant: boolean;
}

export interface EmbedProgress {
  status: string;
  progress?: number;
}

// Lazy singleton pipeline. transformers.js is DYNAMICALLY imported so it (and
// the ~30 MB onnxruntime) never enters the core bundle — only loaded when the
// user opts into live embeddings. This is the FR-14/FR-15 boundary: if any of
// this throws, callers catch it and the AI-independent app keeps working.
let extractorPromise: Promise<unknown> | null = null;

async function getExtractor(onProgress?: (p: EmbedProgress) => void): Promise<unknown> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers');
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        progress_callback: (p: { status: string; progress?: number }) => {
          onProgress?.({ status: p.status, progress: p.progress });
        },
      });
    })();
  }
  return extractorPromise;
}

/** Embed texts → array of unit-normalized vectors (mean-pooled). */
export async function embedTexts(
  texts: string[],
  onProgress?: (p: EmbedProgress) => void,
): Promise<number[][]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractor = (await getExtractor(onProgress)) as any;
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  return output.tolist() as number[][];
}

/**
 * Score documents against a query using real embeddings (FR-14).
 * Score = cosine similarity, clamped to [0,1] so it feeds the existing axis.
 */
export async function scoreDocuments(
  query: string,
  docs: LabeledDoc[],
  onProgress?: (p: EmbedProgress) => void,
): Promise<ScoredDoc[]> {
  const vectors = await embedTexts([query, ...docs.map((d) => d.text)], onProgress);
  const queryVec = vectors[0];
  return docs.map((d, i) => ({
    score: Math.min(1, Math.max(0, cosineSimilarity(queryVec, vectors[i + 1]))),
    relevant: d.relevant,
  }));
}
