import type { ScoredDoc } from '../metrics';
import { COLORS } from '../theme';

// FR-02 — documents as dots on a 0–1 score axis, colored by relevance, with a
// draggable "gate" at the threshold. Everything right of the gate is predicted
// relevant. Hand-rolled SVG (cleaner than bending a chart lib to this shape).

const W = 600;
const H = 150;
const L = 56;
const R = 560;
const innerW = R - L;
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
      {/* predicted-relevant region */}
      <rect x={gx} y={18} width={R - gx} height={94} fill="rgba(0,114,178,0.07)" />

      {/* baseline + ticks */}
      <line x1={L} y1={112} x2={R} y2={112} stroke="#ccc" />
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={112} x2={x(t)} y2={117} stroke="#ccc" />
          <text x={x(t)} y={132} fontSize={12} fill="#999" textAnchor="middle">
            {t}
          </text>
        </g>
      ))}

      {/* band labels */}
      <text x={L - 10} y={50} fontSize={11} fill={COLORS.relevant} textAnchor="end" dominantBaseline="middle">
        rel
      </text>
      <text x={L - 10} y={84} fontSize={11} fill={COLORS.irrelevant} textAnchor="end" dominantBaseline="middle">
        irrel
      </text>

      {/* the gate */}
      <line x1={gx} y1={14} x2={gx} y2={114} stroke={COLORS.marker} strokeWidth={2} strokeDasharray="4 3" />
      <text x={gx} y={10} fontSize={11} fill={COLORS.marker} textAnchor="middle">
        gate {threshold.toFixed(2)}
      </text>

      {/* document dots */}
      {docs.map((d, i) => (
        <circle
          key={i}
          cx={x(d.score)}
          cy={d.relevant ? 50 : 84}
          r={7}
          fill={d.relevant ? COLORS.relevant : COLORS.irrelevant}
          fillOpacity={d.score >= threshold ? 0.95 : 0.35}
          stroke="#fff"
          strokeWidth={1.5}
        >
          <title>
            score {d.score.toFixed(2)} · {d.relevant ? 'relevant' : 'irrelevant'} ·{' '}
            {d.score >= threshold ? 'predicted relevant' : 'predicted not relevant'}
          </title>
        </circle>
      ))}
    </svg>
  );
}
