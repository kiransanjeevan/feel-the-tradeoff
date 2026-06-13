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

// FR-03 — the threshold sweep: Precision, Recall and F1 plotted across every
// threshold at once. The crossing point of the precision and recall curves is
// the whole lesson. A solid line marks where you currently are.
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
      <LineChart data={data} margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis
          dataKey="threshold"
          type="number"
          domain={[0, 1]}
          tickFormatter={(v: number) => v.toFixed(1)}
          label={{ value: 'threshold', position: 'insideBottom', offset: -8, fontSize: 12 }}
        />
        <YAxis domain={[0, 1]} tickFormatter={(v: number) => v.toFixed(1)} />
        <Tooltip
          formatter={(v: number, name) => [`${(v * 100).toFixed(1)}%`, name]}
          labelFormatter={(l: number) => `threshold ${l.toFixed(2)}`}
        />
        <Legend />
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
