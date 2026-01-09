import * as XLSX from 'xlsx';
import { ParseResult, ParsedSheet, ParserWarning, WeeklyProviderMetric } from '../types';
import { DoxyOver20Parser } from './doxy-over-20-parser';
import { GustoHoursParser } from './gusto-hours-parser';
import { DoxyVisitsParser } from './doxy-visits-parser';
import { BaseSheetParser } from './base-parser';

/**
 * Parser registry - add new parsers here
 */
const PARSER_REGISTRY: Record<string, () => BaseSheetParser> = {
  'Doxy - Over 20 minutes': () => new DoxyOver20Parser(),
  'Gusto Hours ': () => new GustoHoursParser(),
  'Doxy Visits': () => new DoxyVisitsParser(),
};

/**
 * Normalize sheet name for matching (handles minor variations)
 */
function normalizeSheetName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Find the appropriate parser for a sheet name
 */
function findParser(sheetName: string): BaseSheetParser | null {
  // Exact match first
  if (PARSER_REGISTRY[sheetName]) {
    return PARSER_REGISTRY[sheetName]();
  }

  // Try normalized matching
  const normalizedInput = normalizeSheetName(sheetName);
  for (const [registeredName, parserFactory] of Object.entries(PARSER_REGISTRY)) {
    if (normalizeSheetName(registeredName) === normalizedInput) {
      return parserFactory();
    }
  }

  // Partial matching for common variations
  if (normalizedInput.includes('over 20') || normalizedInput.includes('over20')) {
    return new DoxyOver20Parser();
  }
  if (normalizedInput.includes('gusto') && normalizedInput.includes('hour')) {
    return new GustoHoursParser();
  }
  if (normalizedInput.includes('doxy') && normalizedInput.includes('visit')) {
    return new DoxyVisitsParser();
  }

  return null;
}

/**
 * Main parsing function - parses an entire workbook
 */
export function parseWorkbook(buffer: ArrayBuffer, filename: string): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  const allMetrics: WeeklyProviderMetric[] = [];
  const parsedSheets: ParsedSheet[] = [];
  const allWarnings: ParserWarning[] = [];

  for (const sheetName of workbook.SheetNames) {
    const parser = findParser(sheetName);
    
    if (!parser) {
      // Sheet not supported - skip silently for now
      continue;
    }

    const worksheet = workbook.Sheets[sheetName];
    const metrics = parser.parse(worksheet);
    const warnings = parser.getWarnings();

    parsedSheets.push({
      sheetName,
      metrics,
      warnings,
    });

    allMetrics.push(...metrics);
    allWarnings.push(...warnings);
  }

  return {
    metrics: allMetrics,
    sheets: parsedSheets,
    warnings: allWarnings,
    metadata: {
      filename,
      parsedAt: new Date().toISOString(),
      sheetCount: parsedSheets.length,
      recordCount: allMetrics.length,
    },
  };
}

/**
 * Get list of supported sheet names
 */
export function getSupportedSheets(): string[] {
  return Object.keys(PARSER_REGISTRY);
}

/**
 * Merge metrics from multiple sources for the same provider/week
 */
export function mergeMetrics(metrics: WeeklyProviderMetric[]): WeeklyProviderMetric[] {
  const merged = new Map<string, WeeklyProviderMetric>();

  for (const metric of metrics) {
    const key = `${metric.week_start}|${metric.provider}`;
    const existing = merged.get(key);

    if (existing) {
      // Merge fields, preferring non-undefined values
      merged.set(key, {
        ...existing,
        visits_total: metric.visits_total ?? existing.visits_total,
        visits_over_20: metric.visits_over_20 ?? existing.visits_over_20,
        pct_over_20: metric.pct_over_20 ?? existing.pct_over_20,
        avg_duration_min: metric.avg_duration_min ?? existing.avg_duration_min,
        hours_total: metric.hours_total ?? existing.hours_total,
        // Keep source as the most detailed one
        source: metric.source === 'doxy_over_20' ? metric.source : existing.source,
      });
    } else {
      merged.set(key, { ...metric });
    }
  }

  return Array.from(merged.values());
}

export { DoxyOver20Parser, GustoHoursParser, DoxyVisitsParser, BaseSheetParser };

