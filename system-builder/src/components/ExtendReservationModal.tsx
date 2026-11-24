import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Booking } from '@/lib/types';
import { format, addDays } from 'date-fns';
import { 
  CalendarPlus, Clock, Calendar, ArrowRight, X, AlertCircle, Sparkles, Building, CheckCircle2 
} from 'lucide-react';
import { Button } from './ui/button';

interface ExtendReservationModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ExtendReservationModal({
  booking,
  isOpen,
  onClose,
  onSuccess
}: ExtendReservationModalProps) {
  const { extendBooking, venues, toEthTime } = useApp();

  const [newEndDate, setNewEndDate] = useState<string>('');
  const [newEndTime, setNewEndTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setNewEndDate(booking.endDate || booking.startDate || '');
      setNewEndTime(booking.endTime || '17:30');
      setReason('');
      setErrorMsg(null);
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const venue = venues.find(v => v.id?.toString() === booking.venueId?.toString());

  const applyQuickPreset = (type: 'plus1day' | 'plus2days' | 'plus1hour' | 'plus2hours' | 'fullday') => {
    setErrorMsg(null);
    if (type === 'plus1day') {
      try {
        const baseDate = new Date(newEndDate || booking.endDate || booking.startDate);
        const nextDate = addDays(baseDate, 1);
        setNewEndDate(format(nextDate, 'yyyy-MM-dd'));
      } catch {
        // fallback
      }
    } else if (type === 'plus2days') {
      try {
        const baseDate = new Date(newEndDate || booking.endDate || booking.startDate);
        const nextDate = addDays(baseDate, 2);
        setNewEndDate(format(nextDate, 'yyyy-MM-dd'));
      } catch {
        // fallback
      }
    } else if (type === 'plus1hour') {
      const cur = newEndTime || booking.endTime || '17:30';
      const [h, m] = cur.split(':').map(Number);
      const newH = Math.min(23, (h || 0) + 1);
      setNewEndTime(`${newH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`);
    } else if (type === 'plus2hours') {
      const cur = newEndTime || booking.endTime || '17:30';
      const [h, m] = cur.split(':').map(Number);
      const newH = Math.min(23, (h || 0) + 2);
      setNewEndTime(`${newH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`);
    } else if (type === 'fullday') {
      setNewEndTime('17:30');
    }
  };

  const handleConfirm = async () => {
    setErrorMsg(null);

    // Validation
    if (!newEndDate && !newEndTime) {
      setErrorMsg('Please specify a new end date or time.');
      return;
    }

    if (newEndDate && newEndDate < (booking.startDate || '')) {
      setErrorMsg(`New end date cannot be earlier than booking start date (${booking.startDate}).`);
      return;
    }

    if (newEndDate === booking.startDate && newEndTime && booking.startTime) {
      if (newEndTime <= booking.startTime) {
        setErrorMsg('New end time must be after the start time.');
        return;
      }
    }

    const hasChanged = newEndDate !== booking.endDate || newEndTime !== booking.endTime;
    if (!hasChanged) {
      setErrorMsg('Please pick a date or time that extends past the current reservation schedule.');
      return;
    }

    setIsSubmitting(true);
    try {
      await extendBooking(booking.id, {
        newEndDate: newEndDate !== booking.endDate ? newEndDate : undefined,
        newEndTime: newEndTime !== booking.endTime ? newEndTime : undefined,
        reason: reason.trim() || undefined
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to extend reservation schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#111827] via-[#1b5e3a] to-[#268053] p-6 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <CalendarPlus size={16} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
              Event Management &bull; Schedule Extension
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white line-clamp-1">
            Extend Reservation
          </h2>
          <p className="text-xs text-emerald-100/80 mt-1 line-clamp-1">
            MOA-BKG-{booking.id} &bull; {booking.eventTitle}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">

          {/* Current schedule banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              <span>Current Reservation Details</span>
              <span className="font-mono text-slate-600">MOA-BKG-{booking.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block mb-0.5">Start Date & Time</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Calendar size={12} className="text-[#268053]" />
                  {booking.startDate} &bull; {toEthTime(booking.startTime)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block mb-0.5">Current End</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Clock size={12} className="text-[#268053]" />
                  {booking.endDate} &bull; {toEthTime(booking.endTime)}
                </span>
              </div>
            </div>
            {venue && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                <Building size={12} className="text-slate-400" />
                <span>Facility: {venue.name}</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
              Quick Extension Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyQuickPreset('plus1day')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
              >
                +1 Day
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset('plus2days')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
              >
                +2 Days
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset('plus1hour')}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-all shadow-sm active:scale-95"
              >
                +1 Hour
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset('plus2hours')}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-all shadow-sm active:scale-95"
              >
                +2 Hours
              </button>
              <button
                type="button"
                onClick={() => applyQuickPreset('fullday')}
                className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition-all shadow-sm active:scale-95"
              >
                Full Day (05:30 PM)
              </button>
            </div>
          </div>

          {/* New End Date & End Time Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">
                New End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={booking.startDate}
                  value={newEndDate}
                  onChange={e => { setNewEndDate(e.target.value); setErrorMsg(null); }}
                  className="w-full text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">
                New Daily End Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={newEndTime}
                  onChange={e => { setNewEndTime(e.target.value); setErrorMsg(null); }}
                  className="w-full text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Extension Reason / Note */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">
              Extension Reason <span className="text-slate-400 font-normal">(Optional note for audit log)</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Organizer requested extra plenary time, agenda postponed by 2 hours..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] resize-none shadow-sm"
            />
          </div>

          {/* Audit Safe Info */}
          <div className="text-[11px] text-slate-500 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2">
            <Sparkles size={14} className="text-[#268053] shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Automated Conflict Checking:</strong> The system automatically verifies that the extended dates and times do not conflict with other active bookings on this venue.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-xl font-bold text-xs sm:text-sm border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="bg-[#268053] hover:bg-[#1b5e3a] text-white rounded-xl font-bold text-xs sm:text-sm px-5 shadow-md flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Extending Schedule...</span>
              </>
            ) : (
              <>
                <CalendarPlus size={15} />
                <span>Confirm Extension</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
