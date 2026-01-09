'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ParseResult, WeeklyProviderMetric, FilterState } from './types';
import { generateDemoData } from './demo-data';
import { mergeMetrics } from './parsers';

interface DataStore {
  parseResult: ParseResult | null;
  metrics: WeeklyProviderMetric[];
  filters: FilterState;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setParseResult: (result: ParseResult) => void;
  loadDemoData: () => void;
  loadDefaultFile: () => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  clearData: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Derived
  filteredMetrics: WeeklyProviderMetric[];
}

const defaultFilters: FilterState = {
  providers: [],
  dateRange: { start: null, end: null },
  sources: [],
};

const DataContext = createContext<DataStore | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [parseResult, setParseResultState] = useState<ParseResult | null>(null);
  const [filters, setFiltersState] = useState<FilterState>(defaultFilters);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metrics = parseResult?.metrics || [];
  const mergedMetrics = mergeMetrics(metrics);

  const setParseResult = useCallback((result: ParseResult) => {
    setParseResultState(result);
    setError(null);
  }, []);

  const loadDemoData = useCallback(() => {
    setLoading(true);
    try {
      const demoData = generateDemoData();
      setParseResultState(demoData);
      setError(null);
    } catch {
      setError('Failed to generate demo data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDefaultFile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/load-default');
      const result = await response.json();
      
      if (result.success) {
        setParseResultState(result.data);
      } else {
        // If default file not found, don't show error - just stay on upload screen
        console.log('Default file not available:', result.error);
      }
    } catch (err) {
      console.error('Failed to load default file:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const clearData = useCallback(() => {
    setParseResultState(null);
    setFiltersState(defaultFilters);
    setError(null);
  }, []);

  // Apply filters to metrics
  const filteredMetrics = mergedMetrics.filter(m => {
    if (filters.providers.length > 0 && !filters.providers.includes(m.provider)) {
      return false;
    }
    if (filters.dateRange.start && m.week_start < filters.dateRange.start) {
      return false;
    }
    if (filters.dateRange.end && m.week_start > filters.dateRange.end) {
      return false;
    }
    if (filters.sources.length > 0 && !filters.sources.includes(m.source)) {
      return false;
    }
    return true;
  });

  const value: DataStore = {
    parseResult,
    metrics: mergedMetrics,
    filters,
    isLoading,
    error,
    setParseResult,
    loadDemoData,
    loadDefaultFile,
    setFilters,
    resetFilters,
    clearData,
    setLoading,
    setError,
    filteredMetrics,
  };

  return React.createElement(
    DataContext.Provider,
    { value },
    children
  );
}

export function useDataStore(): DataStore {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataStore must be used within a DataProvider');
  }
  return context;
}

