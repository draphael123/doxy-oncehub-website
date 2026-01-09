'use client';

import { useMemo } from 'react';
import { Database, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useDataStore } from '@/lib/store';

const sourceLabels: Record<string, string> = {
  doxy_visits: 'Doxy Visits',
  doxy_over_20: 'Doxy Over 20 Min',
  gusto_hours: 'Gusto Hours',
  oncehub_visits: 'Oncehub Visits',
  oncehub_program: 'Oncehub Program',
};

const sourceColors: Record<string, string> = {
  doxy_visits: 'bg-emerald-500',
  doxy_over_20: 'bg-amber-500',
  gusto_hours: 'bg-purple-500',
  oncehub_visits: 'bg-blue-500',
  oncehub_program: 'bg-teal-500',
};

export function DataSourcesSummary() {
  const { metrics } = useDataStore();

  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    for (const metric of metrics) {
      counts[metric.source] = (counts[metric.source] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([source, count]) => ({
        source,
        label: sourceLabels[source] || source,
        count,
        color: sourceColors[source] || 'bg-slate-500',
      }))
      .sort((a, b) => b.count - a.count);
  }, [metrics]);

  const totalRecords = metrics.length;

  if (sourceCounts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="w-4 h-4 text-emerald-400" />
          Data Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sourceCounts.map(({ source, label, count, color }) => {
          const pct = totalRecords > 0 ? (count / totalRecords) * 100 : 0;
          
          return (
            <div key={source} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                  {label}
                </span>
                <span className="text-slate-400">{count.toLocaleString()} records</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${color} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-sm">
          <span className="text-slate-400">Total Records</span>
          <span className="text-slate-100 font-semibold">{totalRecords.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

