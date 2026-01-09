'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Activity, 
  Clock, 
  Users, 
  TrendingUp,
  Download,
  Sparkles,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPITile } from '@/components/kpi-tile';
import { InsightCard } from '@/components/insight-card';
import { FileUpload } from '@/components/file-upload';
import { TrendChart } from '@/components/charts/trend-chart';
import { useDataStore } from '@/lib/store';
import { aggregateByTimePeriod, calculateKPIs, generateInsights } from '@/lib/insights';
import { downloadCSV } from '@/lib/demo-data';
import { TimePeriodToggle } from '@/components/time-period-toggle';
import { ProgramBreakdown } from '@/components/program-breakdown';

function OverviewContent() {
  const searchParams = useSearchParams();
  const showUpload = searchParams.get('upload') === 'true';
  const { metrics, loadDemoData, loadDefaultFile, parseResult, filteredMetrics, filters, error, isLoading } = useDataStore();
  const [mounted, setMounted] = useState(false);
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-load default file on first mount
  useEffect(() => {
    if (mounted && !autoLoadAttempted && metrics.length === 0 && !showUpload) {
      setAutoLoadAttempted(true);
      loadDefaultFile();
    }
  }, [mounted, autoLoadAttempted, metrics.length, showUpload, loadDefaultFile]);

  // Calculate derived data based on time period
  const periodAggregates = useMemo(() => 
    aggregateByTimePeriod(filteredMetrics, filters.timePeriod), [filteredMetrics, filters.timePeriod]
  );

  const kpis = useMemo(() => 
    calculateKPIs(filteredMetrics), [filteredMetrics]
  );

  const insights = useMemo(() => 
    generateInsights(filteredMetrics), [filteredMetrics]
  );

  // Prepare chart data
  const chartData = useMemo(() => {
    return periodAggregates.map(w => ({
      week_start: w.week_start,
      visits_total: w.visits_total,
      pct_over_20: w.pct_over_20,
      avg_duration: w.avg_duration_min,
      hours_total: w.hours_total,
      utilization: w.utilization,
    }));
  }, [periodAggregates]);

  const handleExportNormalized = () => {
    downloadCSV(metrics as unknown as Record<string, unknown>[], 'normalized-metrics.csv');
  };

  const handleExportChart = () => {
    downloadCSV(chartData as unknown as Record<string, unknown>[], 'weekly-aggregates.csv');
  };

  if (!mounted) return null;

  // Loading state - auto-loading default file
  if (isLoading && metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
        <p className="text-slate-300 text-lg">Loading data...</p>
      </div>
    );
  }

  // Empty state - no data loaded (show upload if default file not found)
  if (metrics.length === 0 || showUpload) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-slate-100 mb-3">
            Healthcare Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Upload your Doxy and Gusto Excel workbook to visualize provider metrics, 
            detect trends, and surface actionable insights.
          </p>
        </div>

        <FileUpload />

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="text-center">
          <p className="text-slate-500 mb-4">Or try with sample data</p>
          <Button variant="secondary" onClick={loadDemoData}>
            <Sparkles className="w-4 h-4" />
            Load Demo Data
          </Button>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card hover>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-slate-100 font-semibold mb-2">Trend Analysis</h3>
              <p className="text-slate-400 text-sm">
                Track weekly metrics with interactive charts showing visits, duration, and utilization.
              </p>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-slate-100 font-semibold mb-2">Smart Insights</h3>
              <p className="text-slate-400 text-sm">
                Automatic detection of WoW changes, outliers, and trends using statistical analysis.
              </p>
            </CardContent>
          </Card>
          <Card hover>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-slate-100 font-semibold mb-2">Provider Drilldown</h3>
              <p className="text-slate-400 text-sm">
                Filter and compare individual provider performance with detailed breakdowns.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Overview Dashboard</h1>
          <p className="text-slate-400">
            {parseResult?.metadata.filename} • {kpis.weekCount} weeks • {kpis.providerCount} providers
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TimePeriodToggle />
          <Button variant="secondary" size="sm" onClick={handleExportChart}>
            <Download className="w-4 h-4" />
            Export Chart Data
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportNormalized}>
            <Download className="w-4 h-4" />
            Export All Data
          </Button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPITile
          label="Total Visits"
          value={kpis.totalVisits}
          change={kpis.wow.visits}
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
        />
        <KPITile
          label="% Over 20 Min"
          value={kpis.avgPctOver20}
          change={kpis.wow.pctOver20}
          format="percent"
          icon={<Clock className="w-5 h-5 text-amber-400" />}
        />
        <KPITile
          label="Avg Duration"
          value={kpis.avgDuration}
          change={kpis.wow.duration}
          format="duration"
          icon={<Clock className="w-5 h-5 text-blue-400" />}
        />
        <KPITile
          label="Total Hours"
          value={kpis.totalHours}
          change={kpis.wow.hours}
          format="decimal"
          icon={<Users className="w-5 h-5 text-purple-400" />}
        />
        <KPITile
          label="Utilization"
          value={kpis.avgUtilization}
          change={kpis.wow.utilization}
          format="ratio"
          icon={<TrendingUp className="w-5 h-5 text-teal-400" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visits & Duration Trends</CardTitle>
            <CardDescription>Weekly total visits and average duration</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={chartData}
              lines={[
                { key: 'visits_total', name: 'Total Visits', color: '#10b981' },
                { key: 'avg_duration', name: 'Avg Duration (min)', color: '#3b82f6' },
              ]}
              height={280}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hours & Utilization</CardTitle>
            <CardDescription>Total hours worked and visits per hour</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={chartData}
              lines={[
                { key: 'hours_total', name: 'Total Hours', color: '#8b5cf6' },
                { key: 'utilization', name: 'Visits/Hour', color: '#14b8a6' },
              ]}
              height={280}
              formatY={(v) => v.toFixed(1)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Percentage Over 20 Chart */}
      <Card>
        <CardHeader>
          <CardTitle>% Visits Over 20 Minutes</CardTitle>
          <CardDescription>Weekly percentage of visits exceeding 20 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart
            data={chartData}
            lines={[
              { key: 'pct_over_20', name: '% Over 20 Min', color: '#f59e0b' },
            ]}
            height={250}
            formatY={(v) => `${v.toFixed(1)}%`}
          />
        </CardContent>
      </Card>

      {/* Insights Section */}
      {insights.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Key Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 6).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Program Breakdown (from Oncehub data) */}
      <ProgramBreakdown />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OverviewContent />
    </Suspense>
  );
}
