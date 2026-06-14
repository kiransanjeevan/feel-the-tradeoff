import type { ScoredDoc } from '../metrics';
import { COLORS } from '../theme';

// FR-02 — the signature visual. Documents as glowing dots on a 0–1 score axis,
// colored by relevance, with a bright gate at the threshold. Everything right
// of the gate is predicted relevant; dots left of it dim. Hand-rolled SVG.

const W = 660;
const H = 168;
const L = 70;
const R = 624;
const innerW = R - L;
const yRel = 52;
const yIrr = 96;
const baseY = 122;
const x = (score: number) => L + score * innerW;

export function ScoreAxis({ docs, threshold }: { docs: ScoredDoc[]; threshold: number }) {
  const gx = x(threshold);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Document scores on a 0 to 1 axis with the threshold gate at ${threshold.toFixed(2)}`}
    >
      <defs>
        <filter id="dotGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="predFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={COLORS.marker} stopOpacity="0.12" />
          <stop offset="100%" stopColor={COLORS.marker} stopOpacity="0.015" />
        </linearGradient>
      </defs>

      {/* predicted-relevant region */}
      <rect x={gx} y={24} width={R - gx} height={baseY - 24} fill="url(#predFill)" />

      {/* baseline + ticks */}
      <line x1={L} y1={baseY} x2={R} y2={baseY} stroke="#2a303a" />
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={baseY} x2={x(t)} y2={baseY + 5} stroke="#343b46" />
          <text x={x(t)} y={baseY + 20} fontSize={11} fill={COLORS.axisText} textAnchor="middle" fontFamily="ui-monospace, monospace">
            {t}
          </text>
        </g>
      ))}

      {/* band labels */}
      <text x={L - 12} y={yRel} fontSize={11} fill={COLORS.relevant} textAnchor="end" dominantBaseline="middle">
        Relevant
      </text>
      <text x={L - 12} y={yIrr} fontSize={11} fill={COLORS.irrelevant} textAnchor="end" dominantBaseline="middle">
        Irrelevant
      </text>

      {/* the gate */}
      <line x1={gx} y1={26} x2={gx} y2={baseY} stroke={COLORS.marker} strokeWidth={1.5} />
      <g transform={`translate(${gx}, 16)`}>
        <rect x={-22} y={-13} width={44} height={18} rx={5} fill={COLORS.marker} />
        <text x={0} y={-1} fontSize={11} fontWeight={600} fill="#0a0d16" textAnchor="middle" fontFamily="ui-monospace, monospace">
          {threshold.toFixed(2)}
        </text>
      </g>

      {/* document dots */}
      {docs.map((d, i) => {
        const passed = d.score >= threshold;
        const color = d.relevant ? COLORS.relevant : COLORS.irrelevant;
        return (
          <circle
            key={i}
            cx={x(d.score)}
            cy={d.relevant ? yRel : yIrr}
            r={6.5}
            fill={color}
            fillOpacity={passed ? 1 : 0.28}
            filter={passed ? 'url(#dotGlow)' : undefined}
          >
            <title>
              score {d.score.toFixed(2)} · {d.relevant ? 'relevant' : 'irrelevant'} ·{' '}
              {passed ? 'predicted relevant' : 'predicted not relevant'}
            </title>
          </circle>
        );
      })}
    </svg>
  );
}
