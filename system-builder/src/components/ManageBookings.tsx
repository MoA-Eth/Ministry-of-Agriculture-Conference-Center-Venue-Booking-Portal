import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  ChevronDown, ChevronUp, Clock, XCircle, Users, MapPin, Calendar,
  FileText, Activity, Trash2, Star, CreditCard, User, Mail, Phone,
  CheckCircle2, AlertTriangle, Building2, ChevronLeft, ChevronRight, Filter, X, Crown, Search
} from 'lucide-react';
import { EthiopianCalendar, ETH_MONTHS } from '@/components/ui/ethiopian-calendar';
import { EthDateTime } from 'ethiopian-calendar-date-converter';
import { Booking } from '@/lib/types';

// 1. STATUS STYLES
const statusStyles: Record<string, { bg: string, text: string, label: string, dot: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending / Tentative', dot: 'bg-amber-500' },
  partial_paid: { bg: 'bg-blue-50', text: 'text-blue-700', label: '1st Round Paid', dot: 'bg-blue-500' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Fully Paid', dot: 'bg-emerald-500' },
  approved: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'VIP Approved', dot: 'bg-purple-500' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected', dot: 'bg-red-500' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Cancelled', dot: 'bg-slate-400' },
  completed: { bg: 'bg-slate-800', text: 'text-white', label: 'Completed', dot: 'bg-white' },
};

type TabFilter = 'action' | 'partial' | 'confirmed' | 'vip' | 'rejected' | 'all';

// --- ETHIOPIAN DATE CONVERTER ---
const toEthDateString = (gStr: string | undefined | null) => {
  if (!gStr) return 'TBD';
  try {
    const [y, m, d] = gStr.split('T')[0].split('-').map(Number);
    const gDate = new Date(y, m - 1, d, 12, 0, 0);
    const ethDate = EthDateTime.fromEuropeanDate(gDate);
    return `${ETH_MONTHS[ethDate.month - 1]} ${ethDate.date}, ${ethDate.year}`;
  } catch {
    return gStr;
  }
};



export default function ManageBookings() {
  const { bookings, updateBookingStatus, cancelBooking, venues, technicalServices, supportServices, toEthTime } = useApp();
  const [activeTab, setActiveTab] = useState<TabFilter>('action');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filtering & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVenue, setFilterVenue] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCalendar, setShowCalendar] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterVenue, filterDate, filterStatus, searchQuery]);

  const [clashWarning, setClashWarning] = useState<{ isOpen: boolean, clashingBooking: Booking | null, attemptedAction?: { id: string, status: string } }>({ isOpen: false, clashingBooking: null });

  const baseFilteredBookings = bookings.filter(b => {
    let venueMatch = true;
    if (filterVenue !== 'all') {
      const bVenue = b.venue || b.venueId;
      venueMatch = String(bVenue) === String(filterVenue);
    }

    let dateMatch = true;
    if (filterDate) {
      const start = b.start_date || b.startDate;
      const end = b.end_date || b.endDate;
      if (start && end) {
        dateMatch = filterDate >= start && filterDate <= end;
      } else {
        dateMatch = false;
      }
    }

    let statusMatch = true;
    if (filterStatus !== 'all') {
      statusMatch = b.status === filterStatus;
    }

    let searchMatch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const vName = venues.find(v => String(v.id) === String(b.venueId || b.venue))?.name || '';
      const searchableText = `
        moa-bkg-${b.id}
        ${b.event_title || b.eventTitle || ''}
        ${b.organizer_name || b.organizerName || b.name || ''}
        ${b.organizer_email || b.organizerEmail || b.email || ''}
        ${b.organizer_phone || b.organizerPhone || b.phone || ''}
        ${vName}
      `.toLowerCase();
      searchMatch = searchableText.includes(q);
    }

    return venueMatch && dateMatch && statusMatch && searchMatch;
  });

  const counts = {
    action: baseFilteredBookings.filter(b => b.status === 'pending').length,
    partial: baseFilteredBookings.filter(b => b.status === 'partial_paid').length,
    confirmed: baseFilteredBookings.filter(b => ['paid', 'completed'].includes(b.status)).length,
    vip: baseFilteredBookings.filter(b => b.status === 'approved').length,
    rejected: baseFilteredBookings.filter(b => ['rejected', 'cancelled'].includes(b.status)).length,
    all: baseFilteredBookings.length,
  };

  const finalFilteredBookings = baseFilteredBookings.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'action') return b.status === 'pending';
    if (activeTab === 'partial') return b.status === 'partial_paid';
    if (activeTab === 'confirmed') return ['paid', 'completed'].includes(b.status);
    if (activeTab === 'vip') return b.status === 'approved';
    if (activeTab === 'rejected') return ['rejected', 'cancelled'].includes(b.status);
    return true;
  });

  const totalPages = Math.ceil(finalFilteredBookings.length / itemsPerPage);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return finalFilteredBookings.slice(start, start + itemsPerPage);
  }, [finalFilteredBookings, currentPage]);

  const handleStatusChange = async (id: string, status: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const targetBooking = bookings.find(b => String(b.id) === String(id));

    // --- UPGRADED CLASH ENGINE: Triggers for 1st Round, Full Pay, and VIP ---
    if (targetBooking && ['partial_paid', 'paid', 'approved'].includes(status)) {
      const clashingBooking = bookings.find(other => {
        // Don't compare the booking to itself
        if (String(other.id) === String(targetBooking.id)) return false;

        // Must be in the exact same venue
        const tVenue = targetBooking.venue || targetBooking.venueId;
        const oVenue = other.venue || other.venueId;
        if (String(oVenue) !== String(tVenue)) return false;

        // If the other booking is already holding this slot with money or power, trigger clash!
        if (!['partial_paid', 'paid', 'approved', 'completed'].includes(other.status?.toLowerCase())) return false;

        const tStartD = targetBooking.start_date || targetBooking.startDate;
        const tEndD = targetBooking.end_date || targetBooking.endDate;
        const oStartD = other.start_date || other.startDate;
        const oEndD = other.end_date || other.endDate;

        // Check if dates overlap at all
        const datesOverlap = tStartD <= oEndD && tEndD >= oStartD;
        if (!datesOverlap) return false;

        // Check specific times
        const tSched = targetBooking.daily_schedules || targetBooking.dailySchedules;
        const oSched = other.daily_schedules || other.dailySchedules;

        const myStart = tSched?.[0]?.startTime || targetBooking.start_time || targetBooking.startTime || '00:00';
        const myEnd = tSched?.[0]?.endTime || targetBooking.end_time || targetBooking.endTime || '23:59';
        const otherStart = oSched?.[0]?.startTime || other.start_time || other.startTime || '00:00';
        const otherEnd = oSched?.[0]?.endTime || other.end_time || other.endTime || '23:59';

        return myStart < otherEnd && myEnd > otherStart;
      });

      if (clashingBooking) {
        setClashWarning({ isOpen: true, clashingBooking, attemptedAction: { id, status } });
        return; // STOP EXECUTION! Do not show the prompt, do not update backend!
      }
    }

    let msg = `Change status to ${status}?`;
    if (status === 'partial_paid') msg = 'Confirm 1st Round Payment received?';
    if (status === 'paid') msg = 'Confirm Full Payment received?';
    if (status === 'approved') msg = 'Approve VIP Override? WARNING: This will immediately REJECT any conflicting standard bookings.';

    if (confirm(msg)) {
      setPendingActionId(`${id}-${status}`);
      try {
        await updateBookingStatus(id, status as any);
      } catch (err) {
        toast.error("Failed to update status.");
      } finally {
        setPendingActionId(null);
      }
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Permanently delete/cancel this booking?')) {
      cancelBooking(id);
    }
  };

  const handleInitReject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRejectingId(id);
    setExpandedId(id);
    setRejectReason('We regret to inform you that your booking request could not be accommodated. This time slot has been overridden by a high-priority state/ministerial event, or there was a scheduling conflict. We apologize for any inconvenience.');
  };

  const handleConfirmReject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rejectReason.trim()) return toast.error('Please provide a reason');
    updateBookingStatus(id, 'rejected', rejectReason.trim());
    setRejectingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-in fade-in duration-500">

      {/* Clash Warning Popup */}
      {clashWarning.isOpen && clashWarning.clashingBooking && (() => {
        const cBooking = clashWarning.clashingBooking;
        const cOrgName = cBooking.organizer_name || cBooking.organizerName || cBooking.name || 'Unknown Organizer';
        const cTitle = cBooking.event_title || cBooking.eventTitle || cBooking.title || 'Untitled Event';
        const cStartD = cBooking.start_date || cBooking.startDate || '';
        const cEndD = cBooking.end_date || cBooking.endDate || '';
        const cSched = cBooking.daily_schedules || cBooking.dailySchedules;
        const cTimeStart = toEthTime(cSched?.[0]?.startTime || cBooking.start_time || cBooking.startTime);
        const cTimeEnd = toEthTime(cSched?.[0]?.endTime || cBooking.end_time || cBooking.endTime);

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setClashWarning({ isOpen: false, clashingBooking: null })}>
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 bg-red-50 border-4 border-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={36} />
              </div>
              <h2 className="text-3xl font-serif font-black text-center text-slate-800 mb-2 tracking-tight">Scheduling Clash!</h2>
              <p className="text-center text-slate-500 font-medium mb-8 leading-relaxed px-4">
                You cannot confirm this request because the venue is already secured by someone else during this exact time.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-inner">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Already Confirmed By</p>
                <p className="text-xl font-bold text-red-900">{cOrgName}</p>
                <p className="text-sm font-medium text-red-700/80 mt-1 italic">"{cTitle}"</p>

                <div className="mt-4 pt-4 border-t border-red-200 flex flex-col gap-2 text-sm font-bold text-red-800">
                  <span className="flex items-center gap-2"><Calendar size={16} className="text-red-500" />
                    {cStartD === cEndD ? toEthDateString(cStartD) : `${toEthDateString(cStartD).split(',')[0]} - ${toEthDateString(cEndD)}`}
                  </span>
                  <span className="flex items-center gap-2"><Clock size={16} className="text-red-500" />
                    {cTimeStart} to {cTimeEnd} (Local)
                  </span>
                </div>
              </div>

              {clashWarning.attemptedAction?.status === 'approved' ? (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-red-600 text-center px-4">
                    Continuing with a VIP Override will <span className="underline uppercase font-black">automatically reject</span> the existing booking.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="flex-1 font-bold h-12" onClick={() => setClashWarning({ isOpen: false, clashingBooking: null })}>Cancel</Button>
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 shadow-md" onClick={() => {
                      updateBookingStatus(clashWarning.attemptedAction!.id, 'approved');
                      setClashWarning({ isOpen: false, clashingBooking: null });
                    }}><Star className="w-4 h-4 mr-2" /> Force VIP Override</Button>
                  </div>
                </div>
              ) : (
                <Button className="w-full bg-[#111827] hover:bg-slate-800 text-white font-black py-6 rounded-xl shadow-xl uppercase tracking-widest" onClick={() => setClashWarning({ isOpen: false, clashingBooking: null })}>
                  Dismiss & Review Calendar
                </Button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-[#268053]" /> Manage Bookings
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Verify payments on pending requests, apply VIP overrides, or search history.</p>
      </div>

      {/* NEW Filter & Search Bar Layout */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        
        {/* Left Side: Filter Label + Global Search Input */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
          <div className="flex items-center gap-2 text-slate-500 shrink-0">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-widest">Filters</span>
          </div>
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, name, venue, event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] transition-all"
            />
          </div>
        </div>
        
        {/* Right Side: Dropdowns */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
          
          {/* Venue Dropdown */}
          <div className="relative w-full sm:w-auto shrink-0">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterVenue}
              onChange={e => setFilterVenue(e.target.value)}
              className="w-full sm:w-44 pl-9 pr-8 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] appearance-none cursor-pointer transition-all"
            >
              <option value="all">All Venues</option>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          {/* Specific Status Dropdown */}
          <div className="relative w-full sm:w-auto shrink-0">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full sm:w-44 pl-9 pr-8 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] appearance-none cursor-pointer transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="partial_paid">1st Round Paid</option>
              <option value="paid">Confirmed (Fully Paid)</option>
              <option value="approved">VIP Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Ethiopian Calendar Popover */}
          <div className="relative w-full sm:w-auto shrink-0">
            <div 
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 w-full sm:w-44 pl-9 pr-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg outline-none hover:bg-slate-100 hover:border-emerald-200 transition-all cursor-pointer"
            >
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <span className="truncate">{filterDate ? toEthDateString(filterDate) : 'Any Date'}</span>
            </div>

            {showCalendar && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2">
                  <EthiopianCalendar 
                    selected={{ from: filterDate ? parseISO(filterDate) : undefined, to: filterDate ? parseISO(filterDate) : undefined }} 
                    onSelect={(r) => { 
                      setFilterDate(r?.from ? format(r.from, 'yyyy-MM-dd') : ''); 
                      if(r?.from) setShowCalendar(false);
                    }} 
                  />
                </div>
              </>
            )}
          </div>

          {/* Clear Filters Button */}
          {(filterVenue !== 'all' || filterDate !== '' || filterStatus !== 'all' || searchQuery !== '') && (
            <Button 
              variant="ghost" 
              onClick={() => { setFilterVenue('all'); setFilterDate(''); setFilterStatus('all'); setSearchQuery(''); }}
              className="w-full sm:w-auto text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold px-3 h-10 shrink-0"
            >
              <X className="w-4 h-4 mr-1.5" /> Clear Filters
            </Button>
          )}

        </div>
      </div>

      {/* Tab Filters (Categories) */}
      <div className="flex overflow-x-auto pb-2 mb-6 border-b border-slate-200 hide-scrollbar">
        {(['action', 'partial', 'confirmed', 'vip', 'rejected', 'all'] as TabFilter[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setExpandedId(null); setRejectingId(null); }}
            className={`whitespace-nowrap px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-[#268053] text-[#268053]' : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'
              }`}
          >
            {tab === 'action' ? 'Awaiting Action' :
             tab === 'partial' ? '1st Round Paid' :
             tab === 'confirmed' ? 'Fully Paid' :
             tab === 'vip' ? 'VIP Approved' :
             tab === 'rejected' ? 'Rejected' : 'All Bookings'}
            <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs transition-colors ${activeTab === tab ? 'bg-[#268053] text-white' : 'bg-slate-100 text-slate-500'
              }`}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Admin Booking List */}
      <div className="space-y-4">
        {paginatedBookings.length === 0 ? (
           <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center text-slate-500">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="font-bold">No bookings found.</p>
              <p className="text-sm">Try clearing your search query or filters.</p>
           </div>
        ) : paginatedBookings.map((b, i) => {

          const safeId = String(b.id);
          const title = b.event_title || b.eventTitle || b.title || 'Untitled Event';
          const orgName = b.organizer_name || b.organizerName || b.name || b.full_name || 'Unknown Organizer';
          const orgEmail = b.organizer_email || b.organizerEmail || b.email || 'No Email';
          const orgPhone = b.organizer_phone || b.organizerPhone || b.phone || 'No Phone Number';
          const orgOrg = b.organization || b.organizer_organization || b.organizerOrganization || b.company || 'No Organization Listed';
          const desc = b.event_description || b.eventDescription || b.description || 'No description provided.';
          const pax = b.participant_count || b.participantCount || b.pax || 0;

          const isVipBooking = title.includes('⭐ [VIP OVERRIDE]');

          const startDate = b.start_date || b.startDate || '';
          const endDate = b.end_date || b.endDate || '';
          
          const startTime = toEthTime(b.start_time || b.startTime);
          const endTime = toEthTime(b.end_time || b.endTime);
          
          const attachment = b.letter_attachment || b.letterAttachment || b.attachment;

          const venueId = b.venue || b.venueId;
          const venue = venues.find(v => String(v.id) === String(venueId));
          const venueName = venue?.name || b.venue_name || b.venueName || 'Unknown Venue';

          const grandTotal = b.totalPrice || b.total_price || 0;

          const techIds = b.technical_services || b.technicalServices || [];
          const suppIds = b.support_services || b.supportServices || [];
          const allRequestedServices: { id: string, name: string, isUnavailable: boolean, type: 'tech' | 'supp' }[] = [];
          
          techIds.forEach((id: any) => {
            const s = technicalServices.find(t => String(t.id) === String(id));
            if (s) {
              allRequestedServices.push({ 
                id: String(id), 
                name: s.name, 
                isUnavailable: (b.unavailableTechnicalServices || []).includes(String(id)),
                type: 'tech'
              });
            }
          });
          suppIds.forEach((id: any) => {
            const s = supportServices.find(t => String(t.id) === String(id));
            if (s) {
              allRequestedServices.push({ 
                id: String(id), 
                name: s.name, 
                isUnavailable: (b.unavailableSupportServices || []).includes(String(id)),
                type: 'supp'
              });
            }
          });

          const isExpanded = expandedId === safeId;
          const isRejecting = rejectingId === safeId;
          const statusLower = (b.status || '').toLowerCase();
          const style = statusStyles[statusLower] || statusStyles.pending;

          const hasTechnicalConflict = b.ictAcknowledged && allRequestedServices.some(s => s.type === 'tech' && s.isUnavailable);
          const hasCateringConflict = b.cateringAcknowledged && allRequestedServices.some(s => s.type === 'supp' && s.isUnavailable);
          const hasAnyConflict = hasTechnicalConflict || hasCateringConflict;

          let unavailableDeduction = 0;
          allRequestedServices.forEach(s => {
            const isShownAsUnavailable = s.isUnavailable && (s.type === 'tech' ? b.ictAcknowledged : b.cateringAcknowledged);
            if (isShownAsUnavailable) {
              const fullService = (s.type === 'tech' ? technicalServices : supportServices).find(x => String(x.id) === s.id);
              if (fullService) unavailableDeduction += parseFloat(fullService.price || 0);
            }
          });
          const adjustedTotal = Math.max(0, grandTotal - unavailableDeduction);

          return (
            <div key={safeId} className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'shadow-lg border-[#268053]/50 ring-2 ring-[#268053]/20 my-6' : 'shadow-sm hover:shadow-md'}`}>

              {/* TOP HEADER */}
              <div className={`p-4 sm:p-5 cursor-pointer group ${isExpanded ? 'bg-slate-50/50' : ''}`} onClick={() => !isRejecting && setExpandedId(isExpanded ? null : safeId)}>
                <div className="flex flex-col gap-3">

                  {/* Title + status row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isVipBooking && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                        <Crown size={12} /> VIP REQUEST
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`}></span> {style.label}
                      {hasAnyConflict && (
                        <>
                          <span className="w-1 h-3 border-l border-current/20 ml-1"></span>
                          <span className="text-red-600 font-black ml-1 uppercase tracking-tighter">Unavailable Resources</span>
                        </>
                      )}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate group-hover:text-[#268053] transition-colors flex-1 min-w-0">{title}</h3>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5 shrink-0"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span>{venueName}</span></div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {startDate === endDate
                          ? toEthDateString(startDate)
                          : `${toEthDateString(startDate).split(',')[0]} – ${toEthDateString(endDate)}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-[#268053] bg-emerald-50 px-2 py-0.5 rounded">
                        {startTime} - {endTime} Local
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0"><User className="w-3.5 h-3.5 text-slate-400" /><span>{orgName}</span></div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                    {/* Normal Users Payment Flow */}
                    {statusLower === 'pending' && !isRejecting && !isVipBooking && (
                      <>
                        <Button 
                          disabled={pendingActionId !== null}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4" 
                          onClick={(e) => handleStatusChange(safeId, 'partial_paid', e)}
                        >
                          {pendingActionId === `${safeId}-partial_paid` ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" /> : null}
                          {pendingActionId === `${safeId}-partial_paid` ? 'Processing...' : 'Confirm 1st Round'}
                        </Button>
                        <Button 
                          disabled={pendingActionId !== null}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4" 
                          onClick={(e) => handleStatusChange(safeId, 'paid', e)}
                        >
                          {pendingActionId === `${safeId}-paid` ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" /> : null}
                          {pendingActionId === `${safeId}-paid` ? 'Processing...' : 'Confirm Full Paid'}
                        </Button>
                      </>
                    )}

                    {statusLower === 'partial_paid' && !isRejecting && (
                      <Button 
                        disabled={pendingActionId !== null}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4" 
                        onClick={(e) => handleStatusChange(safeId, 'paid', e)}
                      >
                        {pendingActionId === `${safeId}-paid` ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" /> : null}
                        {pendingActionId === `${safeId}-paid` ? 'Processing...' : 'Confirm Full Paid'}
                      </Button>
                    )}

                    {/* VIP Users Approval Flow */}
                    {statusLower === 'pending' && !isRejecting && isVipBooking && (
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm text-xs sm:text-sm h-9 sm:h-10" onClick={(e) => handleStatusChange(safeId, 'approved', e)}>
                        <Star className="w-3.5 h-3.5 mr-1.5" /> Approve VIP
                      </Button>
                    )}

                    {/* Reject button */}
                    {['pending', 'partial_paid'].includes(statusLower) && !isRejecting && (
                      <Button variant="outline" className="text-red-600 hover:bg-red-50 border-red-200 shadow-sm h-9 sm:h-10 w-9 sm:w-10 p-0" onClick={(e) => handleInitReject(safeId, e)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}

                    {/* Completion from paid or VIP approved */}
                    {['paid', 'approved'].includes(statusLower) && (
                      <Button variant="outline" className="text-slate-700 border-slate-300 font-bold shadow-sm text-xs sm:text-sm h-9 sm:h-10 px-3" onClick={(e) => handleStatusChange(safeId, 'completed', e)}>
                        Mark Completed
                      </Button>
                    )}

                    <ChevronDown className={`w-5 h-5 text-slate-400 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>

              {/* EXPANDED RICH DETAILS AREA */}
              {isExpanded && (
                <div className="border-t-2 border-slate-100 bg-white p-4 sm:p-8 cursor-default animate-in fade-in slide-in-from-top-4 duration-300" onClick={(e) => e.stopPropagation()}>

                  {isRejecting && (
                    <div className="mb-6 sm:mb-8 bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6 shadow-sm">
                      <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2 text-sm"><XCircle className="w-4 h-4" /> Reason for Cancellation/Rejection</h4>
                      <textarea autoFocus value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full text-sm border border-red-200 rounded-lg p-4 shadow-inner resize-none focus:outline-none focus:ring-2 focus:ring-red-500" rows={3} placeholder="Please provide the exact reason why this is rejected. The user will see this." />
                      <div className="flex justify-end gap-3 mt-4">
                        <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setRejectingId(null); }}>Cancel</Button>
                        <Button variant="destructive" onClick={(e) => handleConfirmReject(safeId, e)}>Confirm Rejection</Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

                    {/* COLUMN 1: Organizer Details */}
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Organizer Details</p>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-200">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref ID</span>
                             <span className="font-mono font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">MOA-BKG-{safeId}</span>
                          </div>
                          
                          <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-200">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</span>
                             <span className="font-bold text-[#268053] flex items-center gap-1.5"><Clock size={12}/> {startTime} to {endTime} (Local)</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-slate-400"><User size={16} /></div>
                            <span className="font-bold text-slate-800">{orgName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-slate-400"><Building2 size={16} /></div>
                            <span className="text-sm font-medium text-slate-600">{orgOrg}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-slate-400"><Mail size={16} /></div>
                            <span className="text-sm font-medium text-slate-600">{orgEmail}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-slate-400"><Phone size={16} /></div>
                            <span className="text-sm font-medium text-slate-600">{orgPhone}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Event Description</p>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 h-32 overflow-y-auto custom-scrollbar">
                          <p className={`text-sm leading-relaxed ${desc === 'No description provided.' ? 'text-slate-400 italic font-medium' : 'text-slate-600 font-bold'}`}>{desc}</p>
                        </div>
                      </div>
                    </div>

                    {/* COLUMN 2: Services & Documents */}
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Requested Resources</p>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                          {allRequestedServices.length === 0 ? (
                            <p className="text-slate-400 italic text-sm font-bold">No extra services requested.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {allRequestedServices.map((s, idx) => {
                                const isShownAsUnavailable = s.isUnavailable && (s.type === 'tech' ? b.ictAcknowledged : b.cateringAcknowledged);
                                return (
                                  <span key={idx} className={`px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm border transition-all ${isShownAsUnavailable ? 'bg-red-50 border-red-200 text-red-700 ring-2 ring-red-100 animate-in zoom-in-95' : 'bg-white border-slate-200 text-slate-700'}`}>
                                    {s.name}
                                    {isShownAsUnavailable && <span className="ml-1.5 text-[9px] font-black uppercase text-red-500">Unavailable</span>}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Display custom schedule array if it exists */}
                      {(b.daily_schedules || b.dailySchedules)?.length > 0 && (
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Custom Schedule</p>
                           <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                              {(b.daily_schedules || b.dailySchedules).map((ds: any, dIdx: number) => (
                                 <div key={dIdx} className="flex justify-between items-center text-xs font-bold bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                    <span className="text-slate-700">{toEthDateString(ds.date)}</span>
                                    <span className="text-[#268053] bg-emerald-50 px-2 py-0.5 rounded">
                                       {ds.allDay ? 'Full Day' : `${toEthTime(ds.startTime)} - ${toEthTime(ds.endTime)} (Local)`}
                                    </span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      )}

                      {attachment && (
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Official Documents</p>
                          <a href={attachment} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-[#268053]"><FileText size={20} /></div>
                              <div>
                                <p className="font-bold text-[#268053] text-sm">Request Letter</p>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">View PDF Document</p>
                              </div>
                            </div>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* COLUMN 3: Financials & Pax */}
                    <div className="space-y-6">
                      <div className="bg-[#268053] border border-[#1a5a3a] rounded-2xl p-6 shadow-lg relative overflow-hidden text-white">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-4 relative z-10">Total Valuation</p>
                        <div className="flex flex-col mb-4 relative z-10">
                          <p className="text-4xl font-black">ETB {Number(adjustedTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          {unavailableDeduction > 0 && (
                            <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest mt-1">
                              (-{unavailableDeduction.toFixed(2)} Deduction for Unavailable Services)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1 border-t border-white/10 pt-4 relative z-10">
                          <div className="flex justify-between text-xs font-medium text-emerald-100">
                            <span>Payment Status:</span>
                            <span className="font-bold">
                              {statusLower === 'paid' ? 'FULLY PAID' : 
                               statusLower === 'partial_paid' ? '1ST ROUND PAID' :
                               statusLower === 'approved' ? 'VIP (WAIVED)' : 
                               'PENDING'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attendees Expected</p>
                          <p className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Users className={`w-5 h-5 ${pax > (venue?.capacity || Infinity) ? 'text-red-500' : 'text-[#268053]'}`} />
                            <span className={pax > (venue?.capacity || Infinity) ? 'text-red-600' : ''}>{pax}</span>
                            <span className="text-sm font-bold text-slate-400">/ {venue?.capacity || '∞'} Max</span>
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Admin Delete Action */}
                  <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                    <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold px-6 py-5" onClick={(e) => handleDelete(safeId, e)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Booking Record
                    </Button>
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 sm:px-6 py-4 rounded-xl border border-slate-200 mt-6 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Showing <span className="text-slate-900">{Math.min(finalFilteredBookings.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(finalFilteredBookings.length, currentPage * itemsPerPage)}</span> of {finalFilteredBookings.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="rounded-lg h-9 w-9 p-0 border-slate-200 text-slate-500 hover:text-[#268053] hover:border-[#268053]/50 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={16} />
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`rounded-lg h-9 w-9 p-0 font-bold text-xs transition-all ${currentPage === i + 1
                      ? "bg-[#268053] text-white hover:bg-[#1b5e3a] border-transparent shadow-lg"
                      : "border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="rounded-lg h-9 w-9 p-0 border-slate-200 text-slate-500 hover:text-[#268053] hover:border-[#268053]/50 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}