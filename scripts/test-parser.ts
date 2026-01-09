import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { parseWorkbook } from '../src/lib/parsers';

// Path to the Excel file in Documents folder
const filePath = path.join(__dirname, '../../Documents/Oncehub_Doxy Report (in use) (6).xlsx');

console.log('Reading file:', filePath);

try {
  // Read the file
  const buffer = fs.readFileSync(filePath);
  
  // First, let's examine the workbook structure
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  console.log('\n=== WORKBOOK STRUCTURE ===');
  console.log('Sheet names:', workbook.SheetNames);
  
  // Examine each sheet
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n--- Sheet: "${sheetName}" ---`);
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    console.log(`Range: ${sheet['!ref']}`);
    console.log(`Rows: ${range.e.r - range.s.r + 1}, Cols: ${range.e.c - range.s.c + 1}`);
    
    // Show first 5 rows
    console.log('\nFirst 5 rows:');
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    for (let i = 0; i < Math.min(5, data.length); i++) {
      console.log(`  Row ${i}:`, data[i]?.slice(0, 10));
    }
  }
  
  // Now try parsing with our parsers
  console.log('\n\n=== PARSING RESULTS ===');
  const result = parseWorkbook(buffer.buffer, 'Oncehub_Doxy Report.xlsx');
  
  console.log('\nMetadata:', result.metadata);
  console.log('\nSheets parsed:', result.sheets.map(s => ({
    name: s.sheetName,
    records: s.metrics.length,
    warnings: s.warnings.length
  })));
  
  console.log('\nTotal metrics:', result.metrics.length);
  
  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of result.warnings) {
      console.log(`  [${warning.type}] ${warning.sheetName}: ${warning.message}`);
    }
  }
  
  // Show sample of parsed data
  if (result.metrics.length > 0) {
    console.log('\nSample metrics (first 5):');
    for (const metric of result.metrics.slice(0, 5)) {
      console.log(' ', metric);
    }
  }
  
} catch (error) {
  console.error('Error:', error);
}

