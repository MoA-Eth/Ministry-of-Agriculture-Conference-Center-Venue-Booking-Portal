import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/app-context';
import { DailySchedule } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { Paperclip, Star, AlertTriangle, UserPlus, Info, Loader2, ArrowRight, Phone, Coffee, Utensils } from 'lucide-react';
import { EthiopianCalendar, ETH_MONTHS } from '@/components/ui/ethiopian-calendar';
import { EthDateTime } from 'ethiopian-calendar-date-converter';

const steps = [
  { num: 1, label: 'VIP DETAILS' },
  { num: 2, label: 'VENUE' },
  { num: 3, label: 'SERVICES' },
  { num: 4, label: 'FINISH' },
];

const timeToMinutes = (timeStr: string | undefined) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export default function VIPBookingForm({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const { user, bookings, venues, addBooking, refreshData, technicalServices, supportServices, servicePrices, toEthTime } = useApp();
  
  useEffect(() => { refreshData(); }, [refreshData]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    venueId: '', eventTitle: '', eventDescription: '', organizerName: '', organizerOrganization: '', organizerEmail: '', organizerPhone: '',
    startDate: '', endDate: '', participantCount: '', technicalServices: [] as string[], supportServices: [] as string[],
    dailySchedules: [] as DailySchedule[], letterAttachment: null as File | null,
    status: 'pending', // FIXED: Starts as pending so it lands in the Admin Dashboard!
    asGuest: !user, 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clashWarning, setClashWarning] = useState<string | null>(null);
  const [submittedBookingId, setSubmittedBookingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getEthDateString = (gregStr: string) => {
    if (!gregStr) return '';
    try {
      const [y, m, d] = gregStr.split('-').map(Number);
      const gDate = new Date(y, m - 1, d, 12, 0, 0); 
      const ethDate = EthDateTime.fromEuropeanDate(gDate);
      return `${ETH_MONTHS[ethDate.month - 1]} ${ethDate.date}, ${ethDate.year}`;
    } catch { return gregStr; }
  };

  const selectedVenue = venues.find(v => v.id?.toString() === form.venueId?.toString());

  const bookedDates = useMemo(() => {
    if (!form.venueId) return [];
    const dates: Date[] = [];
    bookings.filter(b => b.venueId.toString() === form.venueId.toString() && b.status.toLowerCase() === 'approved')
    .forEach(b => {
      try {
        const start = parseISO(b.startDate); const end = parseISO(b.endDate);
        if (start && end && start <= end) dates.push(...eachDayOfInterval({ start, end }));
      } catch (e) {}
    });
    return dates;
  }, [bookings, form.venueId]);

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

  const dailyConflicts = useMemo(() => {
    const issues: { date: string, type: 'hard_overlap' | 'soft_overlap' | 'cleaning', msg: string }[] = [];
    
    form.dailySchedules?.forEach(newSched => {
      const dayExisting = existingSchedules.filter(ex => ex.date === newSched.date);
      
      const nStart = timeToMinutes(newSched.startTime || '09:00');
      const nEnd = timeToMinutes(newSched.endTime || '17:00');
      
      let hasHard = false;
      let cleanMsg = '';

      dayExisting.forEach(ex => {
        const eStart = timeToMinutes(ex.start);
        const eEnd = timeToMinutes(ex.end);
        
        if (nStart < eEnd && nEnd > eStart) {
          if (ex.isHard) hasHard = true;
        } else {
          const gapAfter = nStart - eEnd;
          const gapBefore = eStart - nEnd;
          if (gapAfter >= 0 && gapAfter < 60) cleanMsg = `1-Hour Cleaning Gap required after ${ex.end}`;
          else if (gapBefore >= 0 && gapBefore < 60) cleanMsg = `1-Hour Cleaning Gap required before ${ex.start}`;
        }
      });

      if (hasHard || (newSched.allDay && dayExisting.some(ex => ex.isHard))) {
         issues.push({ date: newSched.date, type: 'hard_overlap', msg: 'Unavailable (Already Confirmed/Paid)' });
      } else if (cleanMsg) {
         issues.push({ date: newSched.date, type: 'cleaning', msg: cleanMsg });
      }
    });
    return issues;
  }, [form.dailySchedules, existingSchedules]);

  useEffect(() => {
    if (form.startDate && form.endDate && form.endDate >= form.startDate) {
      const dates = [];
      const [sy, sm, sd] = form.startDate.split('-').map(Number);
      const [ey, em, ed] = form.endDate.split('-').map(Number);
      let currentDate = new Date(sy, sm - 1, sd, 12, 0, 0); 
      const end = new Date(ey, em - 1, ed, 12, 0, 0); 
      while (currentDate <= end && dates.length < 30) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      setForm(prev => {
        const newSchedules = dates.map(d => prev.dailySchedules.find(s => s.date === d) || { date: d, startTime: '09:00', endTime: '17:00', allDay: false });
        return { ...prev, dailySchedules: newSchedules };
      });
    }
  }, [form.startDate, form.endDate]);

  const isServiceIncluded = (type: 'technicalServices' | 'supportServices', serviceId: string) => {
    if (!selectedVenue || type === 'supportServices') return false;
    const includedIds = (selectedVenue.technicalServices || selectedVenue.technical_services || selectedVenue.includedServices || selectedVenue.included_services || []);
    return includedIds.map(String).includes(String(serviceId));
  };

  const serviceFee = useMemo(() => {
    return [...form.technicalServices, ...form.supportServices].reduce((sum, id) => sum + (servicePrices[[...technicalServices, ...supportServices].find(x => x.id?.toString() === id?.toString())?.name || ''] || 0), 0);
  }, [form.technicalServices, form.supportServices, technicalServices, supportServices, servicePrices]);

  const venueFee = (selectedVenue?.price || 0) * (form.dailySchedules.length || 1);
  const totalPayable = venueFee + serviceFee;

  const validateStep = (step: number) => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.organizerName.trim()) errs.organizerName = 'Name is required';
      if (!form.eventTitle.trim()) errs.eventTitle = 'Event Title is required';
      if (!form.organizerEmail.trim()) errs.organizerEmail = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.organizerEmail)) errs.organizerEmail = 'Invalid email';
    } else if (step === 2) {
      if (!form.venueId) errs.venueId = 'Please select a venue';
      
      if (!form.startDate || !form.endDate) {
         errs.startDate = 'Dates are required';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedStart = new Date(form.startDate);
        selectedStart.setHours(0, 0, 0, 0);
        if (selectedStart < today) {
          errs.startDate = 'Past dates cannot be booked';
        }
      }

      if (!form.participantCount || isNaN(parseInt(form.participantCount)) || parseInt(form.participantCount) <= 0) {
        errs.participantCount = 'Required';
      } else if (selectedVenue && parseInt(form.participantCount) > selectedVenue.capacity) {
        errs.participantCount = `Max: ${selectedVenue.capacity} allowed`;
      }

      setClashWarning(null);
      if (form.venueId && form.startDate && form.endDate && !errs.startDate) {
        const vipConflict = bookings.find(b => b.venueId.toString() === form.venueId.toString() && b.status.toLowerCase() === 'approved' && b.startDate <= form.endDate && b.endDate >= form.startDate);
        if (vipConflict) {
           errs.startDate = 'This date is already secured by another VIP Override.';
           toast.error('Another VIP has already secured these dates!');
        } else {
           const regConflict = bookings.find(b => b.venueId.toString() === form.venueId.toString() && ['pending', 'partial_paid', 'paid'].includes(b.status.toLowerCase()) && b.startDate <= form.endDate && b.endDate >= form.startDate);
           if (regConflict) {
              setClashWarning(`Warning: This VIP booking overlaps with "${regConflict.eventTitle || regConflict.event_title}". Proceeding will automatically cancel their booking.`);
           }
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm(prev => ({ ...prev, letterAttachment: file }));
  };

  const nextStep = () => { if (validateStep(currentStep)) { window.scrollTo(0, 0); setCurrentStep(p => Math.min(4, p + 1)); } };
  const prevStep = () => { window.scrollTo(0, 0); setCurrentStep(p => Math.max(1, p - 1)); };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;
    setIsSubmitting(true);
    try {
      const finalTotal = venueFee + serviceFee;

      const payload = {
        ...form, 
        status: 'pending', // FIXED: Send as pending so Admin sees it and can trigger the override
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
        eventTitle: `⭐ [VIP OVERRIDE] ${form.eventTitle}`, 
        event_title: `⭐ [VIP OVERRIDE] ${form.eventTitle}`,
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
      setSubmittedBookingId(data.id || data.reference_id || data.pk || 'UNKNOWN');
      toast.success('VIP Booking Requested Successfully!');
    } catch (error) { 
      toast.error('Submission error'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleService = (type: 'technicalServices' | 'supportServices', id: string) => {
    setForm(prev => ({ ...prev, [type]: prev[type].includes(id) ? prev[type].filter(s => s !== id) : [...prev[type], id] }));
  };

  const updateSchedule = (index: number, field: keyof DailySchedule, value: string | boolean) => {
    setForm(prev => {
      const newSchedules = [...prev.dailySchedules];
      newSchedules[index] = { ...newSchedules[index], [field]: value };
      return { ...prev, dailySchedules: newSchedules };
    });
  };

  const generateHourOptions = () => Array.from({ length: 9 }, (_, i) => {
    const hour = i + 9;
    const h = hour.toString().padStart(2, '0') + ':00'; 
    return <option key={h} value={h}>{toEthTime(h)}</option>;
  });

  const inputClass = (field: string) => `w-full text-sm border rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${errors[field] ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'}`;

  if (submittedBookingId) {
    return (
      <div className="max-w-xl mx-auto mt-16 bg-white rounded-[2rem] shadow-xl p-10 text-center border border-slate-100 animate-in zoom-in-95">
         <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
           <Star className="w-12 h-12 text-purple-600" />
         </div>
         <h2 className="text-3xl font-serif font-black text-slate-800 mb-3 tracking-tight">VIP Request Sent!</h2>
         <p className="text-slate-500 font-medium mb-8 text-sm">
           This event has been sent to the Admin Dashboard. Once approved by the administrator, any overlapping events will be automatically cancelled.
         </p>
         <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10 shadow-inner">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">VIP Booking Reference</p>
           <p className="text-3xl font-black text-purple-700 tracking-wider">MOA-BKG-{submittedBookingId}</p>
         </div>
         <Button onClick={() => window.location.reload()} className="w-full py-6 bg-[#111827] hover:bg-slate-800 text-white font-black rounded-xl uppercase tracking-widest">
           Return Home
         </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4" style={{ animation: 'fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
      
      {!user && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"><UserPlus size={24} className="text-emerald-400"/></div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Want to track and manage your bookings?</h3>
                <p className="text-sm text-slate-400">Register or Sign In to access your personal dashboard.</p>
              </div>
           </div>
           <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-xl font-black transition-colors whitespace-nowrap">
              Register / Sign In
           </button>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-900 to-purple-800 rounded-3xl p-8 mb-8 text-white shadow-xl flex items-center gap-6">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
          <Star className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase">VIP Priority Booking</h1>
          <p className="text-purple-200 font-medium text-sm mt-1">Submit a high-priority request for administrative override.</p>
        </div>
      </div>

      <div className="flex justify-center items-center gap-4 sm:gap-8 mb-8">
        {steps.map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setCurrentStep(s.num)}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep === s.num ? 'bg-purple-600 text-white shadow-md scale-110' : currentStep > s.num ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
              {s.num}
            </div>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${currentStep === s.num ? 'text-purple-600' : 'text-slate-400'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-purple-100">
        
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
               <h2 className="text-xl font-black text-slate-800">VIP Details</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Name *</label><input value={form.organizerName} onChange={e => setForm(p => ({ ...p, organizerName: e.target.value }))} className={inputClass('organizerName')} />{errors.organizerName && <p className="text-xs text-red-500 mt-1 font-bold">{errors.organizerName}</p>}</div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Organization / Ministry</label><input value={form.organizerOrganization} onChange={e => setForm(p => ({ ...p, organizerOrganization: e.target.value }))} className={inputClass('organizerOrganization')} /></div>
              <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Email *</label><input type="email" value={form.organizerEmail} onChange={e => setForm(p => ({ ...p, organizerEmail: e.target.value }))} className={inputClass('organizerEmail')} />{errors.organizerEmail && <p className="text-xs text-red-500 mt-1 font-bold">{errors.organizerEmail}</p>}</div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Phone *</label>
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
            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Event Title *</label><input value={form.eventTitle} onChange={e => setForm(p => ({ ...p, eventTitle: e.target.value }))} className={inputClass('eventTitle')} />{errors.eventTitle && <p className="text-xs text-red-500 mt-1 font-bold">{errors.eventTitle}</p>}</div>
            <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Description</label><textarea rows={3} value={form.eventDescription} onChange={e => setForm(p => ({ ...p, eventDescription: e.target.value }))} className={inputClass('eventDescription')} /></div>
            
            <Button onClick={nextStep} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 rounded-xl mt-4">Continue to Venue</Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-black text-slate-800 mb-6 pb-4 border-b border-slate-100">Select Venue & Override Date</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Venue *</label>
                <select value={form.venueId} onChange={e => setForm(p => ({ ...p, venueId: e.target.value }))} className={inputClass('venueId')}>
                  <option value="">Choose...</option>
                  {venues.map(v => {
                    // @ts-ignore
                    const isBroken = v.status === 'out_of_order';
                    return (
                      <option key={v.id} value={v.id} disabled={isBroken}>
                        {v.name} {isBroken ? ' (❌ OUT OF ORDER)' : ''}
                      </option>
                    )
                  })}
                </select>
                {errors.venueId && <p className="text-xs text-red-500 mt-1 font-bold">{errors.venueId}</p>}
              </div>
              <div>
                 <label className={`text-[10px] font-bold uppercase mb-2 block transition-colors ${errors.participantCount ? 'text-red-500' : 'text-slate-400'}`}>
                   Attendees * {errors.participantCount && <span className="text-red-500 ml-2">{errors.participantCount}</span>}
                 </label>
                 <input type="number" min="1" value={form.participantCount} onChange={e => setForm(p => ({ ...p, participantCount: e.target.value }))} className={inputClass('participantCount')} />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start bg-slate-50 p-6 rounded-2xl border border-slate-100">
               <EthiopianCalendar 
                 selected={{ from: form.startDate ? parseISO(form.startDate) : undefined, to: form.endDate ? parseISO(form.endDate) : undefined }} 
                 onSelect={(range) => {
                   if (range?.from) {
                     const today = startOfDay(new Date());
                     const selectedDate = startOfDay(range.from);
                     if (selectedDate < today) {
                       toast.error("You cannot book a date in the past.");
                       return;
                     }
                   }
                   setForm(p => ({ ...p, startDate: range?.from ? format(range.from, 'yyyy-MM-dd') : '', endDate: range?.to ? format(range.to, 'yyyy-MM-dd') : '' }))
                 }} 
                 bookedDates={bookedDates} 
               />
               <div className="flex-1 w-full space-y-4">
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Start Date</label>
                   <div className={`px-4 py-3 bg-white border rounded-lg text-sm font-bold ${errors.startDate ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 text-slate-700'}`}>
                     {form.startDate ? getEthDateString(form.startDate) : '...'}
                   </div>
                   {errors.startDate && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1 text-center">{errors.startDate}</p>}
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">End Date</label>
                   <div className={`px-4 py-3 bg-white border rounded-lg text-sm font-bold ${errors.startDate ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 text-slate-700'}`}>
                     {form.endDate ? getEthDateString(form.endDate) : '...'}
                   </div>
                 </div>
               </div>
            </div>

            {clashWarning && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex gap-3 animate-in pop-in">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">{clashWarning}</p>
              </div>
            )}

            {form.dailySchedules.map((schedule, idx) => {
              const conflict = dailyConflicts.find(c => c.date === schedule.date);
              
              return (
                <div key={schedule.date} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-100 p-4 rounded-xl bg-slate-50">
                  <span className="font-bold text-sm text-slate-700">{getEthDateString(schedule.date)}</span>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <select value={schedule.startTime.substring(0, 5)} onChange={e => updateSchedule(idx, 'startTime', e.target.value)} className="bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold">{generateHourOptions()}</select>
                      <span>to</span>
                      <select value={schedule.endTime.substring(0, 5)} onChange={e => updateSchedule(idx, 'endTime', e.target.value)} className="bg-white border border-slate-200 rounded px-2 py-1 text-sm font-bold">{generateHourOptions()}</select>
                    </div>

                    {conflict && conflict.type === 'cleaning' && (
                      <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest mt-1">
                        <Info size={12}/> {conflict.msg}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex gap-4 mt-4">
              <Button variant="outline" onClick={prevStep} className="flex-1 font-bold h-12 rounded-xl">Back</Button>
              <Button onClick={nextStep} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 rounded-xl">Continue</Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {technicalServices.map(s => {
                  const isIncluded = isServiceIncluded('technicalServices', s.id?.toString() || '');
                  const isSelected = form.technicalServices.includes(s.id?.toString() || '');
                  
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => !isIncluded && toggleService('technicalServices', s.id?.toString() || '')} 
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                        isIncluded 
                          ? 'border-emerald-200 bg-emerald-50/40 opacity-90 cursor-not-allowed'
                          : isSelected 
                            ? 'border-purple-600 bg-purple-50 shadow-md scale-[1.02] cursor-pointer' 
                            : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <p className={`text-xs font-black uppercase tracking-tight py-1 ${isIncluded || isSelected ? 'text-purple-900' : 'text-slate-600'}`}>
                        {s.name}
                      </p>
                      {isIncluded ? (
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                          Included in Hall
                        </p>
                      ) : null}
                    </div>
                  );
                })}
             </div>

             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-8 mb-4">Hospitality Services</h3>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {supportServices
                  .filter(s => s.name !== 'Coffee Break' && s.name !== 'Lunch Catering')
                  .map(s => (
                    <div key={s.id} onClick={() => toggleService('supportServices', s.id?.toString() || '')} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${form.supportServices.includes(s.id?.toString() || '') ? 'border-amber-600 bg-amber-50 shadow-md scale-[1.02]' : 'border-slate-100 hover:border-amber-200 hover:bg-slate-50'}`}>
                       <p className={`text-xs font-black uppercase tracking-tight py-1 ${form.supportServices.includes(s.id?.toString() || '') ? 'text-amber-900' : 'text-slate-600'}`}>{s.name}</p>
                    </div>
                  ))
                }
             </div>

             <div className="mt-12 p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 shadow-inner">
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
                 <div className="bg-white border-2 border-slate-50 rounded-xl p-3 flex items-center gap-3 group hover:border-purple-200 transition-all shadow-sm">
                   <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors shrink-0">
                     <Utensils size={16} />
                   </div>
                   <div className="flex flex-wrap items-center justify-between flex-1 gap-2">
                     <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Mama's Kitchen (MOACC):</span>
                     <a href="tel:+251911234567" className="bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-lg border border-purple-100 flex items-center gap-2 hover:bg-purple-100 transition-colors shadow-sm">
                       <Phone size={12} className="shrink-0" />
                       <span className="text-[10px] font-black tracking-wider whitespace-nowrap">+251 911 234 567</span>
                     </a>
                   </div>
                 </div>

                 <div className="bg-white border-2 border-slate-50 rounded-xl p-3 flex items-center gap-3 group hover:border-purple-200 transition-all shadow-sm">
                   <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors shrink-0">
                     <Coffee size={16} />
                   </div>
                   <div className="flex flex-wrap items-center justify-between flex-1 gap-2">
                     <span className="text-xs font-bold text-slate-700 whitespace-nowrap">MAO Coffee (MOACC):</span>
                     <a href="tel:+251911987654" className="bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-lg border border-purple-100 flex items-center gap-2 hover:bg-purple-100 transition-colors shadow-sm">
                       <Phone size={12} className="shrink-0" />
                       <span className="text-[10px] font-black tracking-wider whitespace-nowrap">+251 911 987 654</span>
                     </a>
                   </div>
                 </div>
               </div>
             </div>
             
             <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center mt-6 cursor-pointer hover:bg-slate-50" onClick={() => document.getElementById('file')?.click()}>
                <input id="file" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                <Paperclip className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-bold">{form.letterAttachment ? form.letterAttachment.name : 'Attach Official Mandate (Optional)'}</p>
                <p className="text-xs font-medium text-black mt-2 uppercase tracking-widest">Required for external organizers</p>
             </div>

             <div className="flex gap-4 mt-8">
              <Button variant="outline" onClick={prevStep} className="flex-1 font-bold h-12 rounded-xl">Back</Button>
              <Button onClick={nextStep} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 rounded-xl">Review</Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-purple-50 text-purple-900 rounded-2xl p-8 border border-purple-200">
               <h3 className="text-2xl font-black mb-4">Request VIP Override</h3>
               <p className="mb-2"><strong>Event:</strong> {form.eventTitle}</p>
               <p className="mb-6"><strong>Venue:</strong> {selectedVenue?.name}</p>
               <p className="mb-6 text-sm text-purple-700/70 italic">Pricing will be confirmed by the finance office upon approval.</p>
               
               <div className="flex gap-4">
                 <Button variant="outline" onClick={prevStep} disabled={isSubmitting} className="flex-1 bg-white font-bold h-14 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-100">Back</Button>
                 <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold h-14 rounded-xl shadow-xl shadow-purple-600/30">
                   {isSubmitting ? (
                     <span className="flex items-center gap-2">
                       <Loader2 className="w-5 h-5 animate-spin" />
                       SUBMITTING...
                     </span>
                   ) : (
                     'SUBMIT FOR ADMIN REVIEW'
                   )}
                 </Button>
               </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}