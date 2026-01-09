import * as XLSX from 'xlsx';
import { WeeklyProviderMetric } from '../types';
import { BaseSheetParser } from './base-parser';

/**
 * Parser for "Oncehub Report - Number of Visi" sheet
 * 
 * Actual format from file:
 * Row 0: ["Week of 12/6", empty, empty, empty, "Week of 11/30", ...]
 * Row 1: ["Provider Name", "Number of Visits", empty, "Provider Name", "Number of Visits", ...]
 * Row 2+: [provider_name, count, empty, provider_name, count, ...]
 */
export class OncehubVisitsParser extends BaseSheetParser {
  constructor() {
    super('Oncehub Report - Number of Visi');
  }

  parse(worksheet: XLSX.WorkSheet): WeeklyProviderMetric[] {
    this.resetWarnings();
    const metrics: WeeklyProviderMetric[] = [];
    const data = this.sheetToArray(worksheet);

    if (data.length < 3) {
      this.addWarning('unknown_format', 'Sheet has insufficient data rows');
      return metrics;
    }

    // Find week blocks by scanning the header row (row 0)
    const headerRow = data[0];
    const weekBlocks = this.findWeekBlocks(headerRow);

    if (weekBlocks.length === 0) {
      this.addWarning('week_parse_failure', 'No valid week blocks found in header row');
      return metrics;
    }

    // Process each data row (skip header rows 0 and 1)
    for (let rowIdx = 2; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx];
      
      for (const block of weekBlocks) {
        const providerName = this.cleanProviderName(row[block.startCol]);
        
        if (!this.isProviderRow(providerName)) {
          continue;
        }

        const visits = this.parseNumber(row[block.startCol + 1]);

        if (visits === undefined) {
          continue;
        }

        metrics.push({
          week_start: block.weekStart,
          provider: providerName,
          source: 'oncehub_visits',
          visits_total: Math.round(visits),
        });
      }
    }

    if (metrics.length === 0) {
      this.addWarning('data_validation', 'No valid metrics extracted from sheet');
    }

    return metrics;
  }

  /**
   * Find week blocks by scanning for week headers
   */
  private findWeekBlocks(headerRow: (string | number | undefined)[]): WeekBlock[] {
    const blocks: WeekBlock[] = [];

    for (let col = 0; col < headerRow.length; col++) {
      const weekStart = this.parseWeekHeader(headerRow[col]);
      
      if (weekStart) {
        blocks.push({
          startCol: col,
          weekStart,
        });
      }
    }

    return blocks;
  }
}

interface WeekBlock {
  startCol: number;
  weekStart: string;
}

