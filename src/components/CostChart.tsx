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

const axisTick = { fill: COLORS.axisText, fontSize: 11, fontFamily: 'ui-monospace, monospace' };
const tooltipStyle = {
  background: COLORS.tooltipBg,
  border: `1px solid ${COLORS.tooltipBorder}`,
  borderRadius: 8,
  color: COLORS.tooltipText,
  fontSize: 12,
};

// FR-06 — expected cost across thresholds; its minimum is the cost-optimal
// threshold — the bridge from metric to "what should we ship?"
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
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 18, right: 24, bottom: 14, left: 2 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis
          dataKey="threshold"
          type="number"
          domain={[0, 1]}
          tick={axisTick}
          tickFormatter={(v: number) => v.toFixed(1)}
          stroke={COLORS.grid}
        />
        <YAxis tick={axisTick} stroke={COLORS.grid} width={44} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: COLORS.axisText }}
          cursor={{ stroke: COLORS.tooltipBorder }}
          labelFormatter={(l: number) => `threshold ${l.toFixed(2)}`}
          formatter={(v: number) => [v.toFixed(0), 'cost']}
        />
        <Line type="monotone" dataKey="cost" name="Expected cost" stroke={COLORS.cost} dot={false} strokeWidth={2} isAnimationActive={false} />
        <ReferenceLine x={threshold} stroke={COLORS.marker} strokeWidth={2} label={{ value: 'you', position: 'top', fontSize: 11, fill: COLORS.marker }} />
        <ReferenceLine
          x={optimal}
          stroke={COLORS.costOptimal}
          strokeDasharray="3 3"
          label={{ value: 'optimal', position: 'top', fontSize: 11, fill: COLORS.costOptimal }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
