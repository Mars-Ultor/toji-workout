import { cn } from '../../lib/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

interface DatePickerProps {
  value: string; // yyyy-MM-dd
  onChange: (date: string) => void;
  className?: string;
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const currentDate = new Date(value + 'T00:00:00');
  const today = format(new Date(), 'yyyy-MM-dd');
  const isToday = value === today;

  const goBack = () => {
    onChange(format(subDays(currentDate, 1), 'yyyy-MM-dd'));
  };

  const goForward = () => {
    const next = format(addDays(currentDate, 1), 'yyyy-MM-dd');
    if (next <= today) {
      onChange(next);
    }
  };

  const goToToday = () => {
    onChange(today);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={goBack}
        className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={goToToday}
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors min-w-[140px]"
      >
        {isToday ? 'Today' : format(currentDate, 'EEE, MMM d')}
      </button>

      <button
        onClick={goForward}
        disabled={isToday}
        className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
        aria-label="Next day"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
