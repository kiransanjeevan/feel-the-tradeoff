import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { MetricPoint } from '../metrics';
import { COLORS } from '../theme';

export interface Marker {
  x: number;
  label: string;
  color: string;
}

const axisTick = { fill: COLORS.axisText, fontSize: 11, fontFamily: 'ui-monospace, monospace' };
const tooltipStyle = {
  background: COLORS.tooltipBg,
  border: `1px solid ${COLORS.tooltipBorder}`,
  borderRadius: 8,
  color: COLORS.tooltipText,
  fontSize: 12,
};

// FR-03 — the threshold sweep. Precision, Recall and F1 across every threshold;
// the crossing point is the lesson. The bright line marks where you are.
export function SweepChart({
  data,
  threshold,
  markers = [],
}: {
  data: MetricPoint[];
  threshold: number;
  markers?: Marker[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 18, right: 24, bottom: 14, left: -8 }}>
        <CartesianGrid stroke={COLORS.grid} strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey="threshold"
          type="number"
          domain={[0, 1]}
          tick={axisTick}
          tickFormatter={(v: number) => v.toFixed(1)}
          stroke={COLORS.grid}
        />
        <YAxis domain={[0, 1]} tick={axisTick} tickFormatter={(v: number) => v.toFixed(1)} stroke={COLORS.grid} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: COLORS.axisText }}
          cursor={{ stroke: COLORS.tooltipBorder }}
          formatter={(v: number, name) => [`${(v * 100).toFixed(1)}%`, name]}
          labelFormatter={(l: number) => `threshold ${l.toFixed(2)}`}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: COLORS.axisText }} iconType="plainline" />
        <Line type="monotone" dataKey="precision" name="Precision" stroke={COLORS.precision} dot={false} strokeWidth={2} isAnimationActive={false} />
        <Line type="monotone" dataKey="recall" name="Recall" stroke={COLORS.recall} dot={false} strokeWidth={2} isAnimationActive={false} />
        <Line type="monotone" dataKey="f1" name="F1" stroke={COLORS.f1} dot={false} strokeWidth={2} isAnimationActive={false} />
        <ReferenceLine x={threshold} stroke={COLORS.marker} strokeWidth={2} />
        {markers.map((m, i) => (
          <ReferenceLine
            key={i}
            x={m.x}
            stroke={m.color}
            strokeDasharray="3 3"
            label={{ value: m.label, position: 'top', fontSize: 11, fill: m.color }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
