'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface BarChartProps {
  data: Record<string, string | number | undefined>[];
  bars: {
    key: string;
    name: string;
    color: string;
  }[];
  xKey?: string;
  height?: number;
  showLegend?: boolean;
  formatY?: (value: number) => string;
  stacked?: boolean;
}

export function BarChart({
  data,
  bars,
  xKey = 'week_start',
  height = 300,
  showLegend = true,
  formatY = (v) => v.toFixed(0),
  stacked = false,
}: BarChartProps) {
  const formatXAxis = (value: string) => {
    try {
      return format(parseISO(value), 'MMM d');
    } catch {
      return value;
    }
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 text-sm mb-2">
          {label ? format(parseISO(label), 'MMM d, yyyy') : ''}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatY(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey={xKey}
          tickFormatter={formatXAxis}
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={{ stroke: '#475569' }}
        />
        <YAxis
          tickFormatter={formatY}
          stroke="#64748b"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          tickLine={{ stroke: '#475569' }}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
          />
        )}
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

