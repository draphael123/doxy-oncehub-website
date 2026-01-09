'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { BarChart } from './charts/bar-chart';
import { useDataStore } from '@/lib/store';

interface ProgramData {
  program: string;
  initial_visits: number;
  followup_visits: number;
  other_visits: number;
  total_visits: number;
}

export function ProgramBreakdown() {
  const { filteredMetrics, filters } = useDataStore();

  // Aggregate program data
  const programData = useMemo(() => {
    const programMetrics = filteredMetrics.filter(m => m.source === 'oncehub_program');
    
    if (programMetrics.length === 0) return [];

    const byProgram = new Map<string, ProgramData>();

    for (const metric of programMetrics) {
      if (!metric.program || !metric.program_visits) continue;

      const existing = byProgram.get(metric.program) || {
        program: metric.program,
        initial_visits: 0,
        followup_visits: 0,
        other_visits: 0,
        total_visits: 0,
      };

      const visits = metric.program_visits;
      const visitGroup = (metric.visit_group || '').toLowerCase();

      if (visitGroup.includes('initial')) {
        existing.initial_visits += visits;
      } else if (visitGroup.includes('follow')) {
        existing.followup_visits += visits;
      } else {
        existing.other_visits += visits;
      }
      existing.total_visits += visits;

      byProgram.set(metric.program, existing);
    }

    return Array.from(byProgram.values()).sort((a, b) => b.total_visits - a.total_visits);
  }, [filteredMetrics]);

  // Aggregate by week/month for trends
  const programTrendData = useMemo(() => {
    const programMetrics = filteredMetrics.filter(m => m.source === 'oncehub_program');
    
    if (programMetrics.length === 0) return [];

    const byPeriod = new Map<string, Record<string, number | string>>();

    for (const metric of programMetrics) {
      if (!metric.program || !metric.program_visits) continue;

      const periodKey = filters.timePeriod === 'monthly' 
        ? metric.week_start.substring(0, 7) + '-01'
        : metric.week_start;

      const existing = byPeriod.get(periodKey) || { week_start: periodKey };
      
      const programKey = metric.program.toUpperCase();
      existing[programKey] = ((existing[programKey] as number) || 0) + metric.program_visits;

      byPeriod.set(periodKey, existing);
    }

    return Array.from(byPeriod.values()).sort((a, b) => 
      String(a.week_start).localeCompare(String(b.week_start))
    );
  }, [filteredMetrics, filters.timePeriod]);

  if (programData.length === 0) {
    return null;
  }

  // Get unique programs for chart
  const programs = [...new Set(programData.map(p => p.program))];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-100">Program Breakdown</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Visits by Program</CardTitle>
            <CardDescription>Total visits split by program type</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={programData as unknown as Record<string, string | number | undefined>[]}
              bars={[
                { key: 'initial_visits', name: 'Initial Visits', color: '#10b981' },
                { key: 'followup_visits', name: 'Follow-up Visits', color: '#3b82f6' },
                { key: 'other_visits', name: 'Other', color: '#6b7280' },
              ]}
              xKey="program"
              height={250}
              stacked
            />
          </CardContent>
        </Card>

        {/* Program Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Program Trends Over Time</CardTitle>
            <CardDescription>{filters.timePeriod === 'monthly' ? 'Monthly' : 'Weekly'} visits by program</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={programTrendData}
              bars={programs.map((program, index) => ({
                key: program.toUpperCase(),
                name: program,
                color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][index % 4],
              }))}
              xKey="week_start"
              height={250}
              stacked
            />
          </CardContent>
        </Card>
      </div>

      {/* Program Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Program Summary</CardTitle>
          <CardDescription>Detailed breakdown by program and visit type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Program</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Initial Visits</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Follow-up Visits</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Other</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">Total</th>
                  <th className="text-right py-3 px-4 text-slate-300 font-medium">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {programData.map((program) => {
                  const grandTotal = programData.reduce((sum, p) => sum + p.total_visits, 0);
                  const pct = grandTotal > 0 ? (program.total_visits / grandTotal) * 100 : 0;
                  
                  return (
                    <tr key={program.program} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-100 font-medium">{program.program}</td>
                      <td className="py-3 px-4 text-emerald-400 text-right">{program.initial_visits.toLocaleString()}</td>
                      <td className="py-3 px-4 text-blue-400 text-right">{program.followup_visits.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-400 text-right">{program.other_visits.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-100 text-right font-semibold">{program.total_visits.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2 py-1 rounded text-sm font-medium bg-slate-700 text-slate-300">
                          {pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

