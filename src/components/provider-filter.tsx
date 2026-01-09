'use client';

import { useMemo } from 'react';
import { Filter, X, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useDataStore } from '@/lib/store';
import { getUniqueProviders, getUniqueWeeks } from '@/lib/insights';

export function ProviderFilter() {
  const { metrics, filters, setFilters, resetFilters } = useDataStore();

  const providers = useMemo(() => getUniqueProviders(metrics), [metrics]);
  const weeks = useMemo(() => getUniqueWeeks(metrics), [metrics]);

  const toggleProvider = (provider: string) => {
    const current = filters.providers;
    if (current.includes(provider)) {
      setFilters({ providers: current.filter(p => p !== provider) });
    } else {
      setFilters({ providers: [...current, provider] });
    }
  };

  const toggleSource = (source: 'doxy_over_20' | 'gusto_hours' | 'doxy_visits') => {
    const current = filters.sources;
    if (current.includes(source)) {
      setFilters({ sources: current.filter(s => s !== source) });
    } else {
      setFilters({ sources: [...current, source] });
    }
  };

  const hasActiveFilters = 
    filters.providers.length > 0 || 
    filters.sources.length > 0 ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null;

  const sourceLabels = {
    doxy_over_20: 'Doxy Over 20',
    gusto_hours: 'Gusto Hours',
    doxy_visits: 'Doxy Visits',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-400" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date Range
          </label>
          <div className="flex gap-2">
            <select
              value={filters.dateRange.start || ''}
              onChange={(e) => setFilters({ 
                dateRange: { ...filters.dateRange, start: e.target.value || null }
              })}
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
            >
              <option value="">Start</option>
              {weeks.map(week => (
                <option key={week} value={week}>{week}</option>
              ))}
            </select>
            <span className="text-slate-500 self-center">to</span>
            <select
              value={filters.dateRange.end || ''}
              onChange={(e) => setFilters({ 
                dateRange: { ...filters.dateRange, end: e.target.value || null }
              })}
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
            >
              <option value="">End</option>
              {weeks.map(week => (
                <option key={week} value={week}>{week}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Sources */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Data Sources
          </label>
          <div className="flex flex-wrap gap-2">
            {(['doxy_over_20', 'gusto_hours', 'doxy_visits'] as const).map(source => (
              <button
                key={source}
                onClick={() => toggleSource(source)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${filters.sources.includes(source) || filters.sources.length === 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500'
                  }
                `}
              >
                {sourceLabels[source]}
              </button>
            ))}
          </div>
        </div>

        {/* Providers */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Providers ({filters.providers.length === 0 ? 'All' : filters.providers.length} selected)
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-800/50 rounded-lg p-2">
            {providers.map(provider => (
              <button
                key={provider}
                onClick={() => toggleProvider(provider)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                  ${filters.providers.includes(provider)
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-300 hover:bg-slate-700'
                  }
                `}
              >
                {provider}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-1">
              {filters.providers.map(p => (
                <Badge key={p} variant="success" size="sm">
                  {p}
                  <button onClick={() => toggleProvider(p)} className="ml-1">×</button>
                </Badge>
              ))}
              {filters.sources.map(s => (
                <Badge key={s} variant="info" size="sm">
                  {sourceLabels[s]}
                  <button onClick={() => toggleSource(s)} className="ml-1">×</button>
                </Badge>
              ))}
              {filters.dateRange.start && (
                <Badge variant="default" size="sm">
                  From: {filters.dateRange.start}
                </Badge>
              )}
              {filters.dateRange.end && (
                <Badge variant="default" size="sm">
                  To: {filters.dateRange.end}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

