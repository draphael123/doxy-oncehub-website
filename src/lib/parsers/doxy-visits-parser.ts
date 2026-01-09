import * as XLSX from 'xlsx';
import { WeeklyProviderMetric } from '../types';
import { BaseSheetParser } from './base-parser';

/**
 * Parser for "Doxy Visits" sheet
 * 
 * Actual format from file:
 * Row 0: ["Provider", "11/30-12/6", "Provider", "12/6-12/13", empty, "Provider", 46004 (Excel date), ...]
 * Row 1+: [provider_name, count, provider_name, count, empty, provider_name, count, ...]
 * 
 * The structure alternates: Provider column, Count column, [optional empty], repeat
 * Week headers are in row 0 in the "count" column position
 */
export class DoxyVisitsParser extends BaseSheetParser {
  constructor() {
    super('Doxy Visits');
  }

  parse(worksheet: XLSX.WorkSheet): WeeklyProviderMetric[] {
    this.resetWarnings();
    const metrics: WeeklyProviderMetric[] = [];
    const data = this.sheetToArray(worksheet);

    if (data.length < 2) {
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

    // Process each data row (start from row 1)
    for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx];
      
      for (const block of weekBlocks) {
        const providerName = this.cleanProviderName(row[block.providerCol]);
        
        if (!this.isProviderRow(providerName)) {
          continue;
        }

        const visits = this.parseNumber(row[block.countCol]);

        if (visits === undefined) {
          continue;
        }

        metrics.push({
          week_start: block.weekStart,
          provider: providerName,
          source: 'doxy_visits',
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
   * Find week blocks - week headers appear in row 0 at the count column position
   * Structure: Provider | Count | Provider | Count | ...
   * Row 0:    "Provider" | date  | "Provider" | date  | ...
   */
  private findWeekBlocks(headerRow: (string | number | undefined)[]): WeekBlock[] {
    const blocks: WeekBlock[] = [];

    for (let col = 0; col < headerRow.length; col++) {
      const cell = headerRow[col];
      
      // Check if this is a week header (date format)
      const weekStart = this.parseWeekHeader(cell);
      
      if (weekStart) {
        // The count is at this column, provider is at col-1
        blocks.push({
          providerCol: col - 1,
          countCol: col,
          weekStart,
        });
      }
    }

    // Handle case where week headers are at positions like 1, 3, 5... 
    // (alternating with "Provider" labels)
    if (blocks.length === 0) {
      // Try alternative detection: look for "Provider" labels and assume next col is count
      for (let col = 0; col < headerRow.length; col++) {
        const cell = headerRow[col];
        if (String(cell).toLowerCase() === 'provider' && col + 1 < headerRow.length) {
          const nextCell = headerRow[col + 1];
          const weekStart = this.parseWeekHeader(nextCell);
          if (weekStart) {
            blocks.push({
              providerCol: col,
              countCol: col + 1,
              weekStart,
            });
          }
        }
      }
    }

    return blocks;
  }
}

interface WeekBlock {
  providerCol: number;
  countCol: number;
  weekStart: string;
}
