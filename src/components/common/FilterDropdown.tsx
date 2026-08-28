import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}

export function FilterDropdown({ label, options, selectedValues, onToggle }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = selectedValues.length === 0 
    ? 'Any' 
    : selectedValues.length === 1 
      ? selectedValues[0] 
      : `${selectedValues.length} selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-2 rounded-lg border text-sm transition-colors min-w-[150px] md:min-w-[170px] h-[42px]",
          "bg-[#242938] border-[#40475C] hover:border-brand-blue/50",
          isOpen ? "border-brand-blue text-white" : "text-[#EDF0F7]"
        )}
      >
        <span className="truncate">{label}: {displayValue}</span>
        <ChevronDown size={15} className="text-[#A6ADC7] shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-[#1B2336] border border-[#40475C] rounded-lg shadow-xl overflow-hidden z-50">
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => onToggle(option)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#242938] transition-colors"
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                    isSelected ? "bg-brand-blue border-brand-blue" : "border-gray-500"
                  )}>
                    {isSelected && <Check size={12} className="text-bg-base" />}
                  </div>
                  <span className={isSelected ? "text-white" : "text-gray-300"}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
