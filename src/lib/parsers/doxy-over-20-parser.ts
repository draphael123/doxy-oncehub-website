import * as XLSX from 'xlsx';
import { WeeklyProviderMetric } from '../types';
import { BaseSheetParser } from './base-parser';

/**
 * Parser for "Doxy - Over 20 minutes" sheet
 * 
 * Actual format from file:
 * Row 0: [empty, empty, "WEEK OF 11/30", empty..., "Week of 12/6", ...]
 * Row 1: ["Provider", "Total Visits", "Visits over 20 minutes", empty..., "Provider", "Total Visits", ...]
 * Row 2+: [provider_name, total_visits, visits_over_20, empty..., provider_name, total_visits, ...]
 * 
 * Week blocks are laid out horizontally, each block has:
 * - Provider name
 * - Total Visits
 * - Visits over 20 minutes
 * (followed by empty columns, then next week block)
 */
export class DoxyOver20Parser extends BaseSheetParser {
  constructor() {
    super('Doxy - Over 20 minutes');
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
      
      // Check each week block
      for (const block of weekBlocks) {
        const providerName = this.cleanProviderName(row[block.startCol]);
        
        if (!this.isProviderRow(providerName)) {
          continue;
        }

        const totalVisits = this.parseNumber(row[block.startCol + 1]);
        const visitsOver20 = this.parseNumber(row[block.startCol + 2]);

        // At least some data should be present
        if (totalVisits === undefined && visitsOver20 === undefined) {
          continue;
        }

        // Calculate percentage
        let pctOver20: number | undefined;
        if (totalVisits !== undefined && visitsOver20 !== undefined && totalVisits > 0) {
          pctOver20 = Math.round((visitsOver20 / totalVisits) * 10000) / 100;
        }

        metrics.push({
          week_start: block.weekStart,
          provider: providerName,
          source: 'doxy_over_20',
          visits_total: totalVisits,
          visits_over_20: visitsOver20,
          pct_over_20: pctOver20,
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

    // Adjust startCol to point to the Provider column (usually 2 cols before week header or at the week header position)
    // Based on the actual data, the week header is above the data, and Provider column aligns with or before it
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      // The actual provider column is 2 positions before the week header based on the structure
      // Row 0: [empty, empty, "WEEK OF 11/30", ...]
      // Row 1: ["Provider", "Total Visits", "Visits over 20 minutes", ...]
      // So if week header is at col 2, provider is at col 0
      block.startCol = Math.max(0, block.startCol - 2);
    }

    return blocks;
  }
}

interface WeekBlock {
  startCol: number;
  weekStart: string;
}
