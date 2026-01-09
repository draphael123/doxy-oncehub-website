import * as XLSX from 'xlsx';
import { WeeklyProviderMetric, ParserWarning, ParsedSheet } from '../types';

/**
 * Base parser class with common utilities for all sheet parsers
 */
export abstract class BaseSheetParser {
  protected sheetName: string;
  protected warnings: ParserWarning[] = [];

  constructor(sheetName: string) {
    this.sheetName = sheetName;
  }

  /**
   * Parse the sheet and return normalized metrics
   */
  abstract parse(worksheet: XLSX.WorkSheet): WeeklyProviderMetric[];

  /**
   * Get all warnings generated during parsing
   */
  getWarnings(): ParserWarning[] {
    return this.warnings;
  }

  /**
   * Reset warnings for a new parse operation
   */
  protected resetWarnings(): void {
    this.warnings = [];
  }

  /**
   * Add a warning
   */
  protected addWarning(
    type: ParserWarning['type'],
    message: string,
    details?: { row?: number; column?: string; weekBlock?: string }
  ): void {
    this.warnings.push({
      sheetName: this.sheetName,
      type,
      message,
      ...details,
    });
  }

  /**
   * Convert worksheet to 2D array for easier manipulation
   */
  protected sheetToArray(worksheet: XLSX.WorkSheet): (string | number | undefined)[][] {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const result: (string | number | undefined)[][] = [];

    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData: (string | number | undefined)[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        rowData.push(cell ? cell.v : undefined);
      }
      result.push(rowData);
    }

    return result;
  }

  /**
   * Parse week header to ISO date string
   * Handles various formats:
   * - "Week of M/D/YY", "Week of M/D" 
   * - "WEEK OF M/D" (case insensitive)
   * - "M/D-M/D" (date range, uses start date)
   * - "M/D/YYYY", "M/D/YY"
   * - Excel serial date numbers
   */
  protected parseWeekHeader(header: string | number | undefined): string | null {
    if (header === undefined || header === null) return null;

    // Excel serial date number
    if (typeof header === 'number' && header > 40000 && header < 60000) {
      const date = this.excelDateToJS(header);
      return date.toISOString().split('T')[0];
    }

    const headerStr = String(header).trim();
    if (!headerStr) return null;

    // Pattern: "Week of M/D/YY" or "Week of M/D/YYYY" or "Week of M/D"
    const weekOfMatch = headerStr.match(/week\s+of\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i);
    if (weekOfMatch) {
      return this.buildDateString(weekOfMatch[1], weekOfMatch[2], weekOfMatch[3]);
    }

    // Pattern: "M/D-M/D" date range (use start date) - may have trailing space
    const dateRangeMatch = headerStr.match(/^(\d{1,2})\/(\d{1,2})\s*-\s*\d{1,2}\/\d{1,2}\s*$/);
    if (dateRangeMatch) {
      return this.buildDateString(dateRangeMatch[1], dateRangeMatch[2]);
    }

    // Pattern: "M/D/YY" or "M/D/YYYY"
    const dateMatch = headerStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (dateMatch) {
      return this.buildDateString(dateMatch[1], dateMatch[2], dateMatch[3]);
    }

    // Pattern: "Mon D, YYYY" (e.g., "Jan 6, 2025")
    const monthNameMatch = headerStr.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})$/i);
    if (monthNameMatch) {
      const monthMap: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
      };
      const month = monthMap[monthNameMatch[1].toLowerCase()];
      const day = monthNameMatch[2].padStart(2, '0');
      const year = monthNameMatch[3];
      return `${year}-${month}-${day}`;
    }

    return null;
  }

  /**
   * Build ISO date string from parsed components
   * If year is not provided, assume current year or previous year if month is in future
   */
  private buildDateString(month: string, day: string, year?: string): string {
    let fullYear: string;
    
    if (!year) {
      // No year provided - infer from current date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const parsedMonth = parseInt(month);
      
      // If the month is more than 2 months in the future, use previous year
      if (parsedMonth > currentMonth + 2) {
        fullYear = String(currentYear - 1);
      } else {
        fullYear = String(currentYear);
      }
    } else if (year.length === 2) {
      const yearNum = parseInt(year);
      fullYear = yearNum >= 50 ? `19${year}` : `20${year}`;
    } else {
      fullYear = year;
    }
    
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  /**
   * Convert Excel serial date to JavaScript Date
   */
  protected excelDateToJS(serial: number): Date {
    // Excel dates start from 1900-01-01 (serial 1)
    // But Excel incorrectly considers 1900 a leap year
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400 * 1000;
    return new Date(utcValue);
  }

  /**
   * Parse a numeric value, handling various formats
   */
  protected parseNumber(value: string | number | undefined): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;

    if (typeof value === 'number') {
      return isNaN(value) ? undefined : value;
    }

    // Remove commas, dollar signs, percent signs
    const cleaned = String(value).replace(/[$,%\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Parse a percentage value (returns as percentage number, e.g., 25 for 25%)
   */
  protected parsePercent(value: string | number | undefined): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;

    if (typeof value === 'number') {
      // If already decimal (0-1 range), convert to percentage
      return value <= 1 ? value * 100 : value;
    }

    const cleaned = String(value).replace(/[%\s]/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return undefined;
    
    // If the value was <= 1 and didn't have %, assume it's a decimal
    return num <= 1 && !String(value).includes('%') ? num * 100 : num;
  }

  /**
   * Clean provider name
   */
  protected cleanProviderName(name: string | number | undefined): string {
    if (name === undefined || name === null) return '';
    return String(name).trim();
  }

  /**
   * Check if a row is likely a provider data row (not header, total, etc.)
   */
  protected isProviderRow(firstCell: string | number | undefined): boolean {
    if (firstCell === undefined || firstCell === null || firstCell === '') {
      return false;
    }

    const value = String(firstCell).toLowerCase().trim();
    
    // Skip common non-provider rows
    const skipPatterns = [
      'total', 'average', 'avg', 'sum', 'provider', 'name', 'employee',
      'grand total', 'subtotal', 'header', 'week of', 'date'
    ];

    return !skipPatterns.some(pattern => value === pattern || value.startsWith(pattern + ' '));
  }

  /**
   * Get parsed sheet result
   */
  getResult(metrics: WeeklyProviderMetric[]): ParsedSheet {
    return {
      sheetName: this.sheetName,
      metrics,
      warnings: this.warnings,
    };
  }
}
