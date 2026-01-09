'use client';

import { useMemo, useState, useEffect } from 'react';
import { Download, Users, TrendingUp, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProviderFilter } from '@/components/provider-filter';
import { TrendChart } from '@/components/charts/trend-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { TimePeriodToggle } from '@/components/time-period-toggle';
import { useDataStore } from '@/lib/store';
import { aggregateByProvider, getUniqueWeeks, aggregateByTimePeriod } from '@/lib/insights';
import { downloadCSV } from '@/lib/demo-data';

export default function ProvidersPage() {
  const { filteredMetrics, metrics, filters } = useDataStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const providerAggregates = useMemo(() => 
    aggregateByProvider(filteredMetrics), [filteredMetrics]
  );

  const periodAggregates = useMemo(() => 
    aggregateByTimePeriod(filteredMetrics, filters.timePeriod), [filteredMetrics, filters.timePeriod]
  );

  const weeks = useMemo(() => getUniqueWeeks(filteredMetrics), [filteredMetrics]);
  
  const periods = useMemo(() => 
    periodAggregates.map(p => p.week_start), [periodAggregates]
  );

  // Prepare provider comparison chart data
  const providerComparisonData = useMemo(() => {
    return providerAggregates.map(p => ({
      provider: p.provider.split(' ').slice(-1)[0], // Last name only for chart
      full_name: p.provider,
      avg_visits: p.avg_visits_total,
      avg_duration: p.avg_duration_min,
      avg_hours: p.avg_hours_total,
      utilization: p.avg_utilization,
      pct_over_20: p.avg_pct_over_20,
    }));
  }, [providerAggregates]);

  // Prepare trend data for selected providers (respects time period filter)
  const trendData = useMemo(() => {
    const dataByPeriod = new Map<string, Record<string, number | string>>();
    
    // Initialize with period keys
    for (const period of periods) {
      dataByPeriod.set(period, { week_start: period });
    }

    // For monthly view, aggregate by month
    if (filters.timePeriod === 'monthly') {
      for (const metric of filteredMetrics) {
        const monthKey = metric.week_start.substring(0, 7) + '-01';
        const periodData = dataByPeriod.get(monthKey);
        if (!periodData) continue;

        const providerKey = metric.provider.replace(/[^a-zA-Z]/g, '_');
        
        // Accumulate values for monthly aggregation
        if (metric.visits_total !== undefined) {
          periodData[`${providerKey}_visits`] = ((periodData[`${providerKey}_visits`] as number) || 0) + metric.visits_total;
        }
        if (metric.avg_duration_min !== undefined) {
          // For duration, we'll take the latest value (not ideal but works)
          periodData[`${providerKey}_duration`] = metric.avg_duration_min;
        }
        if (metric.hours_total !== undefined) {
          periodData[`${providerKey}_hours`] = ((periodData[`${providerKey}_hours`] as number) || 0) + metric.hours_total;
        }
      }
    } else {
      // Weekly view - direct mapping
      for (const metric of filteredMetrics) {
        const periodData = dataByPeriod.get(metric.week_start);
        if (!periodData) continue;

        const providerKey = metric.provider.replace(/[^a-zA-Z]/g, '_');
        
        if (metric.visits_total !== undefined) {
          periodData[`${providerKey}_visits`] = metric.visits_total;
        }
        if (metric.avg_duration_min !== undefined) {
          periodData[`${providerKey}_duration`] = metric.avg_duration_min;
        }
        if (metric.hours_total !== undefined) {
          periodData[`${providerKey}_hours`] = metric.hours_total;
        }
      }
    }

    return Array.from(dataByPeriod.values()).sort((a, b) => 
      String(a.week_start).localeCompare(String(b.week_start))
    );
  }, [filteredMetrics, periods, filters.timePeriod]);

  // Get selected providers for trend lines
  const selectedProviders = useMemo(() => {
    if (filters.providers.length > 0) {
      return filters.providers.slice(0, 5); // Max 5 for readability
    }
    return providerAggregates.slice(0, 3).map(p => p.provider);
  }, [filters.providers, providerAggregates]);

  const trendLineColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  const handleExport = () => {
    downloadCSV(providerComparisonData as unknown as Record<string, unknown>[], 'provider-metrics.csv');
  };

  if (!mounted) return null;

  if (metrics.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">No Data Available</h2>
        <p className="text-slate-400">
          Upload an Excel file from the Overview page to view provider analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Provider Dashboard</h1>
          <p className="text-slate-400">
            Compare and analyze individual provider performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TimePeriodToggle />
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export Provider Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ProviderFilter />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Provider Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Providers</p>
                    <p className="text-2xl font-bold text-slate-100">{providerAggregates.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Avg Visits/Week</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {(providerAggregates.reduce((sum, p) => sum + p.avg_visits_total, 0) / 
                        Math.max(providerAggregates.length, 1)).toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Avg Hours/Week</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {(providerAggregates.reduce((sum, p) => sum + p.avg_hours_total, 0) / 
                        Math.max(providerAggregates.length, 1)).toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-500/20">
                    <TrendingUp className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Avg Utilization</p>
                    <p className="text-2xl font-bold text-slate-100">
                      {(providerAggregates.reduce((sum, p) => sum + p.avg_utilization, 0) / 
                        Math.max(providerAggregates.length, 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Provider Visits Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Average Visits by Provider</CardTitle>
              <CardDescription>Weekly average visit count per provider</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={providerComparisonData}
                bars={[
                  { key: 'avg_visits', name: 'Avg Visits', color: '#10b981' },
                ]}
                xKey="provider"
                height={300}
                showLegend={false}
              />
            </CardContent>
          </Card>

          {/* Hours and Utilization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hours by Provider</CardTitle>
                <CardDescription>Average weekly hours worked</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={providerComparisonData}
                  bars={[
                    { key: 'avg_hours', name: 'Avg Hours', color: '#8b5cf6' },
                  ]}
                  xKey="provider"
                  height={250}
                  showLegend={false}
                  formatY={(v) => `${v.toFixed(1)}h`}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilization by Provider</CardTitle>
                <CardDescription>Visits per hour worked</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={providerComparisonData}
                  bars={[
                    { key: 'utilization', name: 'Utilization', color: '#14b8a6' },
                  ]}
                  xKey="provider"
                  height={250}
                  showLegend={false}
                  formatY={(v) => v.toFixed(2)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Provider Trends Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Visits Over Time</CardTitle>
              <CardDescription>
                {filters.timePeriod === 'monthly' ? 'Monthly' : 'Weekly'} visit trends for {selectedProviders.length} selected provider(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={trendData}
                lines={selectedProviders.map((provider, index) => ({
                  key: `${provider.replace(/[^a-zA-Z]/g, '_')}_visits`,
                  name: provider.split(' ').slice(-1)[0],
                  color: trendLineColors[index % trendLineColors.length],
                }))}
                height={300}
              />
            </CardContent>
          </Card>

          {/* Duration Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Average Duration Over Time</CardTitle>
              <CardDescription>
                {filters.timePeriod === 'monthly' ? 'Monthly' : 'Weekly'} average visit duration by provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={trendData}
                lines={selectedProviders.map((provider, index) => ({
                  key: `${provider.replace(/[^a-zA-Z]/g, '_')}_duration`,
                  name: provider.split(' ').slice(-1)[0],
                  color: trendLineColors[index % trendLineColors.length],
                }))}
                height={280}
                formatY={(v) => `${v.toFixed(1)} min`}
              />
            </CardContent>
          </Card>

          {/* Provider Table */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Summary</CardTitle>
              <CardDescription>Detailed metrics for all providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Provider</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-medium">Total Visits</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-medium">Avg Visits/Wk</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-medium">% Over 20</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-medium">Avg Duration</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-medium">Total Hours</th>
                      <th className="text-right py-3 px-4 text-slate-300 font-medium">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerAggregates.map((provider) => (
                      <tr key={provider.provider} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-slate-100 font-medium">{provider.provider}</td>
                        <td className="py-3 px-4 text-slate-300 text-right">{provider.total_visits}</td>
                        <td className="py-3 px-4 text-slate-300 text-right">{provider.avg_visits_total.toFixed(1)}</td>
                        <td className="py-3 px-4 text-slate-300 text-right">{provider.avg_pct_over_20.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-slate-300 text-right">{provider.avg_duration_min.toFixed(1)} min</td>
                        <td className="py-3 px-4 text-slate-300 text-right">{provider.total_hours.toFixed(1)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`
                            px-2 py-1 rounded text-sm font-medium
                            ${provider.avg_utilization >= 1 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : provider.avg_utilization >= 0.7 
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }
                          `}>
                            {provider.avg_utilization.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

