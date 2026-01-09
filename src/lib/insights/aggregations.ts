import { WeeklyProviderMetric, WeeklyAggregate, ProviderAggregate } from '../types';

/**
 * Aggregate metrics by week across all providers
 */
export function aggregateByWeek(metrics: WeeklyProviderMetric[]): WeeklyAggregate[] {
  const byWeek = new Map<string, WeeklyProviderMetric[]>();

  // Group by week
  for (const metric of metrics) {
    const existing = byWeek.get(metric.week_start) || [];
    existing.push(metric);
    byWeek.set(metric.week_start, existing);
  }

  // Aggregate each week
  const aggregates: WeeklyAggregate[] = [];
  
  for (const [week_start, weekMetrics] of byWeek) {
    const aggregate = computeWeeklyAggregate(week_start, weekMetrics);
    aggregates.push(aggregate);
  }

  // Sort by week
  return aggregates.sort((a, b) => a.week_start.localeCompare(b.week_start));
}

/**
 * Compute aggregate for a single week
 */
function computeWeeklyAggregate(
  week_start: string,
  metrics: WeeklyProviderMetric[]
): WeeklyAggregate {
  let visits_total = 0;
  let visits_over_20 = 0;
  let pct_over_20_sum = 0;
  let pct_over_20_count = 0;
  let avg_duration_sum = 0;
  let avg_duration_count = 0;
  let hours_total = 0;
  const providers = new Set<string>();

  for (const m of metrics) {
    providers.add(m.provider);
    
    if (m.visits_total !== undefined) {
      visits_total += m.visits_total;
    }
    if (m.visits_over_20 !== undefined) {
      visits_over_20 += m.visits_over_20;
    }
    if (m.pct_over_20 !== undefined) {
      pct_over_20_sum += m.pct_over_20;
      pct_over_20_count++;
    }
    if (m.avg_duration_min !== undefined) {
      avg_duration_sum += m.avg_duration_min;
      avg_duration_count++;
    }
    if (m.hours_total !== undefined) {
      hours_total += m.hours_total;
    }
  }

  const utilization = hours_total > 0 ? visits_total / hours_total : 0;

  return {
    week_start,
    visits_total,
    visits_over_20,
    pct_over_20: pct_over_20_count > 0 ? pct_over_20_sum / pct_over_20_count : 0,
    avg_duration_min: avg_duration_count > 0 ? avg_duration_sum / avg_duration_count : 0,
    hours_total,
    utilization: Math.round(utilization * 100) / 100,
    provider_count: providers.size,
  };
}

/**
 * Aggregate metrics by provider
 */
export function aggregateByProvider(metrics: WeeklyProviderMetric[]): ProviderAggregate[] {
  const byProvider = new Map<string, WeeklyProviderMetric[]>();

  // Group by provider
  for (const metric of metrics) {
    const existing = byProvider.get(metric.provider) || [];
    existing.push(metric);
    byProvider.set(metric.provider, existing);
  }

  // Aggregate each provider
  const aggregates: ProviderAggregate[] = [];
  
  for (const [provider, providerMetrics] of byProvider) {
    const aggregate = computeProviderAggregate(provider, providerMetrics);
    aggregates.push(aggregate);
  }

  // Sort by provider name
  return aggregates.sort((a, b) => a.provider.localeCompare(b.provider));
}

/**
 * Compute aggregate for a single provider
 */
function computeProviderAggregate(
  provider: string,
  metrics: WeeklyProviderMetric[]
): ProviderAggregate {
  let visits_total = 0;
  let visits_total_count = 0;
  let pct_over_20_sum = 0;
  let pct_over_20_count = 0;
  let avg_duration_sum = 0;
  let avg_duration_count = 0;
  let hours_total = 0;
  let hours_count = 0;

  for (const m of metrics) {
    if (m.visits_total !== undefined) {
      visits_total += m.visits_total;
      visits_total_count++;
    }
    if (m.pct_over_20 !== undefined) {
      pct_over_20_sum += m.pct_over_20;
      pct_over_20_count++;
    }
    if (m.avg_duration_min !== undefined) {
      avg_duration_sum += m.avg_duration_min;
      avg_duration_count++;
    }
    if (m.hours_total !== undefined) {
      hours_total += m.hours_total;
      hours_count++;
    }
  }

  const avg_visits = visits_total_count > 0 ? visits_total / visits_total_count : 0;
  const avg_hours = hours_count > 0 ? hours_total / hours_count : 0;
  const avg_utilization = avg_hours > 0 ? avg_visits / avg_hours : 0;

  return {
    provider,
    weeks: metrics.sort((a, b) => a.week_start.localeCompare(b.week_start)),
    avg_visits_total: Math.round(avg_visits * 100) / 100,
    avg_pct_over_20: pct_over_20_count > 0 ? Math.round((pct_over_20_sum / pct_over_20_count) * 100) / 100 : 0,
    avg_duration_min: avg_duration_count > 0 ? Math.round((avg_duration_sum / avg_duration_count) * 100) / 100 : 0,
    avg_hours_total: Math.round(avg_hours * 100) / 100,
    avg_utilization: Math.round(avg_utilization * 100) / 100,
    total_visits: visits_total,
    total_hours: Math.round(hours_total * 100) / 100,
  };
}

/**
 * Get unique providers from metrics
 */
export function getUniqueProviders(metrics: WeeklyProviderMetric[]): string[] {
  const providers = new Set<string>();
  for (const m of metrics) {
    providers.add(m.provider);
  }
  return Array.from(providers).sort();
}

/**
 * Get unique weeks from metrics
 */
export function getUniqueWeeks(metrics: WeeklyProviderMetric[]): string[] {
  const weeks = new Set<string>();
  for (const m of metrics) {
    weeks.add(m.week_start);
  }
  return Array.from(weeks).sort();
}

/**
 * Filter metrics by criteria
 */
export function filterMetrics(
  metrics: WeeklyProviderMetric[],
  filters: {
    providers?: string[];
    startDate?: string;
    endDate?: string;
    sources?: string[];
  }
): WeeklyProviderMetric[] {
  return metrics.filter((m) => {
    if (filters.providers && filters.providers.length > 0) {
      if (!filters.providers.includes(m.provider)) return false;
    }
    if (filters.startDate && m.week_start < filters.startDate) return false;
    if (filters.endDate && m.week_start > filters.endDate) return false;
    if (filters.sources && filters.sources.length > 0) {
      if (!filters.sources.includes(m.source)) return false;
    }
    return true;
  });
}

