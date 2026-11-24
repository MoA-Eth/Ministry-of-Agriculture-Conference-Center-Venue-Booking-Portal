import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle, CalendarDays, Ban } from 'lucide-react';

interface VenueWeeklyAvailabilityProps {
  venueId: string;
  venueName?: string;
  bookings: any[];
  toEthTime: (time: any) => string;
  isVipVenue?: boolean;
  onSelectBooking?: (booking: any) => void;
}

const BLOCKING_STATUSES = [
  'pending',
  'management_approved',
  'partial_paid',
  'paid',
  'approved',
  'confirmed',
  'completed'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseTimeToMin(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function minToTimeStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function VenueWeeklyAvailability({
  venueId,
  bookings,
  toEthTime,
  isVipVenue = false,
  onSelectBooking
}: VenueWeeklyAvailabilityProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Compute 7 days from today
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayStr = format(today, 'yyyy-MM-dd');

  const daysData = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const isToday = dateStr === todayStr;

    // Filter active bookings for this venue on this date
    const dayBookings: any[] = [];
    const busyIntervals: [number, number][] = [];

    (bookings || []).forEach(b => {
      if (b.venueId?.toString() !== venueId?.toString()) return;
      const bStatus = (b.status || '').trim().toLowerCase();
      if (!BLOCKING_STATUSES.includes(bStatus)) return;

      let schedules: any[] = Array.isArray(b.dailySchedules) ? b.dailySchedules : [];
      if (typeof b.dailySchedules === 'string') {
        try { schedules = JSON.parse(b.dailySchedules); } catch { schedules = []; }
      }

      let matches = false;
      let sTime = b.startTime || '08:30';
      let eTime = b.endTime || '17:30';
      let allDay = false;

      if (schedules.length > 0) {
        const ds = schedules.find((s: any) => (s?.date || '').startsWith(dateStr));
        if (ds) {
          matches = true;
          allDay = Boolean(ds.allDay);
          sTime = ds.allDay ? '08:30' : (ds.startTime || b.startTime || '08:30');
          eTime = ds.allDay ? '17:30' : (ds.endTime || b.endTime || '17:30');
        }
      } else if (b.startDate <= dateStr && b.endDate >= dateStr) {
        matches = true;
      }

      if (matches) {
        dayBookings.push({
          id: b.id,
          eventTitle: b.eventTitle || 'Reserved Event',
          startTime: sTime,
          endTime: eTime,
          allDay,
          status: bStatus,
          raw: b
        });

        if (allDay) {
          busyIntervals.push([510, 1050]); // 08:30 to 17:30 in minutes
        } else {
          const sMin = Math.max(510, parseTimeToMin(sTime));
          const eMin = Math.min(1050, parseTimeToMin(eTime));
          if (eMin > sMin) {
            busyIntervals.push([sMin, eMin]);
          }
        }
      }
    });

    // Merge overlapping busy intervals
    busyIntervals.sort((a, b) => a[0] - b[0]);
    const mergedBusy: [number, number][] = [];
    busyIntervals.forEach(curr => {
      if (!mergedBusy.length) {
        mergedBusy.push([...curr]);
      } else {
        const last = mergedBusy[mergedBusy.length - 1];
        if (curr[0] <= last[1]) {
          last[1] = Math.max(last[1], curr[1]);
        } else {
          mergedBusy.push([...curr]);
        }
      }
    });

    // Compute free intervals within standard operating hours (08:30 - 17:30 = 510 - 1050 mins)
    const freeIntervals: [number, number][] = [];
    let curPointer = 510;
    mergedBusy.forEach(([bs, be]) => {
      if (bs > curPointer && bs - curPointer >= 45) {
        freeIntervals.push([curPointer, bs]);
      }
      curPointer = Math.max(curPointer, be);
    });
    if (1050 - curPointer >= 45) {
      freeIntervals.push([curPointer, 1050]);
    }

    // Determine status
    let status: 'available' | 'partial' | 'booked' = 'available';
    let statusText = 'Available Full Day';

    if (mergedBusy.length === 0) {
      status = 'available';
      statusText = 'Available All Day';
    } else if (freeIntervals.length === 0) {
      status = 'booked';
      statusText = 'Fully Booked';
    } else {
      status = 'partial';
      statusText = 'Partially Booked';
    }

    // Format available slot strings
    const availableSlotLabels = freeIntervals.map(([fs, fe]) => {
      if (fs === 510 && fe === 1050) {
        return `${toEthTime('08:30')} – ${toEthTime('17:30')} (Full Day Open)`;
      }
      const label = `${toEthTime(minToTimeStr(fs))} – ${toEthTime(minToTimeStr(fe))}`;
      if (fs === 510) return `${label} (Morning Open)`;
      if (fe === 1050) return `${label} (Afternoon Open)`;
      return `${label} (Slot Open)`;
    });

    return {
      date: d,
      dateStr,
      dayLabel: WEEKDAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      monthLabel: format(d, 'MMM'),
      fullDateLabel: format(d, 'EEEE, MMM d'),
      isToday,
      status,
      statusText,
      dayBookings,
      availableSlotLabels,
    };
  });

  const selectedDay = daysData[selectedDayIndex] || daysData[0];
  const availableDaysCount = daysData.filter(d => d.status === 'available').length;
  const partialDaysCount = daysData.filter(d => d.status === 'partial').length;

  return (
    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 sm:p-4 mb-4">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <CalendarDays size={14} className="text-[#268053]" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
            7-Day Availability & Slots
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full border ${
            availableDaysCount + partialDaysCount >= 5
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : availableDaysCount + partialDaysCount > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {availableDaysCount === 7
              ? 'Full Week Open'
              : `${availableDaysCount + partialDaysCount} of 7 Days Open`}
          </span>
        </div>
      </div>

      {/* 7-Day interactive selector strip */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-3">
        {daysData.map((day, idx) => {
          const isSelected = idx === selectedDayIndex;
          const isAvail = day.status === 'available';
          const isPart = day.status === 'partial';
          const isBook = day.status === 'booked';

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelectedDayIndex(idx)}
              className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'bg-white shadow-md ring-2 ring-[#268053] border-transparent scale-[1.03] z-10'
                  : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-tight ${
                day.isToday ? 'text-[#268053] font-black' : 'text-slate-400'
              }`}>
                {day.isToday ? 'Today' : day.dayLabel}
              </span>
              <span className={`text-xs sm:text-sm font-black my-0.5 leading-none ${
                isSelected ? 'text-[#268053]' : 'text-slate-800'
              }`}>
                {day.dayNum}
              </span>
              {/* Dot indicator */}
              <div className="mt-0.5 flex items-center justify-center">
                <span className={`w-2 h-2 rounded-full ${
                  isAvail
                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                    : isPart
                      ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                      : 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                }`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Available Time Slots for Selected Day */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-sm animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-800">
              {selectedDay.fullDateLabel}
            </span>
            {selectedDay.isToday && (
              <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-[#1b5e3a] px-1.5 py-0.5 rounded">
                Today
              </span>
            )}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
            selectedDay.status === 'available'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : selectedDay.status === 'partial'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {selectedDay.status === 'available' ? (
              <CheckCircle2 size={10} className="text-emerald-600" />
            ) : selectedDay.status === 'partial' ? (
              <Clock size={10} className="text-amber-600" />
            ) : (
              <Ban size={10} className="text-rose-600" />
            )}
            {selectedDay.statusText}
          </span>
        </div>

        {/* Available Time Slots Section */}
        {selectedDay.availableSlotLabels.length > 0 ? (
          <div>
            <p className="text-[9px] font-black text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <CheckCircle2 size={11} className="text-emerald-600" /> Available Time Slots
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedDay.availableSlotLabels.map((slot, sIdx) => (
                <span
                  key={sIdx}
                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-2 py-1 rounded-lg"
                >
                  <Clock size={10} className="text-emerald-600 shrink-0" />
                  {slot}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-1 text-slate-500 flex items-center gap-1.5 text-xs font-medium">
            <AlertCircle size={13} className="text-rose-500 shrink-0" />
            <span className="text-rose-700 font-bold text-[11px]">
              No available slots on this date (fully booked).
            </span>
          </div>
        )}

        {/* Existing Bookings for this day (if any) */}
        {selectedDay.dayBookings.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Reserved Slots ({selectedDay.dayBookings.length})
            </p>
            <div className="space-y-1">
              {selectedDay.dayBookings.map((bk: any, bi: number) => (
                <div
                  key={bi}
                  onClick={() => onSelectBooking && onSelectBooking(bk.raw)}
                  className={`flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-100 ${
                    onSelectBooking ? 'cursor-pointer hover:bg-slate-100' : ''
                  }`}
                >
                  <span className="font-bold text-slate-700 truncate mr-2">
                    {bk.eventTitle}
                  </span>
                  <span className="text-slate-500 font-mono text-[9px] shrink-0">
                    {bk.allDay ? 'All Day' : `${toEthTime(bk.startTime)} – ${toEthTime(bk.endTime)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
