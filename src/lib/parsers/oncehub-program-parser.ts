import * as XLSX from 'xlsx';
import { WeeklyProviderMetric } from '../types';
import { BaseSheetParser } from './base-parser';

/**
 * Parser for "Oncehub - Program Grouped" sheet
 * 
 * Actual format from file:
 * Row 0: [empty, empty, "Week of 11/30", empty, empty, empty, empty, empty, "Week of 12/6", ...]
 * Row 1: ["Provider", "Program", "Visit Group", "Number of Visits", empty, empty, "Provider", "Program", ...]
 * Row 2+: [provider_name, program, visit_group, count, empty, empty, provider_name, program, ...]
 */
export class OncehubProgramParser extends BaseSheetParser {
  constructor() {
    super('Oncehub - Program Grouped');
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
        const providerName = this.cleanProviderName(row[block.providerCol]);
        
        if (!this.isProviderRow(providerName)) {
          continue;
        }

        const program = this.cleanProviderName(row[block.programCol]);
        const visitGroup = this.cleanProviderName(row[block.visitGroupCol]);
        const visits = this.parseNumber(row[block.visitsCol]);

        if (visits === undefined || !program) {
          continue;
        }

        metrics.push({
          week_start: block.weekStart,
          provider: providerName,
          source: 'oncehub_program',
          program,
          visit_group: visitGroup,
          program_visits: Math.round(visits),
        });
      }
    }

    if (metrics.length === 0) {
      this.addWarning('data_validation', 'No valid metrics extracted from sheet');
    }

    return metrics;
  }

  /**
   * Find week blocks - week headers appear in row 0 
   * Structure: Provider | Program | Visit Group | Number of Visits | empty... | Provider | Program | ...
   */
  private findWeekBlocks(headerRow: (string | number | undefined)[]): WeekBlock[] {
    const blocks: WeekBlock[] = [];

    for (let col = 0; col < headerRow.length; col++) {
      const weekStart = this.parseWeekHeader(headerRow[col]);
      
      if (weekStart) {
        // Week header is at col, data columns start 2 positions before
        // Based on structure: [empty, empty, "Week of...", ...]
        // The provider column is at col - 2
        blocks.push({
          weekStart,
          providerCol: Math.max(0, col - 2),
          programCol: Math.max(0, col - 1),
          visitGroupCol: col,
          visitsCol: col + 1,
        });
      }
    }

    return blocks;
  }
}

interface WeekBlock {
  weekStart: string;
  providerCol: number;
  programCol: number;
  visitGroupCol: number;
  visitsCol: number;
}

