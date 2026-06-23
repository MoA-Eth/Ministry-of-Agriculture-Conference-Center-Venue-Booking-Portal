import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { format, parseISO } from 'date-fns';
import { Booking } from '@/lib/types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, User, CheckCircle2, Clock, Star, X as CloseIcon, Building, Mail, Phone, Clock3, AlertCircle, XCircle, FileText, Users } from 'lucide-react';
import { ETH_MONTHS } from '@/components/ui/ethiopian-calendar';
import { EthDateTime } from 'ethiopian-calendar-date-converter';

const ETH_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getEthDateString = (gregStr: string) => {
  if (!gregStr) return '';
  try {
    const [y, m, d] = gregStr.split('-').map(Number);
    const gDate = new Date(y, m - 1, d, 12, 0, 0); 
    const ethDate = EthDateTime.fromEuropeanDate(gDate);
    return `${ETH_MONTHS[ethDate.month - 1]} ${ethDate.date}, ${ethDate.year}`;
  } catch {
    return gregStr;
  }
};



// --- NEW: Dual Status Logic ---

const adminStatusConfig = {
  pending: { label: 'Pending Action', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', borderLeft: 'border-l-amber-500', icon: <Clock3 size={12} className="shrink-0 text-amber-600" /> },
  management_approved: { label: 'MoA Approved', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', borderLeft: 'border-l-teal-500', icon: <CheckCircle2 size={12} className="shrink-0 text-teal-600" /> },
  partial_paid: { label: 'Advance Paid', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', borderLeft: 'border-l-blue-500', icon: <Clock size={12} className="shrink-0 text-blue-600" /> },
  paid: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', borderLeft: 'border-l-[#268053]', icon: <CheckCircle2 size={12} className="shrink-0 text-emerald-600" /> },
  approved: { label: 'VIP Override', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', borderLeft: 'border-l-purple-500', icon: <Star size={12} className="shrink-0 text-purple-600" /> },
  completed: { label: 'Completed', color: 'text-slate-800', bg: 'bg-slate-200', border: 'border-slate-400', borderLeft: 'border-l-slate-600', icon: <CheckCircle2 size={12} className="shrink-0 text-slate-600" /> },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', borderLeft: 'border-l-red-500', icon: <XCircle size={12} className="shrink-0 text-red-600" /> },
  cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', borderLeft: 'border-l-slate-400', icon: <AlertCircle size={12} className="shrink-0 text-slate-500" /> }
};

const userStatusConfig = {
  tentative: { label: 'Tentative / Pending', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', borderLeft: 'border-l-amber-500', icon: <Clock size={12} className="shrink-0 text-amber-600" /> },
  confirmed: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', borderLeft: 'border-l-[#268053]', icon: <CheckCircle2 size={12} className="shrink-0 text-emerald-600" /> },
  cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', borderLeft: 'border-l-slate-400', icon: <AlertCircle size={12} className="shrink-0 text-slate-500" /> }
};

const getStatusProps = (status: string, isAdmin: boolean) => {
  const s = status?.toLowerCase() || '';
  if (isAdmin) {
    return adminStatusConfig[s as keyof typeof adminStatusConfig] || adminStatusConfig.pending;
  } else {
    if (['paid', 'approved', 'completed'].includes(s)) return userStatusConfig.confirmed;
    if (['pending', 'management_approved', 'partial_paid'].includes(s)) return userStatusConfig.tentative;
    return userStatusConfig.cancelled;
  }
};


// --- Modal Components ---

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusProps(status, true);
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm`}>
      {cfg.icon}
      {cfg.label}
    </div>
  );
}

function EventDetailsModal({ booking, onClose, toEthTime }: { booking: Booking, onClose: () => void, toEthTime: any }) {
  const { venues, technicalServices, supportServices } = useApp();
  const venue = venues.find(v => v.id === booking.venueId);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      {/* MOBILE RESPONSIVE MODAL WRAPPER */}
      <div className="bg-white w-[95%] max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="relative h-32 sm:h-40 shrink-0">
           <div className="absolute inset-0 bg-gradient-to-br from-[#1b4332] to-[#268053]" />
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
           
           <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md flex items-center justify-center transition-all z-10">
             <CloseIcon size={20} />
           </button>

           <div className="absolute bottom-4 left-6 sm:bottom-6 sm:left-8 z-10">
              <StatusBadge status={booking.status} />
              <h2 className="text-xl sm:text-3xl font-serif font-black text-white mt-2 sm:mt-3 tracking-tight drop-shadow-sm uppercase line-clamp-1 pr-12">{booking.eventTitle}</h2>
           </div>
        </div>

        {/* Modal Content - Expanded Details */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 font-sans custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Column 1: Core Info */}
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Event Date & Time</label>
                  <div className="space-y-3">
                     <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#268053] shrink-0"><CalendarIcon size={18} /></div>
                        <div className="min-w-0">
                           <p className="text-xs sm:text-sm font-black text-slate-900 leading-none mb-1 truncate">
                              {booking.startDate === booking.endDate ? getEthDateString(booking.startDate) : `${getEthDateString(booking.startDate).split(',')[0]} — ${getEthDateString(booking.endDate)}`}
                           </p>
                           <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight">Booking Duration</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#268053] shrink-0"><Clock size={18} /></div>
                        <div className="min-w-0">
                           <p className="text-xs sm:text-sm font-black text-slate-900 leading-none mb-1 truncate">{toEthTime(booking.startTime)} - {toEthTime(booking.endTime)}</p>
                           <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight">Access Schedule (Local)</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Venue & Capacity</label>
                  <div className="flex items-start gap-3 sm:gap-4">
                     <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Building size={18} /></div>
                     <div className="min-w-0">
                        <p className="text-sm sm:text-base font-black text-slate-900 leading-tight mb-1 sm:mb-2 uppercase tracking-tight truncate">{venue?.name || 'Unknown Venue'}</p>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-500 font-bold text-[10px] sm:text-xs"><Users size={14} className="text-[#268053]" /><span className="truncate">{booking.participantCount} Expected Guests</span></div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Column 2: Organizer & Description */}
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Organizer Contact</label>
                  <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 shrink-0"><User size={14} /></div>
                        <span className="text-xs sm:text-sm font-bold text-slate-700 truncate">{booking.organizerName}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 shrink-0"><Mail size={14} /></div>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate">{booking.organizerEmail}</span>
                     </div>
                     {booking.organizerPhone && (
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400 shrink-0"><Phone size={14} /></div>
                          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate">{booking.organizerPhone}</span>
                       </div>
                     )}
                  </div>
               </div>

               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Event Overview</label>
                 <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl border border-slate-100 h-24 sm:h-28 overflow-y-auto custom-scrollbar">
                   <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed italic">
                     {booking.eventDescription ? `"${booking.eventDescription}"` : 'No description provided.'}
                   </p>
                 </div>
               </div>
            </div>

            {/* Column 3: Services & Attachments */}
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Requested Services</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {(!booking.technicalServices?.length && !booking.supportServices?.length) ? (
                    <p className="text-slate-400 italic text-xs sm:text-sm">No extra services requested.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {booking.technicalServices.map(id => {
                        const s = technicalServices.find(x => x.id === id);
                        return s ? <span key={id} className="inline-flex px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 text-[9px] sm:text-[10px] font-bold shadow-sm">{s.name}</span> : null;
                      })}
                      {booking.supportServices.map(id => {
                        const s = supportServices.find(x => x.id === id);
                        return s ? <span key={id} className="inline-flex px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 text-[9px] sm:text-[10px] font-bold shadow-sm">{s.name}</span> : null;
                      })}
                    </div>
                  )}
                </div>
              </div>

              {booking.letterAttachment && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Attachment</label>
                  <a href={booking.letterAttachment} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-[#268053] shrink-0"><FileText size={16} /></div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#268053] text-[10px] sm:text-xs truncate">Official Request Letter</p>
                        <p className="text-[9px] sm:text-[10px] text-emerald-600">View PDF</p>
                      </div>
                    </div>
                  </a>
                </div>
              )}


            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-center sm:justify-end">
           <button onClick={onClose} className="w-full sm:w-auto px-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm">Close Modal</button>
        </div>
      </div>
    </div>
  );
}

// --- Main View ---

export default function CalendarView() {
  const { bookings, venues, role, toEthTime } = useApp();
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  
  const isAdmin = ['system_admin', 'event_management', 'admin_finance', 'leadership'].includes(role || '');

  const today = EthDateTime.now();
  const [view, setView] = useState({ year: today.year, month: today.month });

  const prevMonth = () => setView(v => v.month === 1 ? { year: v.year - 1, month: 13 } : { ...v, month: v.month - 1 });
  const nextMonth = () => setView(v => v.month === 13 ? { year: v.year + 1, month: 1 } : { ...v, month: v.month + 1 });

  const daysInMonth = view.month === 13 ? (view.year % 4 === 3 ? 6 : 5) : 30;
  const firstDayGreg = new EthDateTime(view.year, view.month, 1, 12, 0, 0).toEuropeanDate();
  const startOffset = firstDayGreg.getDay() === 0 ? 6 : firstDayGreg.getDay() - 1; 

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
     const day = i + 1;
     const gregDate = new EthDateTime(view.year, view.month, day, 12, 0, 0).toEuropeanDate();
     return { day, gregDate };
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="pb-12" style={{ animation: 'fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
      
      {activeBooking && (
        <EventDetailsModal 
          booking={activeBooking} 
          onClose={() => setActiveBooking(null)} 
          toEthTime={toEthTime}
        />
      )}

      {/* Header Area */}
      <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight flex items-center gap-2 sm:gap-3">
             <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#268053]" /> Master Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 sm:mt-2">Full Ethiopian Calendar grid viewing all pending and confirmed events.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
          
          {/* UPDATED: Dynamic Legend based on Role */}
          {isAdmin ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
              <span className="flex items-center gap-1.5 text-amber-700 whitespace-nowrap"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-amber-500" /> Pending</span>
              <span className="flex items-center gap-1.5 text-teal-700 whitespace-nowrap"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-teal-500" /> MoA Approved</span>
              <span className="flex items-center gap-1.5 text-blue-700 whitespace-nowrap"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-blue-500" /> Advance Paid</span>
              <span className="flex items-center gap-1.5 text-emerald-700 whitespace-nowrap"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-[#268053]" /> Fully Paid</span>
              <span className="flex items-center gap-1.5 text-purple-700 whitespace-nowrap"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-purple-500" /> VIP</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto justify-center">
              <span className="flex items-center gap-1.5 sm:gap-2 text-amber-700"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-amber-500" /> Tentative</span>
              <span className="flex items-center gap-1.5 sm:gap-2 text-emerald-700"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded bg-[#268053]" /> Confirmed</span>
            </div>
          )}

          <div className="relative group w-full sm:w-auto shrink-0">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#268053]" />
            <select
              value={selectedVenue}
              onChange={e => setSelectedVenue(e.target.value)}
              className="w-full sm:w-48 text-xs sm:text-sm font-bold text-slate-700 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 bg-white shadow-sm focus:outline-none focus:border-[#268053] appearance-none cursor-pointer"
            >
              <option value="all">All Venues</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Massive Calendar Grid - MOBILE RESPONSIVE SCROLL */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Navigation Bar */}
        <div className="bg-[#111827] text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
          <button onClick={prevMonth} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
          
          <h2 className="text-lg sm:text-2xl font-black tracking-widest uppercase">
             {ETH_MONTHS[view.month - 1]} {view.year}
          </h2>
          
          <button onClick={nextMonth} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* HORIZONTAL SCROLL WRAPPER FOR GRID */}
        <div className="overflow-x-auto custom-scrollbar w-full">
          {/* Minimum width forces grid to stay big enough, enables swipe on mobile */}
          <div className="min-w-[900px] lg:min-w-full flex flex-col">
            
            {/* Days Header */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
              {ETH_DAYS.map(d => (
                <div key={d} className="text-center py-2 sm:py-3 text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 last:border-0">
                   {d}
                </div>
              ))}
            </div>

            {/* The Grid Boxes */}
            <div className="grid grid-cols-7 bg-slate-200 gap-px">
              
              {/* Empty offset padding */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[120px] sm:min-h-[160px] bg-[#f8fafc]/80" />
              ))}
              
              {calendarDays.map(({ day, gregDate }) => {
                 const dateStr = format(gregDate, 'yyyy-MM-dd');
                 const isPastDay = dateStr < todayStr;
                 
                 // Find bookings for this box
                 const dayBookings = bookings.filter(b => {
                    if (isPastDay) return false;
                    let matchesDate = b.startDate <= dateStr && b.endDate >= dateStr;
                    if (b.dailySchedules?.length) matchesDate = b.dailySchedules.some(s => s.date === dateStr);
                    const matchVenue = selectedVenue === 'all' || b.venueId?.toString() === selectedVenue;
                    const validStatus = ['pending', 'management_approved', 'partial_paid', 'paid', 'approved', 'completed'].includes(b.status);
                    return matchesDate && matchVenue && validStatus;
                 });

                 return (
                   <div
                     key={day}
                     className={`min-h-[120px] sm:min-h-[160px] p-1.5 sm:p-2 flex flex-col transition-colors group ${isPastDay ? 'bg-slate-50' : 'bg-white'}`}
                   >
                     <div className="flex justify-end mb-1 sm:mb-2">
                       <span className={`text-xs sm:text-sm font-black transition-colors ${isPastDay ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-800'}`}>{day}</span>
                     </div>
                     
                     <div className="flex-1 space-y-1 sm:space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
                       {!isPastDay && dayBookings.map(b => {
                          const cfg = getStatusProps(b.status, isAdmin);
                          const venueInfo = venues.find(v => v.id?.toString() === b.venueId?.toString());
                          const venueName = venueInfo?.name || 'Unknown Venue';
                          
                          return (
                            <div 
                              key={b.id} 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (isAdmin) setActiveBooking(b); 
                              }}
                              className={`px-1.5 sm:px-2 py-1 sm:py-1.5 rounded border border-l-[3px] sm:border-l-[4px] shadow-sm flex flex-col gap-[1px] sm:gap-0.5 transition-all ${cfg.bg} ${cfg.border} ${cfg.borderLeft} ${isAdmin ? 'cursor-pointer hover:-translate-y-px hover:shadow-md' : 'cursor-default'}`}
                            >
                               <div className={`flex items-center justify-between gap-1 font-black text-[8px] sm:text-[10px] uppercase tracking-wider ${cfg.color} opacity-90`}>
                                  <span className="flex items-center gap-1 truncate">
                                    {cfg.icon}
                                    <span className="truncate">{cfg.label}</span>
                                  </span>
                               </div>
                               
                               {isAdmin && (
                                 <div className="flex items-center gap-1 font-bold text-[9px] sm:text-xs truncate mt-[1px] sm:mt-0.5">
                                    <User size={10} className="shrink-0 opacity-60 text-slate-500 hidden sm:block" />
                                    <span className="truncate text-slate-700">{b.organizerName}</span>
                                 </div>
                               )}

                               <div className={`text-[9px] sm:text-[10px] font-medium truncate opacity-90 ${isAdmin ? 'sm:pl-3.5 text-slate-600' : 'text-slate-800 font-bold'}`}>
                                  {b.eventTitle}
                               </div>

                               <div className={`flex items-center gap-1 mt-[1px] sm:mt-0.5 text-[8px] sm:text-[9px] font-bold opacity-80 ${isAdmin ? 'sm:pl-3.5 text-slate-500' : 'text-slate-600'}`}>
                                  <MapPin size={8} className="shrink-0 sm:w-[10px] sm:h-[10px]" />
                                  <span className="truncate">{venueName}</span>
                               </div>

                               <div className={`flex items-center gap-1 mt-[1px] sm:mt-0.5 text-[8px] sm:text-[9px] font-bold opacity-80 ${isAdmin ? 'sm:pl-3.5 text-slate-500' : 'text-slate-600'}`}>
                                  <Clock size={8} className="shrink-0 sm:w-[10px] sm:h-[10px]" />
                                  <span className="truncate">{toEthTime(b.startTime)} - {toEthTime(b.endTime)}</span>
                               </div>
                            </div>
                          )
                       })}
                     </div>
                   </div>
                 );
              })}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}