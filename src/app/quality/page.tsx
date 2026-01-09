'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileSpreadsheet,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDataStore } from '@/lib/store';
import { ParserWarning } from '@/lib/types';

export default function QualityPage() {
  const { parseResult, metrics } = useDataStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const warnings = useMemo(() => parseResult?.warnings || [], [parseResult]);
  const sheets = useMemo(() => parseResult?.sheets || [], [parseResult]);

  const warningsByType = useMemo(() => {
    const grouped: Record<string, ParserWarning[]> = {
      missing_column: [],
      unparsed_block: [],
      week_parse_failure: [],
      data_validation: [],
      unknown_format: [],
    };

    for (const warning of warnings) {
      if (grouped[warning.type]) {
        grouped[warning.type].push(warning);
      }
    }

    return grouped;
  }, [warnings]);

  const getWarningIcon = (type: ParserWarning['type']) => {
    switch (type) {
      case 'missing_column':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'unparsed_block':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'week_parse_failure':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'data_validation':
        return <Info className="w-5 h-5 text-blue-400" />;
      case 'unknown_format':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
  };

  const getWarningVariant = (type: ParserWarning['type']): 'danger' | 'warning' | 'info' => {
    switch (type) {
      case 'missing_column':
      case 'unknown_format':
        return 'danger';
      case 'unparsed_block':
      case 'week_parse_failure':
        return 'warning';
      case 'data_validation':
        return 'info';
    }
  };

  const warningTypeLabels: Record<string, string> = {
    missing_column: 'Missing Columns',
    unparsed_block: 'Unparsed Blocks',
    week_parse_failure: 'Week Parse Failures',
    data_validation: 'Data Validation',
    unknown_format: 'Unknown Format',
  };

  if (!mounted) return null;

  if (!parseResult) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">No Data Available</h2>
        <p className="text-slate-400">
          Upload an Excel file from the Overview page to view data quality analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-1">Data Quality</h1>
        <p className="text-slate-400">
          Parser warnings, validation issues, and data health metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={warnings.length === 0 ? 'border-emerald-500/30' : ''}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              {warnings.length === 0 ? (
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
              )}
              <div>
                <p className="text-slate-400 text-sm">Total Warnings</p>
                <p className="text-3xl font-bold text-slate-100">{warnings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <FileSpreadsheet className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Sheets Parsed</p>
                <p className="text-3xl font-bold text-slate-100">{sheets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Records Extracted</p>
                <p className="text-3xl font-bold text-slate-100">{metrics.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Info className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Parse Date</p>
                <p className="text-lg font-bold text-slate-100">
                  {new Date(parseResult.metadata.parsedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sheet Details */}
      <Card>
        <CardHeader>
          <CardTitle>Parsed Sheets</CardTitle>
          <CardDescription>Status and record count for each sheet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sheets.map((sheet) => (
              <div
                key={sheet.sheetName}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-slate-100 font-medium">{sheet.sheetName}</p>
                    <p className="text-slate-500 text-sm">
                      {sheet.metrics.length} records extracted
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sheet.warnings.length === 0 ? (
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Clean
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {sheet.warnings.length} warning{sheet.warnings.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {sheets.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No sheets were parsed from the uploaded file.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warnings by Type */}
      {warnings.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-100">Warnings by Type</h2>
          
          {Object.entries(warningsByType).map(([type, typeWarnings]) => {
            if (typeWarnings.length === 0) return null;

            return (
              <Card key={type}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getWarningIcon(type as ParserWarning['type'])}
                    <div>
                      <CardTitle>{warningTypeLabels[type]}</CardTitle>
                      <CardDescription>
                        {typeWarnings.length} issue{typeWarnings.length !== 1 ? 's' : ''} found
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {typeWarnings.map((warning, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg"
                      >
                        <Badge 
                          variant={getWarningVariant(warning.type)} 
                          size="sm"
                        >
                          {warning.sheetName}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-slate-300 text-sm">{warning.message}</p>
                          <div className="flex gap-4 mt-1 text-xs text-slate-500">
                            {warning.row !== undefined && (
                              <span>Row: {warning.row}</span>
                            )}
                            {warning.column && (
                              <span>Column: {warning.column}</span>
                            )}
                            {warning.weekBlock && (
                              <span>Week: {warning.weekBlock}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No Warnings State */}
      {warnings.length === 0 && (
        <Card className="border-emerald-500/30">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-100 mb-2">
              All Data Parsed Successfully
            </h3>
            <p className="text-slate-400">
              No warnings or validation issues were detected during parsing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data Quality Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Tips</CardTitle>
          <CardDescription>Ensure your Excel file follows these guidelines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <h4 className="text-slate-100 font-medium mb-2">Week Headers</h4>
              <p className="text-slate-400 text-sm">
                Week columns should have headers like &quot;Week of 1/6/25&quot; or standard date formats.
              </p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <h4 className="text-slate-100 font-medium mb-2">Sheet Names</h4>
              <p className="text-slate-400 text-sm">
                Supported sheets: &quot;Doxy - Over 20 minutes&quot;, &quot;Gusto Hours &quot;, &quot;Doxy Visits&quot;
              </p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <h4 className="text-slate-100 font-medium mb-2">Provider Names</h4>
              <p className="text-slate-400 text-sm">
                Provider names should be consistent across all sheets for accurate data merging.
              </p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <h4 className="text-slate-100 font-medium mb-2">Numeric Values</h4>
              <p className="text-slate-400 text-sm">
                Ensure numeric fields contain numbers only. Percentages can include % symbol.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

