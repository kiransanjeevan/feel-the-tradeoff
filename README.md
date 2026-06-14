# Feel the Trade-off

**An interactive retrieval-metrics lab.** Stop memorizing precision and recall — move the slider and *feel* the trade-off, with real metric math and a business-cost lens.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://feel-the-tradeoff.vercel.app)
[![CI](https://github.com/kiransanjeevan/feel-the-tradeoff/actions/workflows/ci.yml/badge.svg)](https://github.com/kiransanjeevan/feel-the-tradeoff/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

🔗 **[Open the live demo →](https://feel-the-tradeoff.vercel.app)**

<!-- TODO: add docs/demo.gif — record the threshold slider driving the curves + cost-optimal jump -->
> _Demo GIF coming. For now: `npm install && npm run dev`._

---

## Why this exists

Precision, recall, and F1 are usually taught as static formulas, so the intuition never sticks — people can recite "harmonic mean" but can't reason about *when to move a threshold which way*. RAG made that intuition urgent: every team shipping search now needs threshold, top-k, and reranking judgment.

This is a single-page, **zero-backend** lab that turns the precision/recall/F1 trade-off — and the wider retrieval-metric stack — into something you manipulate directly. It exists to deepen hands-on fluency with retrieval evaluation, and to be a public artifact showing that a product leader can *build* the measurement layer of AI search, not just talk about it.

## What it does

- **Feel the trade-off in real time** — drag a threshold; precision, recall, F-beta, and the confusion matrix recompute live.
- **See the whole curve** — the threshold-sweep chart plots precision / recall / F1 across *every* threshold at once, so you watch the curves cross.
- **Tune which error matters** — F0.5 / F1 / F2 controls mark the optimal threshold for your error priority.
- **Bridge metric → business decision** *(the differentiator)* — set the cost of a false positive vs. a false negative, and the lab finds the **cost-optimal threshold**. This is the part a PM actually owns.
- **Five real scenarios** — medical triage (a miss can be fatal), spam filtering (false alarms infuriate users), legal discovery (recall is near-sacred), and more — each with its own error-cost asymmetry.

## The metrics are tested — that's the whole point

The tool is worthless if the math is wrong, so the math is the anchor. [`src/metrics.ts`](src/metrics.ts) is a framework-agnostic core with **zero UI dependencies**, verified by 24 golden-value unit tests ([`src/metrics.test.ts`](src/metrics.test.ts)) hand-checked against textbook values — covering the threshold family (precision, recall, F-beta, sweep, PR curve), the cost-of-error model, and the full **@k ranking family** (Precision@k, Recall@k, MRR, MAP, NDCG, Hit Rate). The displayed numbers come straight from that tested core; the UI never reimplements a formula. CI runs the suite on every push.

## Tech

- **React + TypeScript + Vite** — static SPA, no backend, free to host
- **Recharts** for the sweep/cost charts; hand-rolled SVG for the score axis
- **Vitest + jsdom** — metrics unit tests and component smoke tests (30 tests total)
- **Okabe-Ito colorblind-safe palette** (WCAG-minded)
- All computation is client-side — **nothing leaves your browser**

## Run locally

```bash
npm install
npm run dev       # start the lab on localhost
npm test          # 30 tests (math core + UI smoke)
npm run build     # production build to dist/
```

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| v0.1 | Framework-agnostic, unit-tested metrics core | ✅ |
| v1.0 | Interactive MVP — slider, sweep chart, F-beta, cost-of-error, presets | ✅ |
| v1.5 | CSV upload + **real in-browser embeddings** (transformers.js) — type a query + docs, get real cosine scores feeding the same viz | ⏳ |
| v2.0 | PR curve, two-stage retrieval visual (rerank-then-truncate), full @k metric UI, shareable URLs, A/B compare, guided lessons | ⏳ |

## License

[MIT](LICENSE) © 2026 Kiran Sanjeevan
