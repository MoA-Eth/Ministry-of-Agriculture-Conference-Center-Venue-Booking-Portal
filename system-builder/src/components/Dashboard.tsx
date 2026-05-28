import { useApp } from '@/lib/app-context';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area } from 'recharts';
import {
  Calendar, Building2, Users, TrendingUp, CheckCircle2, ListFilter, Zap, ArrowRight,
  ShieldAlert, DollarSign, Clock, Activity, AlertTriangle, ChevronLeft, ChevronRight,
  Banknote, BarChart3, CalendarCheck, Target, Filter,
  Star, X as CloseIcon, Building, Mail, Phone, Clock3, AlertCircle, XCircle, FileText, User
} from 'lucide-react';
import { format, addDays, differenceInDays, isToday, isFuture, isPast, parseISO, subDays } from 'date-fns';
import { Booking, BookingStatus } from '@/lib/types';
import { ETH_MONTHS, EthiopianCalendar } from '@/components/ui/ethiopian-calendar';
import { EthDateTime } from 'ethiopian-calendar-date-converter';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

function ScrollReveal({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Derive short month names from the full names
const ETH_MONTHS_SHORT = ETH_MONTHS.map(m => m.substring(0, 3));

const COLORS = ['#268053', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const STATUS_COLORS: Record<string, string> = {
  approved: '#3b82f6',     // Blue (Awaiting Payment)
  confirmed: '#059669',    // Emerald (Paid)
  paid: '#059669',         // Emerald (Paid)
  partial_paid: '#10b981', // Light Emerald (1st Round)
  override: '#8b5cf6',     // Violet
  reserved: '#f59e0b',     // Amber (Pending)
  rejected: '#ef4444',     // Red
  cancelled: '#64748b',    // Slate
  completed: '#0f172a',    // Dark
};

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

function StatusBadge({ status }: { status: BookingStatus }) {
  const configs: Record<string, { color: string, bg: string, border: string, icon: any, label: string }> = {
    reserved: { label: 'Pending Approval', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Clock3 size={14} /> },
    approved: { label: 'Awaiting Payment', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Clock size={14} /> },
    paid: { label: 'Fully Paid', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={14} /> },
    confirmed: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={14} /> },
    partial_paid: { label: '1st Round Paid', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: <Activity size={14} /> },
    override: { label: 'VIP Override', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: <Star size={14} /> },
    rejected: { label: 'Rejected', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: <XCircle size={14} /> },
    cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: <AlertCircle size={14} /> },
    completed: { label: 'Completed', color: 'text-slate-800', bg: 'bg-slate-200', border: 'border-slate-400', icon: <CheckCircle2 size={14} /> },
  };
  const cfg = configs[status] || configs.reserved;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm`}>
      {cfg.icon}
      {cfg.label}
    </div>
  );
}

function EventDetailsModal({ booking, onClose }: { booking: Booking, onClose: () => void }) {
  const { venues, technicalServices, supportServices, toEthTime } = useApp();
  const venue = venues.find(v => v.id === booking.venueId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="relative h-40 shrink-0">
           <div className="absolute inset-0 bg-gradient-to-br from-[#1b4332] to-[#268053]" />
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
           <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md flex items-center justify-center transition-all z-10">
             <CloseIcon size={20} />
           </button>
           <div className="absolute bottom-6 left-8 z-10">
              <StatusBadge status={booking.status as BookingStatus} />
              <h2 className="text-3xl font-serif font-black text-white mt-3 tracking-tight drop-shadow-sm uppercase line-clamp-1">{booking.eventTitle}</h2>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 font-sans custom-scrollbar">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Event Date & Time</label>
                  <div className="space-y-3">
                     <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#268053]"><Calendar size={20} /></div>
                        <div>
                           <p className="text-sm font-black text-slate-900 leading-none mb-1">
                              {booking.startDate === booking.endDate ? getEthDateString(booking.startDate) : `${getEthDateString(booking.startDate).split(',')[0]} — ${getEthDateString(booking.endDate)}`}
                           </p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Booking Duration</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#268053]"><Clock size={20} /></div>
                        <div>
                           <p className="text-sm font-black text-slate-900 leading-none mb-1">{toEthTime(booking.startTime)} - {toEthTime(booking.endTime)}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Access Schedule</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Venue & Capacity</label>
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Building size={20} /></div>
                     <div>
                        <p className="text-base font-black text-slate-900 leading-tight mb-2 uppercase tracking-tight">{venue?.name || 'Unknown Venue'}</p>
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs"><Users size={14} className="text-[#268053]" /><span>{booking.participantCount} Expected Guests</span></div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Organizer Contact</label>
                  <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400"><User size={14} /></div>
                        <span className="text-sm font-bold text-slate-700">{booking.organizerName}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400"><Mail size={14} /></div>
                        <span className="text-xs font-semibold text-slate-500">{booking.organizerEmail}</span>
                     </div>
                     {booking.organizerPhone && (
                       <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                          <span className="text-xs font-semibold text-slate-500">{booking.organizerPhone}</span>
                       </div>
                     )}
                  </div>
               </div>
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Event Overview</label>
                 <div className="bg-[#f8fafc] p-4 rounded-xl border border-slate-100 h-28 overflow-y-auto custom-scrollbar">
                   <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                     {booking.eventDescription ? `"${booking.eventDescription}"` : 'No description provided.'}
                   </p>
                 </div>
               </div>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Requested Services</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {(!booking.technicalServices?.length && !booking.supportServices?.length) ? (
                    <p className="text-slate-400 italic text-sm">No extra services requested.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {booking.technicalServices?.map(id => {
                        const s = technicalServices.find(x => x.id === id);
                        return s ? <span key={id} className="inline-flex px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold shadow-sm">{s.name}</span> : null;
                      })}
                      {booking.supportServices?.map(id => {
                        const s = supportServices.find(x => x.id === id);
                        return s ? <span key={id} className="inline-flex px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold shadow-sm">{s.name}</span> : null;
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
                      <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-[#268053]"><FileText size={16} /></div>
                      <div>
                        <p className="font-bold text-[#268053] text-xs">Official Request Letter</p>
                        <p className="text-[10px] text-emerald-600">View PDF Document</p>
                      </div>
                    </div>
                  </a>
                </div>
              )}
              <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
                 <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                 <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Total Valuation</p>
                 <p className="text-2xl font-black text-white relative z-10">{booking.totalPrice?.toFixed(2)} ETB</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-end">
           <button onClick={onClose} className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm">Close Modal</button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { bookings: rawBookings, venues, technicalServices, supportServices, auditLogs, toEthTime, role } = useApp();
  const isAdmin = role !== 'organizer';
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [selectedDayBookings, setSelectedDayBookings] = useState<{ name: string, fullDate: string, bookings: Booking[] } | null>(null);

  // Filtering States
  const [dashDateFrom, setDashDateFrom] = useState<string>('');
  const [dashDateTo, setDashDateTo]     = useState<string>('');
  const [showDashCal, setShowDashCal]   = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // ─── REAL TODAY ─────────────────────────────────────────────
  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, 'yyyy-MM-dd');

  // ─── FILTER LOGIC ──────────────────────────────────────────
  const bookings = useMemo(() => {
    return rawBookings.filter(b => {
      // A booking is "in range" if its event overlaps with the selected window.
      // startDate and endDate are always YYYY-MM-DD strings — safe to compare lexicographically.
      if (dashDateFrom && b.endDate < dashDateFrom) return false;
      if (dashDateTo   && b.startDate > dashDateTo)   return false;
      if (selectedVenue  !== 'all' && b.venueId !== selectedVenue)  return false;
      if (selectedStatus !== 'all' && b.status  !== selectedStatus) return false;
      return true;
    });
  }, [rawBookings, dashDateFrom, dashDateTo, selectedVenue, selectedStatus]);

  // ─── EXCLUDED STATUSES (deleted / cancelled events) ────────
  // Bookings with these statuses are hidden from headline metrics
  const EXCLUDED_STATUSES = ['cancelled', 'rejected'];

  // Active bookings = everything that is NOT cancelled or rejected
  const activeOnlyBookings = bookings.filter(b => !EXCLUDED_STATUSES.includes(b.status));

  // ─── CORE METRICS ──────────────────────────────────────────
  const confirmedCount = activeOnlyBookings.filter(b => ['paid', 'confirmed', 'completed'].includes(b.status)).length;
  const pendingCount  = activeOnlyBookings.filter(b => b.status === 'reserved').length;
  const completedCount = activeOnlyBookings.filter(b => b.status === 'completed').length;
  const rejectedCount = bookings.filter(b => EXCLUDED_STATUSES.includes(b.status)).length;
  const activeBookings = activeOnlyBookings.filter(b => ['paid', 'partial_paid', 'confirmed', 'reserved'].includes(b.status));

  // Total Bookings and Total Participants exclude cancelled / rejected events
  const totalBookingsCount = activeOnlyBookings.length;
  const totalParticipants = activeOnlyBookings.reduce((s, b) => s + (b.participantCount || 0), 0);

  const approvedCountForRate = activeOnlyBookings.filter(b => ['approved', 'confirmed', 'completed', 'override'].includes(b.status)).length;
  const approvalRate = (approvedCountForRate + rejectedCount) > 0 
    ? Math.round((approvedCountForRate / (approvedCountForRate + rejectedCount)) * 100) 
    : 0;

  // ─── 1. REVENUE ANALYTICS (with Deductions) ────────────────
  const calculateAdjustedPrice = (b: Booking) => {
    let deduction = 0;
    
    // Technical Service Deductions
    if (b.ictAcknowledged && b.unavailableTechnicalServices && b.unavailableTechnicalServices.length > 0) {
      b.unavailableTechnicalServices.forEach(id => {
        const s = technicalServices.find(ts => String(ts.id) === String(id));
        if (s) deduction += Number(s.price || 0);
      });
    }

    // Support/Catering Service Deductions
    if (b.cateringAcknowledged && b.unavailableSupportServices && b.unavailableSupportServices.length > 0) {
      b.unavailableSupportServices.forEach(id => {
        const s = supportServices.find(ss => String(ss.id) === String(id));
        if (s) deduction += Number(s.price || 0);
      });
    }

    return Math.max(0, (b.totalPrice || 0) - deduction);
  };

  // Revenue only from active (non-cancelled, non-rejected) bookings
  const confirmedRevenue = activeOnlyBookings
    .filter(b => ['paid', 'confirmed', 'completed', 'approved'].includes(b.status))
    .reduce((sum, b) => sum + calculateAdjustedPrice(b), 0);
    
  const pendingRevenue = activeOnlyBookings
    .filter(b => ['reserved', 'partial_paid', 'pending'].includes(b.status))
    .reduce((sum, b) => sum + calculateAdjustedPrice(b), 0);
    
  const totalProjectedRevenue = confirmedRevenue + pendingRevenue;

  // ─── 2. TODAY'S OCCUPANCY ──────────────────────────────────
  const todayBookings = bookings.filter(b => {
    if (b.status === 'cancelled' || b.status === 'rejected') return false;
    // Check if today falls within start/end range
    if (b.startDate <= todayStr && b.endDate >= todayStr) return true;
    // Also check daily schedules
    if (b.dailySchedules?.some(ds => ds.date === todayStr)) return true;
    return false;
  });

  const todayOccupiedVenues = new Set(todayBookings.map(b => b.venueId));
  const availableVenues = venues.filter(v => v.status !== 'out_of_order');
  const occupancyRate = availableVenues.length > 0
    ? Math.round((todayOccupiedVenues.size / availableVenues.length) * 100)
    : 0;

  // ─── 3. CONFLICT DETECTION ─────────────────────────────────
  const conflicts = useMemo(() => {
    return activeBookings.filter((b1, i) =>
      activeBookings.some((b2, j) =>
        i !== j &&
        b1.venueId === b2.venueId &&
        b1.startDate === b2.startDate &&
        ((b1.startTime >= b2.startTime && b1.startTime < b2.endTime) ||
         (b2.startTime >= b1.startTime && b2.startTime < b1.endTime))
      )
    );
  }, [activeBookings]);

  // ─── 4. BOOKING STATUS DISTRIBUTION ────────────────────────
  // Only show active statuses in the pie chart — cancelled/rejected events are excluded
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    activeOnlyBookings.forEach(b => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: STATUS_COLORS[name] || '#94a3b8'
    }));
  }, [activeOnlyBookings]);

  // ─── 5. WEEKLY BOOKING STATUS (Daily Breakdown) ───────────
  const weeklyStatusData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayName = format(d, 'EEE');
      
      const dayBookings = bookings.filter(b => 
        (b.startDate <= dateStr && b.endDate >= dateStr) ||
        (b.dailySchedules?.some(ds => ds.date === dateStr))
      );
      
      return { 
        name: dayName, 
        fullDate: dateStr,
        count: dayBookings.length,
        bookings: dayBookings
      };
    });
  }, [bookings, today]);

  // ─── 6. SERVICE DEMAND ─────────────────────────────────────
  const serviceDemandData = useMemo(() => {
    const allServiceIds = [
      ...bookings.flatMap(b => b.technicalServices || []),
      ...bookings.flatMap(b => b.supportServices || [])
    ];
    const serviceCounts: Record<string, number> = {};
    allServiceIds.forEach(id => {
      const service = [...technicalServices, ...supportServices].find(s => s.id === id);
      if (service) {
        serviceCounts[service.name] = (serviceCounts[service.name] || 0) + 1;
      }
    });
    return Object.entries(serviceCounts)
      .map(([name, value]) => ({ name: name.length > 18 ? name.substring(0, 16) + '…' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [bookings, technicalServices, supportServices]);

  // ─── 7. VENUE USAGE RANKING ────────────────────────────────
  const venueUsage = useMemo(() => {
    return venues
      .map(v => ({
        name: v.name.split(' ').slice(0, 2).join(' '),
        fullName: v.name,
        bookings: bookings.filter(b => b.venueId === v.id && !['cancelled', 'rejected'].includes(b.status)).length,
        capacity: v.capacity || 0,
        type: v.type,
      }))
      .filter(v => v.bookings > 0)
      .sort((a, b) => b.bookings - a.bookings);
  }, [venues, bookings]);

  // ─── 8. MONTHLY TREND (last 6 months simulation) ──────────
  const monthlyTrend = useMemo(() => {
    const todayGreg = new Date();
    const todayEth = EthDateTime.fromEuropeanDate(todayGreg);
    
    const months: { name: string; bookings: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let targetYear = todayEth.year;
      let targetMonth = todayEth.month - i;
      while (targetMonth <= 0) {
        targetMonth += 13;
        targetYear -= 1;
      }
      
      // First day of target Ethiopian month
      const startEth = new EthDateTime(targetYear, targetMonth, 1, 12, 0, 0);
      const startGreg = startEth.toEuropeanDate();
      
      // Last day of target Ethiopian month
      const daysInMonth = targetMonth === 13 ? (targetYear % 4 === 3 ? 6 : 5) : 30;
      const endEth = new EthDateTime(targetYear, targetMonth, daysInMonth, 12, 0, 0);
      const endGreg = endEth.toEuropeanDate();
      
      const startStr = format(startGreg, 'yyyy-MM-dd');
      const endStr = format(endGreg, 'yyyy-MM-dd');
      
      const monthBookings = bookings.filter(b => 
        b.startDate >= startStr && b.startDate <= endStr && 
        !['cancelled', 'rejected'].includes(b.status)
      );
      
      months.push({
        name: ETH_MONTHS_SHORT[targetMonth - 1],
        bookings: monthBookings.length,
        revenue: monthBookings.reduce((s, b) => s + (b.totalPrice || 0), 0),
      });
    }
    return months;
  }, [bookings]);

  // ─── 10. PRIORITY EVENTS (Next 7 days) ─────────────────────
  const priorityEvents = useMemo(() => {
    const sevenDaysOut = format(addDays(today, 7), 'yyyy-MM-dd');
    const activeStatuses = ['confirmed', 'reserved', 'paid', 'partial_paid', 'approved', 'override'];
    return bookings.filter(b => {
      return b.startDate >= todayStr && b.startDate <= sevenDaysOut && activeStatuses.includes(b.status);
    }).sort((a, b) => a.startDate.localeCompare(b.startDate) || a.startTime.localeCompare(b.startTime));
  }, [bookings, todayStr]);

  // Pagination for Priority Events
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(priorityEvents.length / itemsPerPage);

  const paginatedPriority = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return priorityEvents.slice(start, start + itemsPerPage);
  }, [priorityEvents, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [priorityEvents.length]);

  // ─── 9. RESOURCE BOTTLENECK ────────────────────────────────
  const resourceInventory: Record<string, number> = {
    'LED Screen / Display': 2, 'Livestreaming': 1,
    'Video Conferencing': 2, 'Photography': 1
  };

  const bottleneckAlerts = useMemo(() => {
    return Object.entries(resourceInventory).map(([name, limit]) => {
      const datesWithUsage = Array.from(new Set(priorityEvents.map(b => b.startDate)));
      const peakUsage = datesWithUsage.reduce((max, date) => {
        const dailyUsage = priorityEvents.filter(b =>
          b.startDate === date &&
          [...(b.technicalServices || []), ...(b.supportServices || [])].some(sid => {
            const s = [...technicalServices, ...supportServices].find(x => String(x.id) === String(sid));
            return s && s.name.includes(name);
          })
        ).length;
        return Math.max(max, dailyUsage);
      }, 0);
      return peakUsage > limit ? { name, peakUsage, limit } : null;
    }).filter(Boolean);
  }, [priorityEvents, technicalServices, supportServices]);

  // ─── 11. STAFFING RECOMMENDATIONS ──────────────────────────
  const staffing = useMemo(() => {
    const upcomingParticipants = priorityEvents.reduce((s, b) => s + (b.participantCount || 0), 0);
    const avgDailyParticipants = priorityEvents.length > 0 ? upcomingParticipants / 7 : 0;
    
    return {
      ushers: Math.max(1, Math.ceil(avgDailyParticipants / 50)),
      security: Math.max(1, Math.ceil(avgDailyParticipants / 100)),
      tech: avgDailyParticipants > 100 ? 2 : 1,
    };
  }, [priorityEvents]);

  // ─── UTILITY: Ethiopian Date Parts ─────────────────────────
  const getEthParts = (gregStr: string) => {
    try {
      const [y, m, d] = gregStr.split('-').map(Number);
      const ethDate = EthDateTime.fromEuropeanDate(new Date(y, m - 1, d, 12));
      return { month: ETH_MONTHS_SHORT[ethDate.month - 1], day: ethDate.date };
    } catch {
      return { month: '???', day: '??' };
    }
  };

  const getEthDateFull = (gregStr: string) => {
    try {
      const [y, m, d] = gregStr.split('-').map(Number);
      const ethDate = EthDateTime.fromEuropeanDate(new Date(y, m - 1, d, 12));
      return `${ETH_MONTHS[ethDate.month - 1]} ${ethDate.date}, ${ethDate.year}`;
    } catch {
      return gregStr;
    }
  };

  // ─── TOP-LEVEL STAT CARDS ──────────────────────────────────
  // NOTE: cancelled and rejected events are excluded from all headline stats
  const stats = [
    { label: 'Total Bookings', value: totalBookingsCount, icon: <CalendarCheck className="w-6 h-6 text-emerald-400" />, bg: 'bg-[#112a1f]', border: 'border-emerald-500/20', sub: 'Active events only' },
    { label: 'Approval Rate', value: `${approvalRate}%`, icon: <Target className="w-6 h-6 text-amber-400" />, bg: 'bg-[#1e1b10]', border: 'border-amber-500/20', sub: 'Approved vs Cancelled' },
    { label: 'Total Participants', value: totalParticipants.toLocaleString(), icon: <Users className="w-6 h-6 text-blue-400" />, bg: 'bg-[#0f172a]', border: 'border-blue-500/20', sub: 'Active events only' },
    ...(isAdmin ? [{ label: 'Confirmed Revenue', value: `ETB ${(confirmedRevenue / 1000).toFixed(1)}k`, icon: <Banknote className="w-6 h-6 text-emerald-400" />, bg: 'bg-[#0d2818]', border: 'border-emerald-500/20', sub: 'From approved bookings' }] : []),
  ];

  // ─── CUSTOM TOOLTIP ────────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111827]/95 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
          <p className="font-bold text-white mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-[#2ed18a] font-black text-sm">
              {p.value} {p.dataKey === 'count' ? 'Events' : p.dataKey === 'revenue' ? 'ETB' : p.dataKey === 'bookings' ? 'Bookings' : 'Requests'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="pb-12">
      
      {activeBooking && <EventDetailsModal booking={activeBooking} onClose={() => setActiveBooking(null)} />}

      {/* Header */}
      <div className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-2 font-medium">Real-time overview of conference center operations — <span className="text-[#268053] font-bold">{getEthDateFull(todayStr)}</span></p>
        </div>
        
        {/* Filter Bar */}
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap lg:flex-nowrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 pl-2 pr-3 border-r border-slate-100 text-slate-400">
            <Filter size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
          </div>
          
          {/* Ethiopian Calendar Range Picker */}
          <div className="relative">
            <button
              onClick={() => setShowDashCal(!showDashCal)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all ${
                dashDateFrom || dashDateTo
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-emerald-300'
              }`}
            >
              <Calendar size={15} className={dashDateFrom || dashDateTo ? 'text-emerald-500' : 'text-slate-400'} />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Date Range (E.C.)</span>
                <span className="text-xs font-bold mt-0.5">
                  {dashDateFrom
                    ? (() => { try { const [y,m,d] = dashDateFrom.split('-').map(Number); const e = EthDateTime.fromEuropeanDate(new Date(y,m-1,d,12)); return `${ETH_MONTHS[e.month-1].substring(0,3)} ${e.date}`; } catch { return dashDateFrom; } })()
                    : 'Start'}
                  {' — '}
                  {dashDateTo
                    ? (() => { try { const [y,m,d] = dashDateTo.split('-').map(Number); const e = EthDateTime.fromEuropeanDate(new Date(y,m-1,d,12)); return `${ETH_MONTHS[e.month-1].substring(0,3)} ${e.date}`; } catch { return dashDateTo; } })()
                    : 'End'}
                </span>
              </div>
              {(dashDateFrom || dashDateTo) && (
                <button onClick={e => { e.stopPropagation(); setDashDateFrom(''); setDashDateTo(''); }} className="ml-1 text-slate-400 hover:text-rose-500 transition-colors">
                  <CloseIcon size={13} />
                </button>
              )}
            </button>

            {showDashCal && (
              <div className="absolute top-full left-0 mt-2 z-[200] bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Select Range (E.C.)</h4>
                  <button onClick={() => setShowDashCal(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"><CloseIcon size={16}/></button>
                </div>
                <EthiopianCalendar
                  allowPast={true}
                  selected={{
                    from: dashDateFrom ? new Date(dashDateFrom + 'T12:00:00') : undefined,
                    to:   dashDateTo   ? new Date(dashDateTo   + 'T12:00:00') : undefined,
                  }}
                  onSelect={range => {
                    if (range.from) {
                      setDashDateFrom(format(range.from, 'yyyy-MM-dd'));
                      if (!range.to) setDashDateTo('');
                    }
                    if (range.to) {
                      setDashDateTo(format(range.to, 'yyyy-MM-dd'));
                      setShowDashCal(false);
                    }
                  }}
                />
                {dashDateFrom && !dashDateTo && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 justify-end">
                    <button onClick={() => { setDashDateTo(dashDateFrom); setShowDashCal(false); }}
                      className="px-4 py-2 bg-[#268053] text-white text-xs font-black rounded-xl hover:bg-[#1b4332] transition-colors">
                      Apply Single Day
                    </button>
                    <button onClick={() => { setDashDateFrom(''); setDashDateTo(''); }}
                      className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-colors">
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <select value={selectedVenue} onChange={e => setSelectedVenue(e.target.value)}
            className="bg-slate-50 border-none text-sm font-bold text-slate-700 rounded-xl px-4 py-2 cursor-pointer outline-none focus:ring-2 focus:ring-[#268053]/20 max-w-[150px] truncate">
            <option value="all">All Venues</option>
            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>

          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border-none text-sm font-bold text-slate-700 rounded-xl px-4 py-2 cursor-pointer outline-none focus:ring-2 focus:ring-[#268053]/20">
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed / Paid</option>
            <option value="reserved">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="override">VIP Override</option>
          </select>
        </div>
      </div>

      {/* ═══ TOP LEVEL METRIC CARDS ═══ */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map((s, i) => (
          <ScrollReveal key={s.label} delay={100 * i}>
            <div
              className={`${s.bg} h-full rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-b-4 ${s.border} hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group cursor-default`}
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-700 pointer-events-none blur-2xl" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform duration-500">
                  {s.icon}
                </div>
                {((s.label === 'Action Required') && typeof s.value === 'number' && s.value > 0) && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-black text-white tracking-tight mb-1">{s.value}</p>
                <p className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">{s.label}</p>
                <p className="text-[10px] font-bold text-white/25 mt-2">{s.sub}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* ═══ ROW 2: WEEKLY FORECAST + MONTHLY TREND ═══ */}
      <div className="grid gap-8 lg:grid-cols-7 mb-8">

        {/* Weekly Forecast Chart */}
        <ScrollReveal className="lg:col-span-4" delay={200}>
          <div className="bg-white rounded-3xl p-8 shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-slate-100 h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#268053] flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight font-serif">Weekly Booking Status</h3>
                <p className="text-sm text-slate-500 font-medium">Breakdown of event statuses for the selected period</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div><span className="text-[9px] font-black uppercase text-slate-400">Approved</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div><span className="text-[9px] font-black uppercase text-slate-400">Pending</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div><span className="text-[9px] font-black uppercase text-slate-400">Rejected</span></div>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={weeklyStatusData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    setSelectedDayBookings(data.activePayload[0].payload);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={10} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#268053" radius={[8, 8, 0, 0]} barSize={36} animationBegin={500} className="cursor-pointer">
                  {weeklyStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#268053' : '#cbd5e1'} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
        </ScrollReveal>

        {/* Monthly Booking Trend */}
        <ScrollReveal className="lg:col-span-3" delay={300}>
          <div className="bg-white rounded-3xl p-8 shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-full">
          <div className="mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight font-serif">Monthly Trend</h3>
              <p className="text-sm text-slate-500 font-medium">Booking frequency (Ethiopian months)</p>
            </div>
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#268053" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#268053" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={10} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="bookings" stroke="#268053" strokeWidth={3} fill="url(#colorBookings)" animationBegin={600} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ═══ ROW 3: STATUS DISTRIBUTION + SERVICE DEMAND + RESOURCE ALERTS ═══ */}
      <div className="grid gap-8 lg:grid-cols-3 mb-8">

        {/* Booking Status Distribution */}
        <ScrollReveal delay={400}>
          <div className="bg-white rounded-3xl p-8 shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-slate-100 h-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight font-serif">Status Overview</h3>
              <p className="text-xs text-slate-500 font-medium">{totalBookingsCount} active bookings</p>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {statusDistribution.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}></div>
                <span className="text-[10px] font-bold text-slate-600 truncate">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
          </div>
        </ScrollReveal>

        {/* Service Demand */}
        <ScrollReveal delay={500}>
          <div className="bg-white rounded-3xl p-8 shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-slate-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight font-serif">Service Demand</h3>
                  <p className="text-xs text-slate-500 font-medium">Most requested resources</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-full tracking-widest">
                Trending
              </span>
            </div>

            {serviceDemandData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <Zap className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">No service data</p>
              </div>
            ) : (
              <div className="space-y-6 mt-2">
                {serviceDemandData.map((s, i) => {
                  const maxVal = serviceDemandData[0]?.value || 1;
                  const percent = Math.round((s.value / maxVal) * 100);
                  const isTech = technicalServices.some(ts => ts.name.includes(s.name) || s.name.includes(ts.name));
                  
                  return (
                    <ScrollReveal key={s.name} delay={100 * i}>
                      <div className="group">
                        <div className="flex justify-between items-end mb-2">
                          <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isTech ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                            {isTech ? <Activity size={12} /> : <Zap size={12} />}
                          </div>
                          <span className="text-xs font-bold text-slate-700 group-hover:text-[#268053] transition-colors">{s.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{s.value} Requests</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out relative z-10"
                          style={{ 
                            width: `${percent}%`, 
                            background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}dd)` 
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
          </div>
        </ScrollReveal>

        {/* Live Operational Feed */}
        <ScrollReveal delay={600}>
          <div className="bg-white rounded-3xl p-8 shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight font-serif">Operational Feed</h3>
                  <p className="text-xs text-slate-500 font-medium">Real-time system activity</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto mb-6 pr-1 custom-scrollbar max-h-[400px]">
              {auditLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-8">
                  <Activity className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">No activity logs</p>
                </div>
              ) : (
                auditLogs.slice(0, 15).map((log, i) => {
                  const isCritical = log.action.includes('Delete') || log.action.includes('Reject');
                  const isSuccess = log.action.includes('Confirm') || log.action.includes('Approve');
                  
                  return (
                    <div key={log.id || i} 
                      onClick={() => window.location.hash = `#/audit-log?id=${log.id}`}
                      className="flex gap-4 group cursor-pointer hover:translate-x-1 transition-all duration-300">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${isCritical ? 'bg-rose-100 text-rose-600' : isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'} group-hover:shadow-indigo-100 transition-all`}>
                          {log.action.includes('Booking') ? <Calendar size={14} /> : <User size={14} />}
                        </div>
                        {i !== auditLogs.slice(0, 15).length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1 group-hover:bg-indigo-100 transition-colors" />}
                      </div>
                      <div className="pb-4 flex-1">
                        <p className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">{log.action}</p>
                        <p className="text-[10px] font-medium text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{log.details}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-wider">
                          {log.full_name || 'System'} • {toEthTime(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>


          </div>
        </ScrollReveal>
      </div>

      {/* ═══ ROW 4: UPCOMING EVENTS LIST ═══ */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-slate-100 mb-8" style={{ animation: 'fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) 900ms both' }}>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#268053] flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight font-serif">Upcoming 7 Days: Operational Focus</h3>
              <p className="text-sm text-slate-500 font-medium">Events requiring room setup and team coordination</p>
            </div>
          </div>
          <span onClick={() => window.location.hash = '#/calendar'} className="text-[11px] font-black uppercase text-[#268053] tracking-widest flex items-center gap-2 cursor-pointer hover:underline">
            {priorityEvents.length} Events <ArrowRight className="w-4 h-4" />
          </span>
        </div>

        {priorityEvents.length === 0 ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400">No events scheduled in the next 7 days.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {paginatedPriority.map(b => {
                const venue = venues.find(v => v.id === b.venueId);
                const isUrgent = b.status === 'reserved';
                const eth = getEthParts(b.startDate);
                const isConflict = conflicts.some(c => c.id === b.id);
                const daysAway = differenceInDays(new Date(b.startDate), today);
                const daysLabel = daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `${daysAway}d away`;

                return (
                  <div key={b.id} onClick={(e) => { 
                    if (role !== 'leadership') {
                      e.stopPropagation(); setActiveBooking(b); 
                    }
                  }} className={`flex items-center gap-5 p-5 rounded-2xl transition-all duration-300 ${role !== 'leadership' ? 'group cursor-pointer' : ''} border ${isConflict ? 'bg-red-50/50 border-red-100 ' + (role !== 'leadership' ? 'hover:border-red-200' : '') : 'bg-[#f8fafc] border-transparent ' + (role !== 'leadership' ? 'hover:bg-white hover:shadow-xl hover:border-emerald-100' : '')}`}>
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border-b-4 ${isUrgent ? 'bg-amber-100 text-amber-600 border-amber-500/20' : 'bg-emerald-100 text-emerald-600 border-emerald-500/20'}`}>
                      <span className="text-[9px] font-black uppercase leading-none mb-0.5">{eth.month}</span>
                      <span className="text-xl font-black leading-none">{eth.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-black text-slate-900 group-hover:text-[#268053] transition-colors truncate text-sm">{b.eventTitle}</p>
                        {isUrgent && <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full animate-pulse shrink-0">PENDING</span>}
                        {isConflict && <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded-full shrink-0">CONFLICT</span>}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <Building2 className="w-3 h-3" /> {venue?.name || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <Users className="w-3 h-3" /> {b.participantCount} Max
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <Clock className="w-3 h-3" /> {toEthTime(b.startTime)} – {toEthTime(b.endTime)}
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end shrink-0">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${daysAway === 0 ? 'bg-red-100 text-red-700' : daysAway <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {daysLabel}
                      </span>
                      {b.totalPrice ? (
                        <span className="text-[10px] font-bold text-emerald-600 mt-1">ETB {b.totalPrice.toLocaleString()}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 mt-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Showing <span className="text-slate-900">{Math.min(priorityEvents.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(priorityEvents.length, currentPage * itemsPerPage)}</span> of {priorityEvents.length}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="rounded-lg h-8 w-8 p-0 border-slate-200 text-slate-500 hover:text-[#268053] hover:border-[#268053]/50 disabled:opacity-30 transition-all shadow-sm">
                    <ChevronLeft size={14} />
                  </Button>
                  {[...Array(totalPages)].map((_, i) => (
                    <Button key={i + 1} variant="outline" size="sm" onClick={() => setCurrentPage(i + 1)} className={`rounded-lg h-8 w-8 p-0 text-[10px] font-black transition-all ${currentPage === i + 1 ? "bg-[#268053] text-white border-transparent shadow-md" : "border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white"}`}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="rounded-lg h-8 w-8 p-0 border-slate-200 text-slate-500 hover:text-[#268053] hover:border-[#268053]/50 disabled:opacity-30 transition-all shadow-sm">
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ ROW 5: VENUE POPULARITY + CAPACITY ═══ */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-3xl p-8 shadow-[0_40px_80px_rgba(0,0,0,0.03)] border border-slate-100" style={{ animation: 'fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) 1000ms both' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#268053] flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight font-serif">Venue Popularity</h3>
              <p className="text-xs text-slate-500 font-medium">Booking distribution across halls</p>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={venueUsage} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="bookings">
                  {venueUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {venueUsage.slice(0, 6).map((v, i) => (
              <div key={v.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                <span className="text-[10px] font-bold text-slate-600 truncate">{v.name} ({v.bookings})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Capacity & Scaling */}
        <div className="bg-[#0f172a] rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-center" style={{ animation: 'fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) 1100ms both' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-2xl font-serif font-bold text-white">Venue Utilization</h3>
              <p className="text-slate-400 text-sm mt-1">Real-time occupancy across all halls</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-emerald-400">{occupancyRate}%</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Today's Rate</p>
            </div>
          </div>

          <div className="space-y-5 relative z-10">
            {venues.filter(v => v.status !== 'out_of_order').slice(0, 5).map(venue => {
              const venueBookingCount = bookings.filter(b =>
                b.venueId === venue.id &&
                b.startDate <= todayStr && b.endDate >= todayStr &&
                ['confirmed', 'reserved'].includes(b.status)
              ).length;
              const isOccupied = venueBookingCount > 0;
              return (
                <div key={venue.id}>
                  <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                    <span className="text-slate-400 truncate mr-4">{venue.name}</span>
                    <span className={isOccupied ? 'text-amber-400' : 'text-emerald-400'}>
                      {isOccupied ? `${venueBookingCount} Event${venueBookingCount > 1 ? 's' : ''}` : 'Available'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${isOccupied ? 'bg-amber-500' : 'bg-emerald-500/30'}`}
                      style={{ width: isOccupied ? '100%' : '10%' }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Today's Revenue Summary */}
          <div className="mt-8 pt-6 border-t border-white/5 relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <p className="text-xl font-black text-white mb-0.5">ETB {confirmedRevenue.toLocaleString()}</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Confirmed Revenue</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <p className="text-xl font-black text-amber-400 mb-0.5">ETB {pendingRevenue.toLocaleString()}</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pending Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Popup for Daily Events */}
      {selectedDayBookings && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedDayBookings(null)}>
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">Events on {getEthDateFull(selectedDayBookings.fullDate)}</h3>
                <p className="text-sm font-medium text-slate-500">{selectedDayBookings.bookings.length} events scheduled for {selectedDayBookings.name}</p>
              </div>
              <button onClick={() => setSelectedDayBookings(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-all shadow-sm">
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar bg-white">
              {selectedDayBookings.bookings.length === 0 ? (
                <div className="py-20 text-center">
                   <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                   <p className="text-slate-400 font-medium italic">No events scheduled for this day.</p>
                </div>
              ) : (
                selectedDayBookings.bookings.map(b => (
                  <div key={b.id} className="p-5 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#268053] flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{b.eventTitle}</p>
                        <div className="flex items-center gap-3 mt-1">
                           <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10} /> {b.startTime} - {b.endTime}</span>
                           <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Building size={10} /> {b.venueName}</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={b.status as any} />
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button onClick={() => setSelectedDayBookings(null)} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-100 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
