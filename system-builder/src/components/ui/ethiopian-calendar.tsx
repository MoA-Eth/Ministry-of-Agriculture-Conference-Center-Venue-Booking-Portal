import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format } from 'date-fns';

export const GREG_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Alias for backwards compatibility
export const ETH_MONTHS = GREG_MONTHS;

interface CalendarProps {
  selected?: { from?: Date; to?: Date };
  onSelect?: (range: { from?: Date; to?: Date }) => void;
  bookedDates?: Date[];
  partialBookedDates?: Date[];
  pendingDates?: Date[];
  [key: string]: any; 
}

export function GregorianCalendar({ selected, onSelect, bookedDates = [], partialBookedDates = [], pendingDates = [], allowPast = false }: CalendarProps & { allowPast?: boolean }) {
  const [viewYear, setViewYear] = useState(() => (selected?.from || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected?.from || new Date()).getMonth()); // 0-indexed (0=Jan)

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const isSelected = (date: Date) => {
    if (!selected?.from && !selected?.to) return false;
    if (selected.from && isSameDay(date, selected.from)) return true;
    if (selected.to && isSameDay(date, selected.to)) return true;
    if (selected.from && selected.to && date > selected.from && date < selected.to) return true;
    return false;
  };

  const isBooked = (date: Date) => bookedDates.some(d => isSameDay(d, date));
  const isPartialBooked = (date: Date) => partialBookedDates.some(d => isSameDay(d, date));
  const isPending = (date: Date) => pendingDates.some(d => isSameDay(d, date));

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };
  
  const isToday = (date: Date) => isSameDay(new Date(), date);

  const handleDateClick = (date: Date) => {
    if (!allowPast && isPast(date)) return;

    if (!selected?.from || (selected.from && selected.to)) {
      onSelect?.({ from: date, to: undefined });
    } else {
      if (date < selected.from) {
        onSelect?.({ from: date, to: selected.from });
      } else {
        onSelect?.({ from: selected.from, to: date });
      }
    }
  };

  const renderDays = () => {
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const days = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const currentGCDate = new Date(viewYear, viewMonth, dayNum, 12, 0, 0);

      const selectedState = isSelected(currentGCDate);
      const booked = isBooked(currentGCDate);
      const partialBooked = isPartialBooked(currentGCDate);
      const pending = isPending(currentGCDate);
      const past = isPast(currentGCDate);
      const today = isToday(currentGCDate);

      let className = "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative ";

      if (past && !allowPast) {
        className += "bg-slate-50 text-slate-300 cursor-not-allowed line-through opacity-60";
      } else if (booked) {
        className += "bg-red-50 text-red-600 cursor-pointer border border-red-200 hover:bg-red-100";
      } else if (partialBooked) {
        className += "bg-blue-50 text-blue-600 cursor-pointer border border-blue-200 hover:bg-blue-100";
      } else if (selectedState) {
        className += "bg-[#268053] text-white shadow-md transform scale-110 z-10 font-bold";
      } else if (today) {
        className += "bg-emerald-100 text-emerald-900 font-black ring-2 ring-emerald-400 cursor-pointer hover:bg-emerald-200 shadow-sm";
      } else if (pending) {
        className += "bg-amber-100 text-amber-700 cursor-pointer hover:bg-amber-200 border border-amber-200";
      } else {
        className += "text-slate-700 hover:bg-emerald-50 cursor-pointer";
      }

      days.push(
        <div
          key={`day-${dayNum}`}
          onClick={() => handleDateClick(currentGCDate)}
          className={className}
          title={format(currentGCDate, 'PPP')}
        >
          {dayNum}
          {selectedState && <Check className="absolute -top-1 -right-1 w-3 h-3 bg-white text-[#268053] rounded-full p-0.5 shadow-sm" />}
        </div>
      );
    }
    return days;
  };

  const monthName = GREG_MONTHS[viewMonth];

  return (
    <div className="w-80 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">{monthName}</h2>
          <p className="text-xs font-bold text-[#268053]">{viewYear}</p>
        </div>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 place-items-center">
        {renderDays()}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-100 ring-1 ring-emerald-500"></div> Today</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#268053]"></div> Selected</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-200"></div> Pending</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-200"></div> Partially Booked</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-200"></div> Fully Booked</div>
      </div>
    </div>
  );
}

// Alias for backwards compatibility
export const EthiopianCalendar = GregorianCalendar;