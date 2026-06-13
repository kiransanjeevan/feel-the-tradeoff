# PRD — Retrieval Metrics Lab

> **Working title:** Retrieval Metrics Lab _(name [TBD] — alternatives: RAG Eval Playground, Precision/Recall Lab)_
> **PRD type:** Type 2 — Traditional product (open-source educational web app) with a lightweight AI appendix
> **Author:** Kiran Sanjeevan · **Status:** Draft v1 · **Date:** 2026-06-09
> **One-liner:** An interactive, browser-based lab that turns the precision/recall/F1 trade-off — and the full RAG retrieval-metric stack — into something you can *feel* by moving sliders, with real embeddings and a business-cost lens.

---

## 1. Executive Summary

Most people learn precision, recall, and F1 from a static formula and forget the intuition the moment they need it. There are many "explainer" pages, but almost none let you (a) tune a threshold and watch the trade-off move in real time, (b) feed in *real* text and see *real* embedding scores, or (c) translate the metric into a *business decision* via the cost of each error type.

**Retrieval Metrics Lab** is a single-page web app that does all three. It teaches the metrics that govern search and RAG systems through direct manipulation, grounds them in real in-browser embeddings (no backend), and frames every choice as a product decision.

**Why it exists (dual purpose, stated honestly):**
1. **Learning** — deepen the author's hands-on fluency with retrieval evaluation (embeddings, cosine similarity, the @k metric family, the two-stage retrieval pattern).
2. **Portfolio** — a credible, public artifact demonstrating that a product leader understands *and can build* the measurement layer of AI search — not just talk about it.

**Decision requested:** Approve scope for a phased build, ship **v1.0** publicly (GitHub + live demo), then decide on v1.5/v2 based on reception.

---

## 2. Problem & Opportunity _(adapted: audience, not $ TAM)_

### 2a. The learning gap
- Precision/recall/F1 are taught as formulas, so the **intuition doesn't stick** — people can recite "harmonic mean" but can't reason about *when to move a threshold which way*.
- Existing explainers are **static and synthetic** — they show one frozen example, never let you experiment, and never use real embeddings.
- The leap from **metric → product decision** (what threshold should *we* ship?) is almost never taught, yet it's the part a PM actually owns.
- RAG made this urgent: every team building search/RAG now needs threshold, top-k, and reranking intuition, and most learn it the hard way in production.

### 2b. Audience (who this is for)
| Segment | Who | Why they'd use it |
|---|---|---|
| **Primary** | PMs & analysts building or evaluating AI/search/RAG features | Need decision intuition, not math; care about the business-cost angle |
| **Secondary** | Junior/career-switching engineers & data scientists | Want an interactive way to internalize the @k metric family before interviews/work |
| **Tertiary** | Educators & content creators | A free, linkable, embeddable teaching aid |

### 2c. Why now
- **Technology shift:** in-browser ML (`transformers.js` + WASM/WebGPU) now runs real embedding models client-side — real cosine scores with **zero backend and zero hosting cost**, which was impractical a few years ago.
- **Behavior shift:** RAG went mainstream; threshold/top-k/reranking intuition is now a broadly needed skill, not a niche IR topic.
- **Distribution shift:** dev-education tools that are interactive + free + no-login spread well on GitHub, Hacker News, and LinkedIn.

> This is **not a revenue product.** There is no $ TAM section because monetization is not a goal; success is measured in learning and credibility (Section 3 & 8d).

---

## 3. Goals & Non-Goals

### Goals
1. Make the **precision/recall/F1 trade-off** intuitively obvious through real-time manipulation.
2. Teach the **two-stage retrieval pattern** correctly — a wide first stage keeps **recall** high; **reranking _then_ top-k truncation together** recover **precision**. (Truncation _alone_ is the trap: it drops relevant docs the cheap first-stage retriever under-ranked. Reranking is what makes the top-k cut keep the right ones.)
3. Bridge **metric → business decision** via a cost-of-error model that finds the cost-optimal threshold.
4. Use **real embeddings** so scores aren't fabricated.
5. Ship a **clean, tested, deployed** open-source repo that stands as a portfolio piece.

### Non-Goals (explicit — guards against scope creep)
- ❌ Not a production eval framework or a replacement for RAGAS/TruLens.
- ❌ Not a model-training or fine-tuning tool.
- ❌ No accounts, no backend, no data storage, no monetization.
- ❌ Not a generic ML-metrics suite (ROC/AUC for arbitrary classifiers is out unless it serves the retrieval story).

---

## 4. Target Users — Primary Persona

**"Maya, the AI-curious PM."** Ships search/RAG features, partners with ML engineers, can read a chart but not a paper. She needs to answer "what threshold do we ship, and why?" in a room with engineers — and wants the intuition to hold her own. Observable traits: comfortable with dashboards and A/B tests, not with linear algebra; learns by doing; values the business framing over the derivation.

---

## 5. Proposed Product

### 5a. Functional Requirements

**Metrics core (NO AI — works on synthetic or uploaded scores):**

| ID | Requirement | Priority | Rationale |
|----|-------------|----------|-----------|
| FR-01 | Threshold slider that recomputes Recall, Precision, F1 + confusion matrix live | P0 | The core interaction |
| FR-02 | Document-score visualization (dots on a 0–1 axis, colored by relevance, gate marker) | P0 | Makes the trade-off visible |
| FR-03 | **Threshold-sweep chart** — Precision, Recall, F1 plotted across all thresholds at once | P0 | Highest-impact viz; shows curves crossing |
| FR-04 | Precision–Recall curve | P1 | Standard, expected by credible audience |
| FR-05 | **F-beta weight control** (F1 → F2 → F0.5) with the optimal threshold marked | P0 | Teaches "which error matters is a business choice" |
| FR-06 | **Cost-of-error model** — set cost(FP) vs cost(FN), compute expected cost, mark cost-optimal threshold | P0 | The differentiator; metric → decision |
| FR-07 | 5+ preset scenarios (PM Compass, medical, spam, legal, clean-separation) with explanations | P0 | Concretizes error asymmetry |
| FR-08 | **Two-stage model:** show stage-1 wide retrieval (high recall) → stage-2 rerank → top-k truncation as _one pipeline_, with each step's effect on precision/recall isolated | P1 | Corrects the common conflation (truncation ≠ the precision fix); research-backed |
| FR-09 | Full @k metric family: Precision@k, Recall@k, MRR, NDCG, MAP, Hit Rate, with tooltips | P1 | Ties to real RAG evaluation |
| FR-10 | Upload CSV of `(score,label)` or `(query,doc,relevance)` → compute on real data | P1 | Credibility leap from synthetic |
| FR-11 | Shareable state encoded in URL (scenario + settings) | P1 | Linkable for teaching |
| FR-12 | A/B compare two configurations side by side | P2 | "Which wins and why" |
| FR-13 | Guided lessons + 1–2 challenges ("tune for max F2") | P2 | Active recall > passive reading |

**AI-dependent (optional enhancement):**

| ID | Requirement | Priority | Rationale |
|----|-------------|----------|-----------|
| FR-14 | **In-browser embeddings:** type a query + docs, embed client-side, show real cosine scores feeding the metrics | P1 | The "I built the eval layer" proof; no backend |
| FR-15 | Graceful fallback: if the model can't load (old browser), fall back to synthetic/CSV mode with a notice | P1 | AI-independent safety net |

> **AI-dependent vs independent:** FR-01–13 are the product's spine and run with no model at all. FR-14 is the magic layer. This separation means the tool is fully usable even when in-browser ML is unavailable.

### 5b. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Slider → recompute → re-render | < 50 ms (instant feel) |
| Performance | In-browser model first load | < 10 s on broadband + modern device (network/hardware-dependent); progress UI always shown; near-instant after first cache |
| Correctness | Metric math vs textbook reference values | 100% match, **unit-tested** |
| Accessibility | Colorblind-safe palette; keyboard-operable slider; ARIA labels | WCAG 2.1 AA where feasible |
| Responsive | Works on laptop + tablet | Yes (mobile = best-effort) |
| Privacy | All computation client-side; no data leaves the browser | Enforced (no backend) |
| Hosting | Static deploy | GitHub Pages / Vercel, free tier |

### 5c. Key User Flows
- **Happy path:** land → pick "PM Compass" preset → drag threshold → see recall/precision/F1 + narration → toggle F-beta → set error costs → see cost-optimal threshold → "aha."
- **Real-data path:** switch to embeddings mode → type query + 5 docs → model embeds → real cosine scores populate the same viz.
- **Failure path:** model fails to load → banner: "Live embeddings unavailable in this browser — using sample data" → full functionality preserved on synthetic/CSV.

---

## 6. Differentiation

**Primary differentiator:** the only retrieval-metrics explainer that goes **metric → real embeddings → business decision** (cost-of-error optimal threshold), instead of stopping at a static formula.

**Supporting:**
- Real in-browser embeddings (most explainers fake the scores).
- Correct two-stage framing (**rerank-then-truncate**, not truncation alone) grounded in cited research.
- Product-decision lens that maps to how PMs actually work.

**Durability:** low technical moat (it's open source and replicable) — but that's acceptable; the goal is *learning + credibility*, not defensibility. The lasting value is the author's demonstrated understanding and the artifact's quality/polish.

---

## 7. Out of Scope / Phased Roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| **v0.1 Foundation** | React+TS+Vite scaffold; framework-agnostic `metrics.ts`; **unit tests**; port current 5 presets | All metrics match textbook values in tests |
| **v1.0 Correct MVP (soft-ship)** | FR-01,02,03,05,06,07 + one predict-then-reveal beat + deployed live demo + real README | A differentiated, correct, shippable tool. **Deploy live + repo public — but hold the GTM blitz** (Show HN / LinkedIn) for v1.5, when real embeddings complete the stated differentiation. |
| **v1.5 Real data** | FR-10 (CSV) + FR-14/15 (in-browser embeddings) | Real scores flow through the same UI |
| **v2.0 Eval reference** | FR-04,08,09,11,12,13 | Becomes a bookmark-worthy reference |

> Discipline: **ship v1.0 before building v1.5.** A finished small thing beats an unfinished ambitious one.
> _Note: v1.0 still ships live; what waits for v1.5 is the **public marketing push** — so the launch moment matches the full "metric → real embeddings → business decision" story rather than undercutting it with a half-differentiated version._

---

## 8. Go-to-Market _(adapted: distribution + impact, no revenue)_

### 8a. Distribution channels
- **Soft-ship at v1.0** (repo public, live demo, quiet share). **Full push at v1.5** when embeddings land: GitHub (README with GIF + live-demo badge), Show HN, LinkedIn post tied to the author's AI-building narrative, relevant subreddits / dev newsletters.

### 8b. Positioning
- One line: *"Stop memorizing precision and recall. Move the slider and feel the trade-off — with real embeddings and a business-cost lens."*

### 8c. Success Metrics

| Metric | Target | Timeframe | Counter-metric |
|--------|--------|-----------|----------------|
| **Active engagement** — % of sessions with ≥1 slider/threshold interaction | > 40% | 90 days post-push | Median time-on-page (if < 45 s, the tool isn't landing) |
| Live-demo sessions | 1,000+ | 90 days post-push | (volume — weight lightly; engagement quality matters more) |
| GitHub stars | 100+ | 90 days | (vanity — weight lightly) |
| **Author learning goal (made falsifiable)** — publish a written/recorded walkthrough defending every metric + the two-stage pattern from first principles, _and_ beat own challenge-mode targets | Artifact exists + passes | By public push | — |
| Portfolio impact | Referenced in ≥1 interview / cited as proof of hands-on AI depth | Ongoing | — |
| Math correctness | 0 reported metric bugs | Ongoing | — |

> Bounce rate was deliberately removed as a counter-metric: for a single-page tool, a high bounce is consistent with a user getting the full "aha" and leaving. Interaction depth, not bounce, is the real signal.

---

## 9. Appendix A — Lightweight AI Treatment (for FR-14, in-browser embeddings)

**Model selection:** a small sentence-embedding model running client-side via `transformers.js` (e.g., MiniLM-class, ~20–30MB quantized) — chosen for size/load-time over peak quality, since this is illustrative, not production retrieval.
**Cost (TCO):** ≈ **$0** — inference runs on the user's device; hosting is a static site. No per-user server cost at any scale. This is the entire reason the AI sections are light.
**Privacy/safety:** all text stays in the browser; nothing is transmitted. Low risk surface. Main failure mode = model fails to load on old hardware → handled by FR-15 fallback.
**Evals (meta-irony noted):** the tool *is* an eval visualizer; its own "quality bar" is that displayed metrics exactly match the tested `metrics.ts` core.

---

## 10. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Incorrect metric math** (credibility-killing) | High | Unit-test the core against textbook values *before* any UI; it's the project's anchor |
| **"Just another explainer"** | Med | Lead with the real-embeddings + cost-of-error differentiators; cut generic content |
| **Scope creep** | Med | Hard phase gates; publish v1.0 before v1.5 |
| **Eats interview-prep time** | Med | Time-box; treat as learning, not a deadline |
| **In-browser model perf on weak devices** | Low | Fallback to synthetic/CSV (FR-15) |

---

## 11. Litmus Test (6-question, Traditional PRD)

| # | Question | Result | Note |
|---|----------|--------|------|
| 1 | Problem validated? | **Clear** | Author's own learning need + widely-known weak intuition around these metrics |
| 2 | Segment specific? | **Clear** | "Maya, the AI-curious PM"; secondary engineers/educators |
| 3 | Requirements estimable? | **Clear** | FRs are concrete and scoped; phased |
| 4 | Moat thesis? | **Weak — accepted** | Low technical moat by design; goal is learning + credibility, not defensibility |
| 5 | GTM feasible? | **Clear** | Free static site, organic dev channels |
| 6 | Success metrics with targets? | **Clear** | Section 8c, with counter-metrics |

**Verdict:** Ready for build. The one "Weak" (moat) is intentional and acceptable for a non-commercial portfolio/learning project — flagged, not hidden.

---

## 12. Open Questions [TO BE DETERMINED]

1. **Final project name** _(open)_ — Retrieval Metrics Lab vs RAG Eval Playground vs Precision/Recall Lab. _Recommend "Retrieval Metrics Lab": broadest, not boxed into precision/recall only._
2. **Time budget** _(open — needs your input)_ — how many hours/week, given interview prep is the priority? Sets the realistic v1.0 date.
3. ~~**v1.0 metric scope** — is cost-of-error (FR-06) in the MVP?~~ **Resolved:** FR-06 is in v1.0 (Sections 5 & 7) — it's the differentiator, not a fast-follow.
4. ~~**Embedding model choice**~~ **Resolved:** `all-MiniLM-L6-v2` (384-dim, ~23 MB quantized) via transformers.js — the standard small-and-good default. Revisit only if load-time tests fail the NFR.
