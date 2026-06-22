import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/app-context';
import { DailySchedule } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Users, CheckCircle2, Paperclip, Sparkles, Receipt, Building2, ShieldAlert, MonitorSmartphone, Coffee, AlertTriangle, Lock, Phone, Utensils } from 'lucide-react';
import { EthiopianCalendar, ETH_MONTHS } from '@/components/ui/ethiopian-calendar';
import { EthDateTime } from 'ethiopian-calendar-date-converter';

const steps = [
  { num: 1, label: 'DETAILS' },
  { num: 2, label: 'VENUE' },
  { num: 3, label: 'SERVICES' },
  { num: 4, label: 'FINISH' },
];

const timeToMinutes = (timeStr: string | undefined) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const isFullDayBooked = (dateStr: string, schedules: any[]) => {
  const daySchedules = schedules.filter(s => s.date === dateStr && s.isHard);
  if (daySchedules.length === 0) return false;
  
  const hasFullDaySingle = daySchedules.some(s => {
    const st = timeToMinutes(s.start);
    const en = timeToMinutes(s.end);
    return st <= 510 && en >= 1050; // 08:30 to 17:30
  });
  if (hasFullDaySingle) return true;

  const DAY_START = 510;
  const DAY_END = 1050;
  const intervals = daySchedules.map(s => ({
    start: Math.max(DAY_START, timeToMinutes(s.start)),
    end: Math.min(DAY_END, timeToMinutes(s.end))
  })).filter(inv => inv.start < inv.end);

  if (intervals.length === 0) return false;
  intervals.sort((a, b) => a.start - b.start);
  
  const merged: {start: number, end: number}[] = [];
  intervals.forEach(curr => {
    if (merged.length === 0) { merged.push({ ...curr }); }
    else {
      const last = merged[merged.length - 1];
      if (curr.start <= last.end) { last.end = Math.max(last.end, curr.end); }
      else { merged.push({ ...curr }); }
    }
  });

  if (merged.length === 1 && merged[0].start <= DAY_START && merged[0].end >= DAY_END) { return true; }
  return false;
};

export default function NewBookingForm({ onComplete, hideHero = false }: { onComplete: () => void, hideHero?: boolean }) {
  const { bookings = [], venues = [], addBooking, user, technicalServices = [], supportServices = [], token, toEthTime } = useApp();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [submittedBookingId, setSubmittedBookingId] = useState<string | null>(null);
  
  const initialVenueId = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      return params.get('venueId') || hashParams.get('venueId') || '';
    } catch {
      return '';
    }
  }, []);

  const [form, setForm] = useState({
    venueId: initialVenueId,
    eventTitle: '', eventDescription: '', 
    organizerName: user?.name || '', 
    organizerOrganization: '', 
    organizerEmail: user?.email || '', 
    organizerPhone: user?.phone || '',
    startDate: '', endDate: '', participantCount: '', 
    technicalServices: [] as string[], supportServices: [] as string[],
    dailySchedules: [] as DailySchedule[], letterAttachment: null as File | null,
  });

  useEffect(() => {
    if (user?.name && !form.organizerName) {
      setForm(prev => ({
        ...prev,
        organizerName: user.name,
        organizerEmail: user.email || '',
        organizerPhone: user.phone || ''
      }));
    }
  }, [user]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPrivilegedUser = ['leadership', 'system_admin', 'event_management'].includes(user?.role || '');
  const availableVenues = venues || [];

  const getEthDateString = (gregStr: string) => {
    if (!gregStr) return '';
    try {
      const [y, m, d] = gregStr.split('-').map(Number);
      const gDate = new Date(y, m - 1, d, 12, 0, 0); 
      const ethDate = EthDateTime.fromEuropeanDate(gDate);
      return `${ETH_MONTHS[ethDate.month - 1]} ${ethDate.date}, ${ethDate.year}`;
    } catch { return gregStr; }
  };

  const selectedVenue = venues?.find(v => v.id?.toString() === form.venueId?.toString());

  const isServiceIncluded = (type: 'technicalServices' | 'supportServices', serviceId: string) => {
    if (!selectedVenue || type === 'supportServices') return false;
    const includedIds = (selectedVenue.technicalServices || selectedVenue.technical_services || selectedVenue.includedServices || selectedVenue.included_services || []);
    return includedIds.map(String).includes(String(serviceId));
  };

  const existingSchedules = useMemo(() => {
    if (!form.venueId) return [];
    
    const vBookings = bookings?.filter(b => 
      b.venueId?.toString() === form.venueId?.toString() && 
      ['pending', 'management_approved', 'partial_paid', 'paid', 'approved', 'completed'].includes(b.status?.toLowerCase() || '')
    );
    
    const schedules: { date: string, start: string, end: string, isHard: boolean }[] = [];
    vBookings?.forEach(b => {
      const isHard = ['partial_paid', 'paid', 'approved', 'completed'].includes(b.status?.toLowerCase() || '');
      
      if (b.dailySchedules && b.dailySchedules.length > 0) {
        b.dailySchedules.forEach((ds: any) => schedules.push({ date: ds.date, start: ds.startTime, end: ds.endTime, isHard }));
      } else if (b.startDate && b.endDate) {
        try {
          const s = parseISO(b.startDate), e = parseISO(b.endDate);
          if (s <= e) eachDayOfInterval({start: s, end: e}).forEach(d => {
            schedules.push({ date: format(d, 'yyyy-MM-dd'), start: b.startTime || '01:00', end: b.endTime || '12:00', isHard });
          });
        } catch {}
      }
    });
    return schedules;
  }, [bookings, form.venueId]);

  const { hardBookedDates, partialBookedDates, softBookedDates } = useMemo(() => {
    const hardMap = new Map<string, any[]>();
    const softMap = new Map<string, any[]>();

    existingSchedules.forEach(s => {
      if (s.isHard) {
        if (!hardMap.has(s.date)) hardMap.set(s.date, []);
        hardMap.get(s.date)!.push(s);
      } else {
        if (!softMap.has(s.date)) softMap.set(s.date, []);
        softMap.get(s.date)!.push(s);
      }
    });

    const checkFullDayBlocked = (schedules: any[]) => {
      const DAY_START = 510; // 08:30
      const DAY_END = 1050;  // 17:30
      const blockedIntervals = schedules.map(ex => ({
        start: timeToMinutes(ex.start) - 60,
        end: timeToMinutes(ex.end) + 60
      })).sort((a, b) => a.start - b.start);

      const mergedBlocks: { start: number, end: number }[] = [];
      blockedIntervals.forEach(curr => {
        if (mergedBlocks.length === 0) mergedBlocks.push({ ...curr });
        else {
          const last = mergedBlocks[mergedBlocks.length - 1];
          if (curr.start <= last.end) last.end = Math.max(last.end, curr.end);
          else mergedBlocks.push({ ...curr });
        }
      });

      let currentStart = DAY_START;
      let hasAvailable = false;
      mergedBlocks.forEach(block => {
        if (block.start - currentStart >= 60) hasAvailable = true;
        currentStart = Math.max(currentStart, block.end);
      });
      if (DAY_END - currentStart >= 60) hasAvailable = true;

      return !hasAvailable;
    };

    const hardDates: Date[] = [];
    const partialDates: Date[] = [];
    const softDates: Date[] = [];

    Array.from(hardMap.keys()).forEach(dateStr => {
      if (checkFullDayBlocked(hardMap.get(dateStr)!)) {
        hardDates.push(parseISO(dateStr));
      } else {
        partialDates.push(parseISO(dateStr));
      }
    });

    Array.from(softMap.keys()).forEach(dateStr => {
      if (!hardMap.has(dateStr)) {
        softDates.push(parseISO(dateStr));
      }
    });

    return { hardBookedDates: hardDates, partialBookedDates: partialDates, softBookedDates: softDates };
  }, [existingSchedules]);

  const dailyConflicts = useMemo(() => {
    const issues: { date: string, type: 'hard_overlap' | 'soft_overlap' | 'cleaning', msg: string }[] = [];
    
    form.dailySchedules?.forEach(newSched => {
      const dayExisting = existingSchedules.filter(ex => ex.date === newSched.date);
      
      const nStart = timeToMinutes(newSched.startTime || '08:30');
      const nEnd = timeToMinutes(newSched.endTime || '17:30');
      
      let hasHard = false;
      let hasSoft = false;
      let cleanMsg = '';

      dayExisting.forEach(ex => {
        const eStart = timeToMinutes(ex.start);
        const eEnd = timeToMinutes(ex.end);
        
        if (nStart < eEnd && nEnd > eStart) {
          if (ex.isHard) hasHard = true;
          else hasSoft = true;
        } else {
          const gapAfter = nStart - eEnd;
          const gapBefore = eStart - nEnd;
          if (gapAfter >= 0 && gapAfter < 60) cleanMsg = `1-Hour Cleaning Gap required after ${ex.end}`;
          else if (gapBefore >= 0 && gapBefore < 60) cleanMsg = `1-Hour Cleaning Gap required before ${ex.start}`;
        }
      });

      if (hasHard || (newSched.allDay && dayExisting.some(ex => ex.isHard))) {
         issues.push({ date: newSched.date, type: 'hard_overlap', msg: 'Unavailable (Already Confirmed/Paid)' });
      } else if (hasSoft || (newSched.allDay && dayExisting.some(ex => !ex.isHard))) {
         issues.push({ date: newSched.date, type: 'soft_overlap', msg: 'Unpaid Pending Request Exists (First to pay secures slot)' });
      } else if (cleanMsg) {
         issues.push({ date: newSched.date, type: 'cleaning', msg: cleanMsg });
      }
    });
    return issues;
  }, [form.dailySchedules, existingSchedules]);

  const getAvailableSlots = (dateStr: string) => {
    const dayExisting = existingSchedules.filter(ex => ex.date === dateStr);
    if (dayExisting.length === 0) {
      return [{ start: '08:30', end: '17:30' }];
    }

    const DAY_START = 510; // 08:30
    const DAY_END = 1050;  // 17:30

    const blockedIntervals: { start: number, end: number }[] = [];
    dayExisting.forEach(ex => {
      const eStart = timeToMinutes(ex.start);
      const eEnd = timeToMinutes(ex.end);
      blockedIntervals.push({
        start: eStart - 60,
        end: eEnd + 60
      });
    });

    blockedIntervals.sort((a, b) => a.start - b.start);

    const mergedBlocks: { start: number, end: number }[] = [];
    blockedIntervals.forEach(curr => {
      if (mergedBlocks.length === 0) {
        mergedBlocks.push({ ...curr });
      } else {
        const last = mergedBlocks[mergedBlocks.length - 1];
        if (curr.start <= last.end) {
          last.end = Math.max(last.end, curr.end);
        } else {
          mergedBlocks.push({ ...curr });
        }
      }
    });

    const available: { start: number, end: number }[] = [];
    let currentStart = DAY_START;

    mergedBlocks.forEach(block => {
      if (block.start > currentStart) {
        if (block.start - currentStart >= 60) {
          available.push({ start: currentStart, end: Math.min(DAY_END, block.start) });
        }
      }
      currentStart = Math.max(currentStart, block.end);
    });

    if (DAY_END - currentStart >= 60) {
      available.push({ start: currentStart, end: DAY_END });
    }

    const minutesToTime = (mins: number) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    return available.map(slot => ({
      start: minutesToTime(slot.start),
      end: minutesToTime(slot.end)
    }));
  };

  useEffect(() => {
    if (form.startDate && form.endDate && form.endDate >= form.startDate) {
      const dates = [];
      const [sy, sm, sd] = form.startDate.split('-').map(Number);
      const [ey, em, ed] = form.endDate.split('-').map(Number);
      let cur = new Date(sy, sm - 1, sd, 12, 0, 0); 
      const end = new Date(ey, em - 1, ed, 12, 0, 0); 
      while (cur <= end && dates.length < 30) {
        dates.push(format(cur, 'yyyy-MM-dd'));
        cur.setDate(cur.getDate() + 1);
      }
      setForm(prev => ({
        ...prev,
        dailySchedules: dates.map(d => prev.dailySchedules?.find(s => s.date === d) || { date: d, startTime: '08:30', endTime: '17:30', allDay: false })
      }));
    }
  }, [form.startDate, form.endDate]);

  const updateSchedule = (index: number, field: keyof DailySchedule, value: string | boolean) => {
    setForm(prev => {
      const news = [...prev.dailySchedules];
      news[index] = { ...news[index], [field]: value };
      return { ...prev, dailySchedules: news };
    });
  };

  const vPrice = parseFloat(selectedVenue?.price || selectedVenue?.daily_rate || selectedVenue?.cost || 0);
  const venueTotal = vPrice * (form.dailySchedules?.length || 1);
  
  const techFee = form.technicalServices.reduce((sum, id) => {
    const s = technicalServices.find(x => x.id?.toString() === id?.toString());
    return s ? sum + parseFloat(s.price || 0) : sum;
  }, 0);
  const suppFee = form.supportServices.reduce((sum, id) => {
    const s = supportServices.find(x => x.id?.toString() === id?.toString());
    return s ? sum + parseFloat(s.price || 0) : sum;
  }, 0);
  const serviceFee = techFee + suppFee;

  const validateStep = (step: number) => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.organizerName?.trim()) errs.organizerName = 'Required';
      if (!form.eventTitle?.trim()) errs.eventTitle = 'Required';
      if (!form.organizerPhone?.trim() || form.organizerPhone.trim() === '+251') errs.organizerPhone = 'Required';
      if (!form.organizerEmail?.trim()) errs.organizerEmail = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.organizerEmail)) errs.organizerEmail = 'Invalid email';
    } else if (step === 2) {
      if (!form.venueId) errs.venueId = 'Select a venue';
      
      if (!form.startDate || !form.endDate) {
        errs.startDate = 'Start and End dates are required';
      }
      
      if (!form.participantCount || isNaN(parseInt(form.participantCount)) || parseInt(form.participantCount) <= 0) {
        errs.participantCount = 'Required';
      } else if (selectedVenue && parseInt(form.participantCount) > selectedVenue.capacity) {
        errs.participantCount = `Max: ${selectedVenue.capacity} allowed`;
      }

      if (dailyConflicts.some(c => c.type === 'hard_overlap' || c.type === 'cleaning')) {
        errs.rangeConflict = 'Please resolve hard time conflicts below.';
      }
    } else if (step === 3) {
      if (!form.letterAttachment) {
        toast.error("Please attach an official request letter (PDF) to proceed.");
        return false;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const generateHourOptions = () => {
    const options = [];
    for (let h = 8; h <= 17; h++) {
      for (let m of ['00', '30']) {
        if (h === 8 && m === '00') continue;
        const timeStr = h.toString().padStart(2, '0') + ':' + m;
        options.push(<option key={timeStr} value={timeStr}>{toEthTime(timeStr)}</option>);
      }
    }
    return options;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const finalTotal = venueTotal + serviceFee;

      const payload = {
        ...form, 
        status: 'pending', // FORCE PENDING REVIEW
        name: form.organizerName,
        full_name: form.organizerName,
        organizer_name: form.organizerName,
        organizerName: form.organizerName,
        email: form.organizerEmail,
        contact_email: form.organizerEmail,
        organizer_email: form.organizerEmail,
        organizerEmail: form.organizerEmail,
        phone: form.organizerPhone,
        contact_phone: form.organizerPhone,
        organizer_phone: form.organizerPhone,
        organization: form.organizerOrganization,
        organizer_organization: form.organizerOrganization,
        totalPrice: finalTotal,
        total_price: finalTotal,
        venueId: form.venueId,
        venue: form.venueId,
        eventTitle: form.eventTitle, 
        event_title: form.eventTitle,
        eventDescription: form.eventDescription,
        event_description: form.eventDescription,
        startDate: form.startDate,
        start_date: form.startDate,
        endDate: form.endDate,
        end_date: form.endDate,
        participantCount: parseInt(form.participantCount) || 0,
        participant_count: parseInt(form.participantCount) || 0,
        technicalServices: form.technicalServices,
        technical_services: form.technicalServices,
        supportServices: form.supportServices,
        support_services: form.supportServices,
      };

      const data = await addBooking(payload);
      setSubmittedBookingId(data.id || 'SUCCESS');
    } catch (err: any) {
      const msg = err?.message || 'Submission failed. Please try again.';
      setSubmitError(msg);
      // Scroll to the top of the form so the error is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleService = (type: 'technicalServices' | 'supportServices', id: string) => {
    const strId = id.toString();
    setForm(prev => ({ ...prev, [type]: prev[type].includes(strId) ? prev[type].filter(s => s !== strId) : [...prev[type], strId] }));
  };

  const inputClass = (f: string) => `w-full text-sm border-2 rounded-xl px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all focus:ring-4 focus:ring-[#268053]/10 outline-none ${errors[f] ? 'border-red-300 focus:border-red-400 bg-red-50/20' : 'border-slate-100 focus:border-[#268053]'}`;

  if (submittedBookingId) {
    const isGuest = !token;

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 text-center">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 md:p-12 border border-slate-100 max-w-lg w-full relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1b5e3a] to-[#268053]" />
           <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto mb-6 animate-in zoom-in duration-500 drop-shadow-sm" />
           <h2 className="text-4xl font-black text-slate-800 mb-2 uppercase tracking-tight">Request Submitted!</h2>
           
           <p className="text-slate-500 font-bold text-sm mb-6 leading-relaxed px-4">
             Your slot is reserved under <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Admin Review</span>.<br/> You will be notified upon confirmation.
           </p>

           <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 mb-10 shadow-inner">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Tracking Reference</p>
             <p className="text-3xl font-black text-[#268053] tracking-wider select-all cursor-text mb-1">
               MOA-BKG-{submittedBookingId}
             </p>
             {isGuest && (
               <p className="text-[11px] font-bold text-amber-600 mt-3 animate-pulse bg-amber-50 py-1.5 rounded-lg">
                 ⚠️ Please copy and save this ID to track your request.
               </p>
             )}
           </div>

           <Button onClick={onComplete} className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1 hover:scale-[1.02]">
             {isGuest ? 'Track Your Status' : 'Return to Dashboard'}
           </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#f8fafc] ${hideHero ? '' : '-mt-8 -mx-4'}`}>
      {!hideHero && (
        <div className="bg-gradient-to-b from-[#0f241a] to-[#153a29] pt-24 pb-28 text-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <CalendarIcon className="w-16 h-16 text-emerald-400 mx-auto mb-6 opacity-80" />
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter drop-shadow-lg">Facility Reservation</h1>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 -mt-16 mb-20 relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-slate-100/50 backdrop-blur-xl">
          
          <div className="relative flex justify-center items-center gap-4 sm:gap-12 mb-12">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full" />
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-3 bg-white px-2 cursor-pointer" onClick={() => currentStep > s.num && setCurrentStep(s.num)}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 shadow-sm ${currentStep === s.num ? 'bg-gradient-to-br from-[#268053] to-[#1b5e3a] text-white scale-110 shadow-emerald-500/30' : currentStep > s.num ? 'bg-emerald-50 text-[#268053] border-2 border-emerald-200' : 'bg-slate-50 text-slate-300 border-2 border-slate-100'}`}>{s.num}</div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep === s.num ? 'text-[#268053]' : currentStep > s.num ? 'text-slate-600' : 'text-slate-300'}`}>{s.label}</span>
              </div>
            ))}
          </div>

          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-black uppercase mb-2 block tracking-widest">Full Name *</label>
                  <input value={form.organizerName} onChange={e => setForm(p => ({ ...p, organizerName: e.target.value }))} className={inputClass('organizerName')} placeholder="e.g. Abebe Kebede" />
                  {errors.organizerName && <p className="text-xs text-red-500 mt-1 font-bold">{errors.organizerName}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-black uppercase mb-2 block tracking-widest">Organization/Department *</label>
                  <input value={form.organizerOrganization} onChange={e => setForm(p => ({ ...p, organizerOrganization: e.target.value }))} className={inputClass('organizerOrganization')} placeholder="Organization Name" />
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-black uppercase mb-2 block tracking-widest">Official Email *</label>
                  <input type="email" value={form.organizerEmail} onChange={e => setForm(p => ({ ...p, organizerEmail: e.target.value }))} className={inputClass('organizerEmail')} placeholder="name@domain.com" />
                  {errors.organizerEmail && <p className="text-xs text-red-500 mt-1 font-bold">{errors.organizerEmail}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-black uppercase mb-2 block tracking-widest">Phone Number *</label>
                  <div className="flex items-stretch">
                    <div className="flex items-center justify-center px-4 bg-slate-100 border-2 border-r-0 border-slate-100 rounded-l-xl text-slate-700 font-bold text-xs shrink-0">
                      ET +251
                    </div>
                    <input 
                      value={form.organizerPhone.startsWith('+251') ? form.organizerPhone.substring(4).trim() : form.organizerPhone} 
                      onChange={e => setForm(p => ({ ...p, organizerPhone: '+251 ' + e.target.value.replace(/^\+251\s*/, '') }))} 
                      className={inputClass('organizerPhone').replace('rounded-xl', 'rounded-r-xl rounded-l-none')} 
                      placeholder="911 23 45 67" 
                    />
                  </div>
                  {errors.organizerPhone && <p className="text-xs text-red-500 mt-1 font-bold">{errors.organizerPhone}</p>}
                </div>
              </div>
              <hr className="border-slate-100" />
              <div>
                <label className="text-xs font-medium text-black uppercase mb-2 block tracking-widest">Event/Theme *</label>
                <input value={form.eventTitle} onChange={e => setForm(p => ({ ...p, eventTitle: e.target.value }))} className={inputClass('eventTitle')} placeholder="Annual Review Meeting 2026" />
                {errors.eventTitle && <p className="text-xs text-red-500 mt-1 font-bold">{errors.eventTitle}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-black uppercase mb-2 block tracking-widest">Description</label>
                <textarea rows={3} value={form.eventDescription} onChange={e => setForm(p => ({ ...p, eventDescription: e.target.value }))} className={inputClass('eventDescription')} placeholder="Briefly describe the purpose of this booking..." />
              </div>

              <Button onClick={() => validateStep(1) && setCurrentStep(2)} className="w-full h-14 bg-gradient-to-r from-[#1b5e3a] to-[#268053] hover:from-[#15472c] hover:to-[#1b5e3a] text-white rounded-xl font-black tracking-widest uppercase shadow-xl shadow-emerald-900/20 transition-all hover:-translate-y-1">CONTINUE TO VENUE</Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="grid sm:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-xs font-medium text-black uppercase block mb-2 tracking-widest flex items-center gap-2"><Building2 size={14}/> Venue Selection *</label>
                <select value={form.venueId} onChange={e => setForm(p => ({ ...p, venueId: e.target.value }))} className={inputClass('venueId')}>
                  <option value="">Select a hall...</option>
                  {/* --- FIXED: Uses availableVenues to show all, but disables VIP for unprivileged users --- */}
                  {availableVenues?.map(v => {
                    const isOutOfOrder = v.status === 'out_of_order';
                    
                    return (
                      <option 
                        key={v.id} 
                        value={v.id} 
                        disabled={isOutOfOrder}
                        className={isOutOfOrder ? 'text-red-500 font-bold bg-red-50' : ''}
                      >
                        {v.name} (Max: {v.capacity}) {isOutOfOrder ? ' ❌ [OUT OF ORDER]' : ''}
                      </option>
                    )
                  })}
                </select>
                </div>
                <div>
                  <label className={`text-xs font-medium uppercase block mb-2 tracking-widest flex items-center gap-2 transition-colors ${errors.participantCount ? 'text-red-600 animate-pulse' : 'text-black'}`}>
                    <Users size={14}/> Expected Max *
                    {errors.participantCount && <span className="text-[9px] bg-red-100 px-2 py-0.5 rounded text-red-700 ml-auto font-bold">{errors.participantCount}</span>}
                  </label>
                  <input type="number" min="1" value={form.participantCount} onChange={e => setForm(p => ({ ...p, participantCount: e.target.value }))} className={`${inputClass('participantCount')} ${errors.participantCount ? 'border-red-400 bg-red-50 text-red-900 ring-4 ring-red-500/20' : ''}`} placeholder="Number of attendees" />
                </div>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row gap-8 shadow-sm">
                <div className="bg-slate-50/80 p-4 rounded-2xl flex justify-center border border-slate-100">
                  <EthiopianCalendar 
                    selected={{ from: form.startDate ? parseISO(form.startDate) : undefined, to: form.endDate ? parseISO(form.endDate) : undefined }} 
                    onSelect={(r) => {
                      if (r?.from) {
                        const today = startOfDay(new Date());
                        const selectedDate = startOfDay(r.from);
                        
                        if (selectedDate < today) {
                          toast.error("You cannot book a date in the past.");
                          return; 
                        }
                      }
                      setForm(p => ({ ...p, startDate: r?.from ? format(r.from, 'yyyy-MM-dd') : '', endDate: r?.to ? format(r.to, 'yyyy-MM-dd') : '' }))
                    }} 
                    bookedDates={hardBookedDates}
                    partialBookedDates={partialBookedDates}
                    pendingDates={softBookedDates}
                  />
                </div>
                <div className="flex-1 space-y-4 flex flex-col justify-center">
                  <div className={`p-4 border-2 rounded-xl bg-white text-sm font-black uppercase tracking-widest flex justify-between items-center shadow-sm ${errors.startDate ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}>
                    <span className="text-slate-300">START</span> 
                    <span className="text-[#268053]">
                      {form.startDate ? getEthDateString(form.startDate) : '---'}
                    </span>
                  </div>
                  <div className={`p-4 border-2 rounded-xl bg-white text-sm font-black uppercase tracking-widest flex justify-between items-center shadow-sm ${errors.startDate ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}>
                    <span className="text-slate-300">END</span> 
                    <span className="text-[#268053]">
                      {form.endDate ? getEthDateString(form.endDate) : '---'}
                    </span>
                  </div>
                  {errors.startDate && (
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest text-center">{errors.startDate}</p>
                  )}
                  {errors.rangeConflict && (
                    <div className="bg-red-50 border-2 border-red-200 p-3 rounded-xl text-center shadow-inner animate-in pop-in">
                       <p className="text-xs text-red-700 font-black uppercase tracking-widest flex items-center justify-center gap-2"><ShieldAlert size={14}/> Please resolve time conflicts below</p>
                    </div>
                  )}
                </div>
              </div>

              {form.dailySchedules?.length > 0 && (
                <div className="space-y-3 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                  <p className="text-xs font-medium text-black uppercase tracking-widest mb-2">Time Adjustments per Day</p>
                  {form.dailySchedules.map((s, idx) => {
                    const conflict = dailyConflicts.find(c => c.date === s.date);
                    const dayExisting = existingSchedules.filter(ex => ex.date === s.date);
                    const dayAvailable = getAvailableSlots(s.date);
                    return (
                      <div key={s.date} className={`flex flex-col border-2 p-3 sm:p-4 rounded-xl transition-all shadow-sm ${conflict ? (conflict.type === 'hard_overlap' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200') : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
                        {/* Date label */}
                        <span className="text-[11px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-2 mb-3">
                          <Clock size={13} className="text-emerald-500 shrink-0"/> {getEthDateString(s.date)}
                        </span>

                        {/* Controls row — wraps on small screens */}
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                            <input type="checkbox" checked={s.allDay || false} onChange={e => updateSchedule(idx, 'allDay', e.target.checked)} className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">All Day</span>
                          </label>

                          {!s.allDay ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <select value={s.startTime?.substring(0, 5)} onChange={e => updateSchedule(idx, 'startTime', e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-bold p-1.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20">{generateHourOptions()}</select>
                              <span className="text-[10px] text-slate-300 font-black">TO</span>
                              <select value={s.endTime?.substring(0, 5)} onChange={e => updateSchedule(idx, 'endTime', e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-bold p-1.5 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20">{generateHourOptions()}</select>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-md uppercase tracking-widest whitespace-nowrap">Full Day Locked</span>
                          )}
                        </div>

                        {/* Available & Booked Slots row */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                          {dayExisting.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">Booked Slots:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {dayExisting.map((ex, bIdx) => (
                                    <span key={bIdx} className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                      {toEthTime(ex.start)} - {toEthTime(ex.end)} ({ex.start} - {ex.end})
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">Available Slots:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {dayAvailable.length > 0 ? (
                                    dayAvailable.map((slot, aIdx) => (
                                      <span key={aIdx} className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                        {toEthTime(slot.start)} - {toEthTime(slot.end)} ({slot.start} - {slot.end})
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded uppercase tracking-wider">
                                      Fully Booked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">Available Slots:</span>
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                All Day (2:30 Morning - 11:30 Afternoon / 08:30 - 17:30)
                              </span>
                            </div>
                          )}
                        </div>

                        {conflict && (
                          <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-start gap-2 animate-in fade-in">
                            {conflict.type === 'hard_overlap' ? <ShieldAlert size={13} className="text-red-500 shrink-0 mt-0.5" /> : <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />}
                            <p className={`text-[10px] font-black uppercase tracking-widest leading-relaxed ${conflict.type === 'hard_overlap' ? 'text-red-600' : 'text-amber-600'}`}>{conflict.msg}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button onClick={() => setCurrentStep(1)} className="font-black text-slate-400 hover:text-slate-600 uppercase text-xs tracking-widest transition-colors">Back</button>
                <Button onClick={() => validateStep(2) && setCurrentStep(3)} className="px-12 h-14 bg-gradient-to-r from-[#1b5e3a] to-[#268053] hover:from-[#15472c] hover:to-[#1b5e3a] text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all hover:-translate-y-1">CONTINUE TO SERVICES</Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="grid md:grid-cols-2 gap-10">
                {['Technical', 'Hospitality'].map((l, i) => {
                  const list = i === 0 ? technicalServices : [];
                  const formList = i === 0 ? form.technicalServices : form.supportServices;
                  const type = i === 0 ? 'technicalServices' : 'supportServices';
                  
                  return (
                    <div key={l} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-xs font-medium text-black uppercase mb-4 tracking-widest flex items-center gap-2">
                        {i === 0 ? <MonitorSmartphone className="text-blue-500"/> : <Coffee className="text-amber-500"/>} 
                        {l} Support
                      </p>
                      {i === 0 && (
                        <div className="grid gap-3">
                          {list && list.length > 0 ? (
                            list.map(s => {
                              const isIncluded = isServiceIncluded(type, s.id?.toString());
                              const isSelected = formList.includes(s.id?.toString());
                              
                              return (
                                <div 
                                  key={s.id} 
                                  onClick={() => !isIncluded && toggleService(type, s.id?.toString())} 
                                  className={`p-4 border-2 rounded-xl flex justify-between items-center transition-all duration-300 ${
                                    isIncluded
                                      ? 'border-emerald-200 bg-emerald-50/40 opacity-90 cursor-not-allowed'
                                      : isSelected 
                                        ? 'border-[#268053] bg-emerald-50/50 shadow-md shadow-emerald-500/10 scale-[1.02] cursor-pointer' 
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isIncluded || isSelected ? 'bg-[#268053] border-[#268053]' : 'border-slate-300'}`}>
                                      {(isIncluded || isSelected) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-tight ${isIncluded || isSelected ? 'text-emerald-900' : 'text-slate-600'}`}>
                                      {s.name}
                                    </span>
                                  </div>
                                  
                                  {isIncluded ? (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-widest">
                                      <Lock size={10} /> Included
                                    </span>
                                  ) : null}
                                </div>
                              )
                            })
                          ) : (
                            <div className="text-[10px] font-bold text-slate-400 italic py-4 flex items-center gap-2 animate-pulse">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                              Checking available services...
                            </div>
                          )}
                        </div>
                      )}

                      {i === 1 && (
                        <div className="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 shadow-inner">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                              <Coffee size={20} />
                            </div>
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-widest text-slate-800 leading-tight">
                                Coffee Break Snacks &amp; Lunch Catering
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">
                                For coffee break snacks and lunch catering, please contact:
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <div className="bg-white border-2 border-slate-100/50 rounded-xl p-3 flex items-center gap-3 group hover:border-emerald-200 transition-all shadow-sm">
                              <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
                                <Utensils size={16} />
                              </div>
                              <div className="flex flex-wrap items-center justify-between flex-1 gap-2">
                                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Mama's Kitchen (MOACC):</span>
                                <a href="tel:+251911234567" className="bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2 hover:bg-emerald-100 transition-colors shadow-sm">
                                  <Phone size={12} className="shrink-0" />
                                  <span className="text-[10px] font-black tracking-wider whitespace-nowrap">+251 911 234 567</span>
                                </a>
                              </div>
                            </div>

                            <div className="bg-white border-2 border-slate-100/50 rounded-xl p-3 flex items-center gap-3 group hover:border-emerald-200 transition-all shadow-sm">
                              <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
                                <Coffee size={16} />
                              </div>
                              <div className="flex flex-wrap items-center justify-between flex-1 gap-2">
                                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">MAO Coffee (MOACC):</span>
                                <a href="tel:+251911987654" className="bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2 hover:bg-emerald-100 transition-colors shadow-sm">
                                  <Phone size={12} className="shrink-0" />
                                  <span className="text-[10px] font-black tracking-wider whitespace-nowrap">+251 911 987 654</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div onClick={() => document.getElementById('contract-upload')?.click()} className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center cursor-pointer bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all group shadow-inner">
                <input id="contract-upload" type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && setForm(p => ({ ...p, letterAttachment: e.target.files![0] }))} />
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Paperclip className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-sm font-black text-slate-600 uppercase tracking-widest">{form.letterAttachment ? form.letterAttachment.name : 'Attach Official Request (PDF)'}</p>
                <p className="text-xs font-medium text-black mt-2 uppercase tracking-widest">Required for Internal organizers</p>
              </div>
              <div className="flex justify-between pt-6 border-t border-slate-100">
                <button onClick={() => setCurrentStep(2)} className="font-black text-slate-400 hover:text-slate-600 uppercase text-xs tracking-widest transition-colors">Back</button>
                <Button onClick={() => validateStep(3) && setCurrentStep(4)} className="px-12 h-14 bg-gradient-to-r from-[#1b5e3a] to-[#268053] hover:from-[#15472c] hover:to-[#1b5e3a] text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all hover:-translate-y-1">FINAL REVIEW</Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="grid lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 shadow-sm relative">
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#f8fafc] rounded-full border-r-2 border-b-2 border-slate-200" />
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#f8fafc] rounded-full border-l-2 border-b-2 border-slate-200" />
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#f8fafc] rounded-full border-r-2 border-t-2 border-slate-200" />
                  <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#f8fafc] rounded-full border-l-2 border-t-2 border-slate-200" />
                  
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b-2 border-dashed border-slate-100 pb-4 mb-6 flex items-center gap-2"><Receipt size={14}/> OFFICIAL RECAP</p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest"><span className="text-slate-400">Venue:</span><span className="text-slate-800 bg-slate-100 px-3 py-1 rounded-md">{selectedVenue?.name}</span></div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest"><span className="text-slate-400">Dates:</span><span className="text-slate-800">{getEthDateString(form.startDate)} - {getEthDateString(form.endDate)}</span></div>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest"><span className="text-slate-400">Max:</span><span className="text-[#268053] bg-emerald-50 px-3 py-1 rounded-md">{form.participantCount} Guests</span></div>
                  </div>

                  <div className="pt-6 border-t-2 border-dashed border-slate-100">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Requested Enhancements</p>
                     
                     <div className="flex flex-wrap gap-2">
                        {form.technicalServices.length === 0 && form.supportServices.length === 0 ? <span className="text-xs italic text-slate-400">No extra services selected.</span> : null}
                        
                        {form.technicalServices.map(id => {
                          const s = technicalServices.find(x => x.id?.toString() === id?.toString());
                          return <span key={`tech-${id}`} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-[10px] font-black uppercase tracking-tight rounded-lg text-blue-700 shadow-sm">{s?.name}</span>
                        })}

                        {form.supportServices.map(id => {
                          const s = supportServices.find(x => x.id?.toString() === id?.toString());
                          return <span key={`supp-${id}`} className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-[10px] font-black uppercase tracking-tight rounded-lg text-amber-700 shadow-sm">{s?.name}</span>
                        })}
                     </div>
                  </div>
                </div>

                <div className="bg-gradient-to-b from-[#0f241a] to-[#153a29] rounded-3xl p-8 text-white flex flex-col justify-center shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
                   <p className="text-[10px] font-black text-emerald-400 uppercase mb-8 tracking-widest flex items-center gap-2"><Sparkles size={14}/> REQUEST SUMMARY</p>
                   <div className="space-y-4 mb-8 opacity-80 text-xs font-bold uppercase tracking-widest">
                     <div className="flex justify-between border-b border-white/10 pb-4"><span>Duration</span><span>{form.dailySchedules?.length || 1} Day(s)</span></div>
                     <div className="flex justify-between border-b border-white/10 pb-4"><span>Extra Services</span><span>{form.technicalServices.length + form.supportServices.length}</span></div>
                   </div>
                   <div className="mt-auto pt-4 flex flex-col items-start gap-2">
                     <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">PENDING ADMIN APPROVAL</span>
                     <span className="text-sm font-bold text-white/70 leading-relaxed">Pricing will be confirmed by the finance office upon approval.</span>
                   </div>
                </div>
              </div>
              
              <div className="mt-12 flex flex-col gap-4 pt-6 border-t border-slate-100">
                {submitError && (
                  <div className="flex items-start gap-3 bg-red-50 border-2 border-red-300 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-red-700 uppercase tracking-wide mb-1">Booking Rejected</p>
                      <p className="text-sm text-red-600 font-medium leading-relaxed">{submitError}</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-between w-full">
                  <button onClick={() => setCurrentStep(3)} className="font-black text-slate-400 hover:text-slate-600 uppercase text-xs tracking-widest transition-colors">Back</button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="px-16 h-16 bg-gradient-to-r from-[#1b5e3a] to-[#268053] hover:from-[#15472c] hover:to-[#1b5e3a] text-white text-lg rounded-2xl font-black shadow-2xl shadow-emerald-900/30 uppercase tracking-widest transition-all hover:-translate-y-1 hover:scale-105 active:scale-95 disabled:opacity-75 disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:from-[#268053] disabled:to-[#268053]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-3">
                        <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                        SUBMITTING...
                      </span>
                    ) : 'SUBMIT REQUEST'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}