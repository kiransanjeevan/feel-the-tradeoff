import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { COLORS } from '../theme';

// FR-06 — the differentiator. Expected cost = FP·cost(FP) + FN·cost(FN) across
// thresholds. The minimum of this curve is the cost-optimal threshold — the
// bridge from "metric" to "what should we actually ship?"
export function CostChart({
  data,
  threshold,
  optimal,
}: {
  data: { threshold: number; cost: number }[];
  threshold: number;
  optimal: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis
          dataKey="threshold"
          type="number"
          domain={[0, 1]}
          tickFormatter={(v: number) => v.toFixed(1)}
          label={{ value: 'threshold', position: 'insideBottom', offset: -8, fontSize: 12 }}
        />
        <YAxis label={{ value: 'expected cost', angle: -90, position: 'insideLeft', fontSize: 12 }} />
        <Tooltip labelFormatter={(l: number) => `threshold ${l.toFixed(2)}`} formatter={(v: number) => [v.toFixed(0), 'cost']} />
        <Line type="monotone" dataKey="cost" name="Expected cost" stroke={COLORS.cost} dot={false} strokeWidth={2} isAnimationActive={false} />
        <ReferenceLine x={threshold} stroke={COLORS.marker} strokeWidth={2} label={{ value: 'you', position: 'top', fontSize: 11 }} />
        <ReferenceLine
          x={optimal}
          stroke={COLORS.costOptimal}
          strokeDasharray="3 3"
          label={{ value: 'cost-optimal', position: 'top', fontSize: 11, fill: COLORS.costOptimal }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
