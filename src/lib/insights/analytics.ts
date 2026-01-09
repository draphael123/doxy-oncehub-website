import { WeeklyProviderMetric, WeeklyAggregate, WoWDelta, RollingAverage, Insight } from '../types';
import { aggregateByWeek } from './aggregations';

/**
 * Calculate Week-over-Week deltas for a metric
 */
export function calculateWoWDeltas(
  metrics: WeeklyProviderMetric[],
  metricKey: keyof WeeklyProviderMetric
): WoWDelta[] {
  const deltas: WoWDelta[] = [];
  
  // Group by provider
  const byProvider = new Map<string, WeeklyProviderMetric[]>();
  for (const m of metrics) {
    const existing = byProvider.get(m.provider) || [];
    existing.push(m);
    byProvider.set(m.provider, existing);
  }

  for (const [provider, providerMetrics] of byProvider) {
    // Sort by week
    const sorted = [...providerMetrics].sort((a, b) => 
      a.week_start.localeCompare(b.week_start)
    );

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i][metricKey] as number | undefined;
      const previous = sorted[i - 1][metricKey] as number | undefined;

      if (current !== undefined && previous !== undefined && previous !== 0) {
        const delta = current - previous;
        const deltaPercent = (delta / previous) * 100;

        deltas.push({
          week_start: sorted[i].week_start,
          provider,
          metric: metricKey as string,
          current,
          previous,
          delta,
          deltaPercent: Math.round(deltaPercent * 100) / 100,
        });
      }
    }
  }

  return deltas;
}

/**
 * Calculate rolling 4-week average
 */
export function calculateRollingAverage(
  metrics: WeeklyProviderMetric[],
  metricKey: keyof WeeklyProviderMetric,
  windowSize: number = 4
): RollingAverage[] {
  const results: RollingAverage[] = [];
  
  // Group by provider
  const byProvider = new Map<string, WeeklyProviderMetric[]>();
  for (const m of metrics) {
    const existing = byProvider.get(m.provider) || [];
    existing.push(m);
    byProvider.set(m.provider, existing);
  }

  for (const [provider, providerMetrics] of byProvider) {
    const sorted = [...providerMetrics].sort((a, b) => 
      a.week_start.localeCompare(b.week_start)
    );

    for (let i = 0; i < sorted.length; i++) {
      const currentValue = sorted[i][metricKey] as number | undefined;
      if (currentValue === undefined) continue;

      // Calculate rolling average
      const windowStart = Math.max(0, i - windowSize + 1);
      const window = sorted.slice(windowStart, i + 1);
      const values = window
        .map(m => m[metricKey] as number | undefined)
        .filter((v): v is number => v !== undefined);

      if (values.length > 0) {
        const rollingAvg = values.reduce((a, b) => a + b, 0) / values.length;
        const deviation = currentValue - rollingAvg;

        results.push({
          week_start: sorted[i].week_start,
          provider,
          metric: metricKey as string,
          value: currentValue,
          rollingAvg4Week: Math.round(rollingAvg * 100) / 100,
          deviation: Math.round(deviation * 100) / 100,
        });
      }
    }
  }

  return results;
}

/**
 * Calculate z-score for outlier detection
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate Median Absolute Deviation (MAD) - more robust than std dev
 */
export function calculateMAD(values: number[]): { median: number; mad: number } {
  if (values.length === 0) return { median: 0, mad: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  const absoluteDeviations = values.map(v => Math.abs(v - median));
  const sortedDeviations = absoluteDeviations.sort((a, b) => a - b);
  const mad = sortedDeviations[Math.floor(sortedDeviations.length / 2)];

  return { median, mad };
}

/**
 * Calculate modified z-score using MAD (more robust)
 */
export function calculateModifiedZScore(value: number, median: number, mad: number): number {
  if (mad === 0) return 0;
  return 0.6745 * (value - median) / mad;
}

/**
 * Detect outliers in metrics using modified z-score
 */
export function detectOutliers(
  metrics: WeeklyProviderMetric[],
  metricKey: keyof WeeklyProviderMetric,
  threshold: number = 3.0
): { metric: WeeklyProviderMetric; zScore: number }[] {
  const values = metrics
    .map(m => ({ metric: m, value: m[metricKey] as number | undefined }))
    .filter((item): item is { metric: WeeklyProviderMetric; value: number } => 
      item.value !== undefined
    );

  if (values.length < 3) return [];

  const { median, mad } = calculateMAD(values.map(v => v.value));
  
  const outliers: { metric: WeeklyProviderMetric; zScore: number }[] = [];
  
  for (const { metric, value } of values) {
    const zScore = calculateModifiedZScore(value, median, mad);
    if (Math.abs(zScore) >= threshold) {
      outliers.push({ metric, zScore: Math.round(zScore * 100) / 100 });
    }
  }

  return outliers.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

/**
 * Generate insights from metrics data
 */
export function generateInsights(metrics: WeeklyProviderMetric[]): Insight[] {
  const insights: Insight[] = [];
  let insightId = 0;

  // Get weekly aggregates for trend analysis
  const weeklyAggregates = aggregateByWeek(metrics);
  
  if (weeklyAggregates.length < 2) {
    return insights;
  }

  const latestWeek = weeklyAggregates[weeklyAggregates.length - 1];
  const previousWeek = weeklyAggregates[weeklyAggregates.length - 2];

  // Top WoW changes in visits
  const visitsDelta = latestWeek.visits_total - previousWeek.visits_total;
  const visitsChangePercent = previousWeek.visits_total > 0 
    ? (visitsDelta / previousWeek.visits_total) * 100 
    : 0;

  if (Math.abs(visitsChangePercent) >= 10) {
    insights.push({
      id: `insight-${++insightId}`,
      type: 'wow_change',
      severity: Math.abs(visitsChangePercent) >= 25 ? 'warning' : 'info',
      title: visitsDelta > 0 ? 'Visits Increased' : 'Visits Decreased',
      description: `Total visits ${visitsDelta > 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(visitsChangePercent))}% compared to last week`,
      metric: 'visits_total',
      week_start: latestWeek.week_start,
      value: latestWeek.visits_total,
      change: visitsDelta,
      changePercent: Math.round(visitsChangePercent * 100) / 100,
    });
  }

  // Duration change insight
  const durationDelta = latestWeek.avg_duration_min - previousWeek.avg_duration_min;
  const durationChangePercent = previousWeek.avg_duration_min > 0
    ? (durationDelta / previousWeek.avg_duration_min) * 100
    : 0;

  if (Math.abs(durationChangePercent) >= 10) {
    insights.push({
      id: `insight-${++insightId}`,
      type: 'wow_change',
      severity: Math.abs(durationChangePercent) >= 20 ? 'warning' : 'info',
      title: durationDelta > 0 ? 'Duration Increased' : 'Duration Decreased',
      description: `Average visit duration ${durationDelta > 0 ? 'increased' : 'decreased'} by ${Math.abs(Math.round(durationChangePercent))}%`,
      metric: 'avg_duration_min',
      week_start: latestWeek.week_start,
      value: Math.round(latestWeek.avg_duration_min * 100) / 100,
      change: Math.round(durationDelta * 100) / 100,
      changePercent: Math.round(durationChangePercent * 100) / 100,
    });
  }

  // Utilization insight
  const utilizationDelta = latestWeek.utilization - previousWeek.utilization;
  if (Math.abs(utilizationDelta) >= 0.5) {
    insights.push({
      id: `insight-${++insightId}`,
      type: 'wow_change',
      severity: Math.abs(utilizationDelta) >= 1 ? 'warning' : 'info',
      title: utilizationDelta > 0 ? 'Utilization Up' : 'Utilization Down',
      description: `Provider utilization (visits/hour) ${utilizationDelta > 0 ? 'improved' : 'declined'} from ${previousWeek.utilization.toFixed(2)} to ${latestWeek.utilization.toFixed(2)}`,
      metric: 'utilization',
      week_start: latestWeek.week_start,
      value: latestWeek.utilization,
      change: Math.round(utilizationDelta * 100) / 100,
    });
  }

  // Detect provider-level outliers
  const visitOutliers = detectOutliers(metrics.filter(m => m.week_start === latestWeek.week_start), 'visits_total', 2.5);
  for (const outlier of visitOutliers.slice(0, 3)) {
    insights.push({
      id: `insight-${++insightId}`,
      type: 'outlier',
      severity: Math.abs(outlier.zScore) >= 3.5 ? 'critical' : 'warning',
      title: outlier.zScore > 0 ? 'High Visit Count' : 'Low Visit Count',
      description: `${outlier.metric.provider} has ${outlier.zScore > 0 ? 'unusually high' : 'unusually low'} visits (${outlier.metric.visits_total}) this week`,
      metric: 'visits_total',
      provider: outlier.metric.provider,
      week_start: outlier.metric.week_start,
      value: outlier.metric.visits_total || 0,
      zScore: outlier.zScore,
    });
  }

  const durationOutliers = detectOutliers(metrics.filter(m => m.week_start === latestWeek.week_start), 'avg_duration_min', 2.5);
  for (const outlier of durationOutliers.slice(0, 2)) {
    insights.push({
      id: `insight-${++insightId}`,
      type: 'outlier',
      severity: Math.abs(outlier.zScore) >= 3.5 ? 'critical' : 'warning',
      title: outlier.zScore > 0 ? 'Long Avg Duration' : 'Short Avg Duration',
      description: `${outlier.metric.provider} has ${outlier.zScore > 0 ? 'unusually long' : 'unusually short'} average duration (${outlier.metric.avg_duration_min?.toFixed(1)} min)`,
      metric: 'avg_duration_min',
      provider: outlier.metric.provider,
      week_start: outlier.metric.week_start,
      value: outlier.metric.avg_duration_min || 0,
      zScore: outlier.zScore,
    });
  }

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Calculate KPI values for the latest period
 */
export function calculateKPIs(metrics: WeeklyProviderMetric[]): {
  totalVisits: number;
  avgPctOver20: number;
  avgDuration: number;
  totalHours: number;
  avgUtilization: number;
  providerCount: number;
  weekCount: number;
  wow: {
    visits: number;
    pctOver20: number;
    duration: number;
    hours: number;
    utilization: number;
  };
} {
  const weeklyAggregates = aggregateByWeek(metrics);
  
  if (weeklyAggregates.length === 0) {
    return {
      totalVisits: 0,
      avgPctOver20: 0,
      avgDuration: 0,
      totalHours: 0,
      avgUtilization: 0,
      providerCount: 0,
      weekCount: 0,
      wow: { visits: 0, pctOver20: 0, duration: 0, hours: 0, utilization: 0 },
    };
  }

  const latest = weeklyAggregates[weeklyAggregates.length - 1];
  const previous = weeklyAggregates.length > 1 
    ? weeklyAggregates[weeklyAggregates.length - 2] 
    : latest;

  const calcChange = (curr: number, prev: number) => 
    prev !== 0 ? ((curr - prev) / prev) * 100 : 0;

  return {
    totalVisits: latest.visits_total,
    avgPctOver20: Math.round(latest.pct_over_20 * 100) / 100,
    avgDuration: Math.round(latest.avg_duration_min * 100) / 100,
    totalHours: Math.round(latest.hours_total * 100) / 100,
    avgUtilization: Math.round(latest.utilization * 100) / 100,
    providerCount: latest.provider_count,
    weekCount: weeklyAggregates.length,
    wow: {
      visits: Math.round(calcChange(latest.visits_total, previous.visits_total) * 100) / 100,
      pctOver20: Math.round(calcChange(latest.pct_over_20, previous.pct_over_20) * 100) / 100,
      duration: Math.round(calcChange(latest.avg_duration_min, previous.avg_duration_min) * 100) / 100,
      hours: Math.round(calcChange(latest.hours_total, previous.hours_total) * 100) / 100,
      utilization: Math.round(calcChange(latest.utilization, previous.utilization) * 100) / 100,
    },
  };
}

