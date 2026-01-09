import * as XLSX from 'xlsx';
import { WeeklyProviderMetric } from '../types';
import { BaseSheetParser } from './base-parser';

/**
 * Parser for "Gusto Hours " sheet (note: sheet name has trailing space)
 * 
 * Actual format from file:
 * Row 0: ["12/14-12/20 ", empty, empty, "12/21-12/28 ", ...]
 * Row 1+: [provider_name, hours, empty, provider_name, hours, ...]
 * 
 * Each week block has 2-3 columns: provider, hours, (empty separator)
 * No sub-header row - data starts immediately at row 1
 */
export class GustoHoursParser extends BaseSheetParser {
  constructor() {
    super('Gusto Hours ');
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

    // Process each data row (start from row 1, no sub-header)
    for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx];
      
      // Check each week block
      for (const block of weekBlocks) {
        const providerName = this.cleanProviderName(row[block.startCol]);
        
        if (!this.isProviderRow(providerName)) {
          continue;
        }

        const hours = this.parseNumber(row[block.startCol + 1]);

        if (hours === undefined) {
          continue;
        }

        // Validate reasonable hours range (0-100 hours per week)
        if (hours < 0 || hours > 100) {
          this.addWarning(
            'data_validation',
            `Unusual hours value (${hours}) for ${providerName} in week ${block.weekStart}`,
            { weekBlock: block.weekStart }
          );
        }

        metrics.push({
          week_start: block.weekStart,
          provider: providerName,
          source: 'gusto_hours',
          hours_total: Math.round(hours * 100) / 100,
        });
      }
    }

    if (metrics.length === 0) {
      this.addWarning('data_validation', 'No valid metrics extracted from sheet');
    }

    return metrics;
  }

  /**
   * Find week blocks by scanning for week headers (date ranges)
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
