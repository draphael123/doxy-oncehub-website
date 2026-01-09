// ============================================================================
// Core Data Models
// ============================================================================

/**
 * Normalized weekly provider metrics - the canonical data format
 * All sheet parsers normalize to this structure
 */
export interface WeeklyProviderMetric {
  week_start: string; // ISO date string (YYYY-MM-DD)
  provider: string;
  source: 'doxy_over_20' | 'gusto_hours' | 'doxy_visits' | 'oncehub_visits' | 'oncehub_program';
  
  // Doxy Over 20 Minutes fields
  visits_total?: number;
  visits_over_20?: number;
  pct_over_20?: number;
  avg_duration_min?: number;
  
  // Gusto Hours fields
  hours_total?: number;
  
  // Oncehub Program Grouped fields
  program?: string;
  visit_group?: string;
  program_visits?: number;
}

/**
 * Aggregated metrics for a single week across all providers
 */
export interface WeeklyAggregate {
  week_start: string;
  visits_total: number;
  visits_over_20: number;
  pct_over_20: number;
  avg_duration_min: number;
  hours_total: number;
  utilization: number; // visits_total / hours_total
  provider_count: number;
}

/**
 * Provider-level aggregated metrics
 */
export interface ProviderAggregate {
  provider: string;
  weeks: WeeklyProviderMetric[];
  avg_visits_total: number;
  avg_pct_over_20: number;
  avg_duration_min: number;
  avg_hours_total: number;
  avg_utilization: number;
  total_visits: number;
  total_hours: number;
}

// ============================================================================
// Parser Types
// ============================================================================

export type SheetName = 'Doxy - Over 20 minutes' | 'Gusto Hours ' | 'Doxy Visits';

export interface ParsedSheet {
  sheetName: string;
  metrics: WeeklyProviderMetric[];
  warnings: ParserWarning[];
}

export interface ParserWarning {
  sheetName: string;
  type: 'missing_column' | 'unparsed_block' | 'week_parse_failure' | 'data_validation' | 'unknown_format';
  message: string;
  row?: number;
  column?: string;
  weekBlock?: string;
}

export interface ParseResult {
  metrics: WeeklyProviderMetric[];
  sheets: ParsedSheet[];
  warnings: ParserWarning[];
  metadata: {
    filename: string;
    parsedAt: string;
    sheetCount: number;
    recordCount: number;
  };
}

// ============================================================================
// Insight Types
// ============================================================================

export type InsightType = 'wow_change' | 'outlier' | 'trend' | 'milestone';
export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface Insight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  metric: string;
  provider?: string;
  week_start?: string;
  value: number;
  change?: number;
  changePercent?: number;
  zScore?: number;
}

export interface WoWDelta {
  week_start: string;
  provider: string;
  metric: string;
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number;
}

export interface RollingAverage {
  week_start: string;
  provider?: string;
  metric: string;
  value: number;
  rollingAvg4Week: number;
  deviation: number;
}

// ============================================================================
// UI State Types
// ============================================================================

export type TimePeriod = 'weekly' | 'monthly';

export type DataSource = 'doxy_over_20' | 'gusto_hours' | 'doxy_visits' | 'oncehub_visits' | 'oncehub_program';

export interface FilterState {
  providers: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  sources: DataSource[];
  timePeriod: TimePeriod;
}

export interface ChartDataPoint {
  week_start: string;
  [key: string]: string | number | undefined;
}

export interface KPITile {
  label: string;
  value: number | string;
  change?: number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'percent' | 'decimal' | 'duration';
}

// ============================================================================
// API Types
// ============================================================================

export interface UploadResponse {
  success: boolean;
  data?: ParseResult;
  error?: string;
}

export interface ExportRequest {
  type: 'normalized' | 'chart';
  data: WeeklyProviderMetric[] | ChartDataPoint[];
  filename?: string;
}

