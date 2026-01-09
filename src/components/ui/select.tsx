'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, options, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full appearance-none bg-slate-800 border border-slate-600 rounded-lg
              px-4 py-2 pr-10 text-slate-100 text-sm
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
              hover:border-slate-500 transition-colors
              ${className}
            `}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

interface MultiSelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ label, options, value, onChange, placeholder = 'Select...' }: MultiSelectProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 min-h-[42px]">
        {value.length === 0 ? (
          <span className="text-slate-500 text-sm px-2">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {value.map((v) => {
              const option = options.find(o => o.value === v);
              return (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-sm"
                >
                  {option?.label || v}
                  <button
                    onClick={() => toggleOption(v)}
                    className="hover:text-emerald-100 focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-2 max-h-48 overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => toggleOption(option.value)}
            className={`
              w-full text-left px-3 py-2 text-sm transition-colors
              ${value.includes(option.value) 
                ? 'bg-emerald-500/20 text-emerald-300' 
                : 'text-slate-300 hover:bg-slate-700'
              }
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

