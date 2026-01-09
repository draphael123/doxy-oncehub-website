'use client';

import { AlertTriangle, TrendingUp, TrendingDown, Activity, Info } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Insight } from '@/lib/types';

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const getIcon = () => {
    switch (insight.type) {
      case 'wow_change':
        return insight.change && insight.change > 0 
          ? <TrendingUp className="w-5 h-5" />
          : <TrendingDown className="w-5 h-5" />;
      case 'outlier':
        return <AlertTriangle className="w-5 h-5" />;
      case 'trend':
        return <Activity className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const severityVariant = {
    info: 'info' as const,
    warning: 'warning' as const,
    critical: 'danger' as const,
  };

  const severityColors = {
    info: 'text-blue-400 bg-blue-500/10',
    warning: 'text-amber-400 bg-amber-500/10',
    critical: 'text-red-400 bg-red-500/10',
  };

  const severityBorders = {
    info: 'border-l-blue-500',
    warning: 'border-l-amber-500',
    critical: 'border-l-red-500',
  };

  return (
    <Card className={`border-l-4 ${severityBorders[insight.severity]}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${severityColors[insight.severity]}`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-slate-100 font-medium">{insight.title}</h4>
              <Badge variant={severityVariant[insight.severity]} size="sm">
                {insight.type === 'wow_change' ? 'WoW' : insight.type}
              </Badge>
            </div>
            <p className="text-slate-400 text-sm">{insight.description}</p>
            {insight.provider && (
              <p className="text-slate-500 text-xs mt-1">
                Provider: {insight.provider}
              </p>
            )}
          </div>
          {insight.changePercent !== undefined && (
            <div className={`text-right ${insight.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <span className="text-lg font-bold">
                {insight.changePercent > 0 ? '+' : ''}{insight.changePercent.toFixed(1)}%
              </span>
            </div>
          )}
          {insight.zScore !== undefined && (
            <div className="text-right text-slate-400">
              <span className="text-sm">z: {insight.zScore.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

