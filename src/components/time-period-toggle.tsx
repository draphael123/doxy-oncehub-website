'use client';

import { Calendar, CalendarDays } from 'lucide-react';
import { useDataStore } from '@/lib/store';
import { TimePeriod } from '@/lib/types';

export function TimePeriodToggle() {
  const { filters, setFilters } = useDataStore();
  const { timePeriod } = filters;

  const setTimePeriod = (period: TimePeriod) => {
    setFilters({ timePeriod: period });
  };

  return (
    <div className="inline-flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
      <button
        onClick={() => setTimePeriod('weekly')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
          ${timePeriod === 'weekly'
            ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
          }
        `}
      >
        <Calendar className="w-4 h-4" />
        Weekly
      </button>
      <button
        onClick={() => setTimePeriod('monthly')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
          ${timePeriod === 'monthly'
            ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
          }
        `}
      >
        <CalendarDays className="w-4 h-4" />
        Monthly
      </button>
    </div>
  );
}

