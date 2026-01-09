import { WeeklyProviderMetric, ParseResult } from './types';

/**
 * Generate demo data for development and testing
 */
export function generateDemoData(): ParseResult {
  const providers = [
    'Dr. Sarah Chen',
    'Dr. Michael Brooks',
    'Dr. Emily Rodriguez',
    'Dr. James Wilson',
    'Dr. Amanda Foster',
    'Dr. Robert Kim',
    'Dr. Lisa Martinez',
    'Dr. David Thompson',
  ];

  const metrics: WeeklyProviderMetric[] = [];
  
  // Generate 12 weeks of data
  const startDate = new Date('2025-10-06'); // Start from a Monday
  
  for (let weekOffset = 0; weekOffset < 12; weekOffset++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    for (const provider of providers) {
      // Base values with some provider-specific variation
      const providerIndex = providers.indexOf(provider);
      const baseVisits = 25 + providerIndex * 3;
      const baseHours = 30 + providerIndex * 2;
      const basePctOver20 = 15 + providerIndex * 2;
      const baseDuration = 18 + providerIndex;

      // Add weekly variation and trend
      const trend = weekOffset * 0.5; // Slight upward trend
      const weeklyVariation = Math.sin(weekOffset * 0.5) * 3;
      const randomNoise = () => (Math.random() - 0.5) * 4;

      const visits_total = Math.max(5, Math.round(baseVisits + trend + weeklyVariation + randomNoise()));
      const pct_over_20 = Math.max(5, Math.min(60, basePctOver20 + randomNoise() * 2));
      const visits_over_20 = Math.round(visits_total * (pct_over_20 / 100));
      const avg_duration = Math.max(10, baseDuration + randomNoise());
      const hours_total = Math.max(10, baseHours + randomNoise() * 2);

      // Doxy Over 20 metrics
      metrics.push({
        week_start: weekStartStr,
        provider,
        source: 'doxy_over_20',
        visits_total,
        visits_over_20,
        pct_over_20: Math.round(pct_over_20 * 100) / 100,
        avg_duration_min: Math.round(avg_duration * 100) / 100,
      });

      // Gusto Hours metrics
      metrics.push({
        week_start: weekStartStr,
        provider,
        source: 'gusto_hours',
        hours_total: Math.round(hours_total * 100) / 100,
      });

      // Doxy Visits metrics (can have slightly different numbers due to source)
      metrics.push({
        week_start: weekStartStr,
        provider,
        source: 'doxy_visits',
        visits_total: Math.max(5, visits_total + Math.round(randomNoise() * 0.5)),
      });
    }
  }

  // Add some outliers for interesting insights
  const outlierWeek = '2025-12-08';
  const outlierProvider = 'Dr. Sarah Chen';
  
  // Find and modify the outlier entry
  const outlierEntry = metrics.find(
    m => m.week_start === outlierWeek && m.provider === outlierProvider && m.source === 'doxy_over_20'
  );
  if (outlierEntry) {
    outlierEntry.visits_total = 65; // Unusually high
    outlierEntry.visits_over_20 = 40;
    outlierEntry.pct_over_20 = 61.54;
  }

  return {
    metrics,
    sheets: [
      {
        sheetName: 'Doxy - Over 20 minutes',
        metrics: metrics.filter(m => m.source === 'doxy_over_20'),
        warnings: [],
      },
      {
        sheetName: 'Gusto Hours ',
        metrics: metrics.filter(m => m.source === 'gusto_hours'),
        warnings: [],
      },
      {
        sheetName: 'Doxy Visits',
        metrics: metrics.filter(m => m.source === 'doxy_visits'),
        warnings: [],
      },
    ],
    warnings: [],
    metadata: {
      filename: 'demo-data.xlsx',
      parsedAt: new Date().toISOString(),
      sheetCount: 3,
      recordCount: metrics.length,
    },
  };
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const value = row[h];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return String(value);
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  const csv = exportToCSV(data, filename);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

