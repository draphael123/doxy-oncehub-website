'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface TrendChartProps {
  data: Record<string, string | number | undefined>[];
  lines: {
    key: string;
    name: string;
    color: string;
  }[];
  xKey?: string;
  height?: number;
  showLegend?: boolean;
  formatY?: (value: number) => string;
}

export function TrendChart({
  data,
  lines,
  xKey = 'week_start',
  height = 300,
  showLegend = true,
  formatY = (v) => v.toFixed(0),
}: TrendChartProps) {
  const formatXAxis = (value: string) => {
    try {
      const date = parseISO(value);
      if (isNaN(date.getTime())) return value;
      // Check if it's the first of the month (likely monthly data)
      if (value.endsWith('-01')) {
        return format(date, 'MMM yyyy');
      }
      return format(date, 'MMM d');
    } catch {
      return value;
    }
  };

  const formatDateSafe = (value: string | undefined): string => {
    if (!value) return '';
    try {
      const date = parseISO(value);
      if (isNaN(date.getTime())) return value;
      return format(date, 'MMM d, yyyy');
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
          {formatDateSafe(label)}
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
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={{ fill: line.color, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

