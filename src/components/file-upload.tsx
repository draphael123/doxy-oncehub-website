'use client';

import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useDataStore } from '@/lib/store';

export function FileUpload() {
  const { setParseResult, setLoading, setError, isLoading } = useDataStore();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  }, [setError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setParseResult(result.data);
        setSelectedFile(null);
      } else {
        setError(result.error || 'Failed to parse file');
      }
    } catch {
      setError('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <Card className="border-dashed border-2 border-slate-600">
      <CardContent className="p-8">
        <div
          className={`
            relative flex flex-col items-center justify-center py-8
            transition-colors rounded-lg
            ${dragActive ? 'bg-emerald-500/10' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-700/50 px-4 py-3 rounded-lg">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-slate-100 font-medium">{selectedFile.name}</p>
                  <p className="text-slate-400 text-sm">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="ml-2 p-1 hover:bg-slate-600 rounded"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <Button onClick={handleUpload} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Parse
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-500 mb-4" />
              <p className="text-slate-300 text-lg mb-2">
                Drag and drop your Excel file here
              </p>
              <p className="text-slate-500 text-sm mb-4">
                or click to browse
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="secondary">
                <FileSpreadsheet className="w-4 h-4" />
                Select File
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

