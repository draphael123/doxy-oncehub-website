import { NextResponse } from 'next/server';
import { parseWorkbook } from '@/lib/parsers';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    // Possible paths to the default Excel file
    // Priority: data folder (for deployment), then Documents folder (for local dev)
    const possiblePaths = [
      path.join(process.cwd(), 'data', 'report.xlsx'),
      path.join(process.cwd(), '..', 'Documents', 'Oncehub_Doxy Report (in use) (6).xlsx'),
      path.join(process.cwd(), 'Documents', 'Oncehub_Doxy Report (in use) (6).xlsx'),
    ];

    let filePath: string | null = null;
    let buffer: Buffer | null = null;

    // Try to find the file
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        buffer = fs.readFileSync(p);
        break;
      }
    }

    if (!buffer || !filePath) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Default Excel file not found. Please upload a file manually.',
          searched: possiblePaths 
        },
        { status: 404 }
      );
    }

    // Parse the workbook
    const filename = path.basename(filePath);
    const parseResult = parseWorkbook(buffer.buffer, filename);

    if (parseResult.metrics.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No data could be extracted from the default file.',
          warnings: parseResult.warnings,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parseResult,
    });
  } catch (error) {
    console.error('Error loading default file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load default file' 
      },
      { status: 500 }
    );
  }
}

