'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...', 
  className,
  required = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={wrapperRef}>
      {required && (
        <input 
          type="text" 
          required 
          value={value} 
          onChange={() => {}} 
          className="absolute opacity-0 -z-10 h-0 w-0" 
        />
      )}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 bg-white p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
      >
        <span className={selectedOption ? "text-gray-900 dark:text-white truncate pr-2" : "text-gray-500 truncate pr-2"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-gray-500 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-[#12121a] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="border-b border-gray-100 p-2 dark:border-gray-800/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full rounded-lg bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none dark:bg-gray-900 dark:text-white"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500">No results found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition-colors",
                    value === option.value && "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium"
                  )}
                >
                  <span className="truncate pr-2">{option.label}</span>
                  {value === option.value && <Check className="h-4 w-4 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
