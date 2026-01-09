'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface KPITileProps {
  label: string;
  value: number | string;
  change?: number;
  format?: 'number' | 'percent' | 'decimal' | 'duration' | 'ratio';
  icon?: React.ReactNode;
  className?: string;
}

export function KPITile({ label, value, change, format = 'number', icon, className = '' }: KPITileProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percent':
        return `${val.toFixed(1)}%`;
      case 'decimal':
        return val.toFixed(2);
      case 'duration':
        return `${val.toFixed(1)} min`;
      case 'ratio':
        return val.toFixed(2);
      default:
        return val.toLocaleString();
    }
  };

  const getTrend = () => {
    if (change === undefined || change === 0) return 'neutral';
    return change > 0 ? 'up' : 'down';
  };

  const trend = getTrend();

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  };

  const trendBgColors = {
    up: 'bg-emerald-500/10',
    down: 'bg-red-500/10',
    neutral: 'bg-slate-500/10',
  };

  return (
    <Card hover className={className}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-100 tracking-tight">
              {formatValue(value)}
            </p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 ${trendColors[trend]}`}>
                {trend === 'up' && <TrendingUp className="w-4 h-4" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4" />}
                {trend === 'neutral' && <Minus className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {change > 0 ? '+' : ''}{change.toFixed(1)}% WoW
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className={`p-3 rounded-xl ${trendBgColors[trend]}`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

