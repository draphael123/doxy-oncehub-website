import { NextRequest, NextResponse } from 'next/server';
import { parseWorkbook } from '@/lib/parsers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();

    // Parse the workbook
    const parseResult = parseWorkbook(buffer, file.name);

    // Check if any data was parsed
    if (parseResult.metrics.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No data could be extracted from the file. Please ensure the file contains supported sheets with valid data.',
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
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process file' 
      },
      { status: 500 }
    );
  }
}


