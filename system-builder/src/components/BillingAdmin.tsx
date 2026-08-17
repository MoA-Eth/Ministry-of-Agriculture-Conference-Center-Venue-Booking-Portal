import React, { useMemo, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Booking } from '@/lib/types';
import { 
  Banknote, FileText, CheckCircle2, Clock, Search, Filter, AlertCircle, 
  ArrowUpRight, DollarSign, Printer, X, CreditCard, Building2, Calendar, 
  Receipt, ShieldCheck, Check, Sparkles, ChevronRight, UserCheck, HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function BillingAdmin() {
  const { bookings, updateBookingStatus, technicalServices, supportServices, venues } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'action_required' | 'partial_paid' | 'paid'>('all');
  const [filterVenue, setFilterVenue] = useState<string>('all');
  
  // Modals state
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [paymentModalBooking, setPaymentModalBooking] = useState<Booking | null>(null);
  const [paymentTargetStatus, setPaymentTargetStatus] = useState<'partial_paid' | 'paid' | 'completed'>('paid');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (CBE / Telebirr)');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // ─── ADJUSTED PRICE CALCULATOR ────────────────────────────
  const calculateAdjustedPrice = (b: Booking) => {
    let deduction = 0;
    if (b.ictAcknowledged && b.unavailableTechnicalServices) {
      b.unavailableTechnicalServices.forEach(id => {
        const s = technicalServices.find(ts => String(ts.id) === String(id));
        if (s) deduction += Number(s.price || 0);
      });
    }
    if (b.cateringAcknowledged && b.unavailableSupportServices) {
      b.unavailableSupportServices.forEach(id => {
        const s = supportServices.find(ss => String(ss.id) === String(id));
        if (s) deduction += Number(s.price || 0);
      });
    }
    const base = Number(b.totalPrice || b.total_price || 0);
    return Math.max(0, base - deduction);
  };

  // Format currency: Exact amount with commas and ETB suffix after amount
  const formatMoney = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0.00 ETB';
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
  };

  // Derive "billing status"
  const getBillingStatus = (status: string) => {
    switch(status) {
      case 'paid': 
      case 'confirmed': 
        return { label: 'Fully Paid (100%)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> };
      case 'completed': 
        return { label: 'Settled & Closed', color: 'bg-teal-100 text-teal-800 border-teal-200', icon: <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> };
      case 'partial_paid': 
        return { label: 'Advance Deposit (50%)', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CreditCard className="w-3.5 h-3.5 text-blue-600" /> };
      case 'approved': 
      case 'management_approved': 
        return { label: 'Awaiting Payment', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="w-3.5 h-3.5 text-amber-600" /> };
      case 'reserved':
      case 'pending': 
        return { label: 'Pending Approval', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> };
      default: 
        return { label: 'N/A', color: 'bg-slate-100 text-slate-500 border-slate-100', icon: null };
    }
  };

  // Filtered Bookings List
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Exclude rejected/cancelled events from financial ledger
      if (['rejected', 'cancelled'].includes(b.status)) return false;
      
      const searchMatch = (b.eventTitle || '').toLowerCase().includes(search.toLowerCase()) || 
                          (b.organizerOrganization || b.organization || '').toLowerCase().includes(search.toLowerCase()) ||
                          (b.organizerName || '').toLowerCase().includes(search.toLowerCase()) ||
                          (String(b.id)).toLowerCase().includes(search.toLowerCase());

      let venueMatch = true;
      if (filterVenue !== 'all') {
        venueMatch = String(b.venueId || b.venue) === String(filterVenue);
      }
      
      let statusMatch = true;
      if (filterStatus === 'action_required') {
        statusMatch = ['management_approved', 'approved', 'partial_paid'].includes(b.status);
      } else if (filterStatus === 'partial_paid') {
        statusMatch = b.status === 'partial_paid';
      } else if (filterStatus === 'paid') {
        statusMatch = ['paid', 'confirmed', 'completed'].includes(b.status);
      }
      
      return searchMatch && venueMatch && statusMatch;
    }).sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());
  }, [bookings, search, filterStatus, filterVenue]);

  // Financial Metrics
  const totalCollected = useMemo(() => {
    return bookings
      .filter(b => ['paid', 'confirmed', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + calculateAdjustedPrice(b), 0);
  }, [bookings, technicalServices, supportServices]);

  const totalAdvanceDeposits = useMemo(() => {
    return bookings
      .filter(b => b.status === 'partial_paid')
      .reduce((sum, b) => sum + (calculateAdjustedPrice(b) * 0.5), 0);
  }, [bookings, technicalServices, supportServices]);

  const totalReceivables = useMemo(() => {
    return bookings.reduce((sum, b) => {
      const price = calculateAdjustedPrice(b);
      if (['approved', 'management_approved'].includes(b.status)) {
        return sum + price;
      } else if (b.status === 'partial_paid') {
        return sum + (price * 0.5); // remaining 50%
      }
      return sum;
    }, 0);
  }, [bookings, technicalServices, supportServices]);

  const actionRequiredCount = useMemo(() => {
    return bookings.filter(b => ['management_approved', 'approved', 'partial_paid'].includes(b.status)).length;
  }, [bookings]);

  // Handle Payment Recording Submission
  const handleConfirmPayment = async () => {
    if (!paymentModalBooking) return;
    setIsUpdating(true);
    try {
      await updateBookingStatus(paymentModalBooking.id, paymentTargetStatus);
      toast.success(`Payment status updated to ${paymentTargetStatus.replace('_', ' ').toUpperCase()}`);
      setPaymentModalBooking(null);
      setPaymentRef('');
      setPaymentNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 animate-in fade-in zoom-in-95 duration-500">
      
      {/* ─── HEADER ────────────────────────────────────────────── */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-r from-emerald-900 via-[#184e34] to-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md">
              <Banknote className="w-7 h-7 text-emerald-400" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Finance & Billing Management
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">
            Revenue Ledger & Invoicing
          </h1>
          <p className="text-emerald-100/70 text-sm mt-1 max-w-xl font-medium">
            Ministry of Agriculture Conference Center financial ledger. Record deposits, process venue invoices, and track accounts receivable.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 px-5 py-3 rounded-2xl text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">Total Active Bookings</span>
            <span className="text-2xl font-black text-white">{filteredBookings.length} Events</span>
          </div>
        </div>
      </div>

      {/* ─── FINANCIAL KPI CARDS ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        
        {/* Card 1: Total Collected */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Settled Revenue</p>
            <p className="text-xl font-black text-slate-900">{formatMoney(totalCollected)}</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fully paid bookings
            </p>
          </div>
        </div>

        {/* Card 2: Advance Deposits */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Advance Deposits (50%)</p>
            <p className="text-xl font-black text-slate-900">{formatMoney(totalAdvanceDeposits)}</p>
            <p className="text-[10px] font-bold text-blue-600 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Received 50% deposits
            </p>
          </div>
        </div>

        {/* Card 3: Receivables */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Outstanding Receivables</p>
            <p className="text-xl font-black text-amber-600">{formatMoney(totalReceivables)}</p>
            <p className="text-[10px] font-bold text-amber-700 mt-0.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Pending collection
            </p>
          </div>
        </div>

        {/* Card 4: Action Required */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg flex items-center gap-4 relative overflow-hidden group hover:shadow-xl transition-all text-white">
          <div className="w-13 h-13 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Payment Queue</p>
            <p className="text-xl font-black text-white">{actionRequiredCount} Action Items</p>
            <p className="text-[10px] font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Ready for processing
            </p>
          </div>
        </div>

      </div>

      {/* ─── FILTERS & LEDGER TABLE ────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        
        {/* Filters Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-50/50">
          
          {/* Search */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by event, organization, organizer, ref ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Status Tabs & Venue Filter */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            
            {/* Status Pills */}
            <div className="bg-slate-200/60 p-1 rounded-2xl flex items-center gap-1">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('action_required')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${filterStatus === 'action_required' ? 'bg-[#268053] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Action Needed ({actionRequiredCount})
              </button>
              <button
                onClick={() => setFilterStatus('partial_paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === 'partial_paid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Advance Paid (50%)
              </button>
              <button
                onClick={() => setFilterStatus('paid')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterStatus === 'paid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Settled / Full
              </button>
            </div>

            {/* Venue Select */}
            <select
              value={filterVenue}
              onChange={e => setFilterVenue(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#268053]/20"
            >
              <option value="all">All Venues</option>
              {venues.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>

          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Ref & Event Title</th>
                <th className="px-6 py-4">Client / Organization</th>
                <th className="px-6 py-4">Venue & Dates</th>
                <th className="px-6 py-4">Calculated Amount</th>
                <th className="px-6 py-4">Billing Status</th>
                <th className="px-6 py-4 text-right">Finance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4 border border-slate-100">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-slate-700 font-bold text-base">No billing records found</p>
                    <p className="text-slate-400 text-xs mt-1">Try clearing filters or searching for another organizer/event title.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const billStatus = getBillingStatus(b.status);
                  const netPrice = calculateAdjustedPrice(b);
                  const isActionable = ['management_approved', 'approved', 'partial_paid'].includes(b.status);

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors group">
                      
                      {/* Ref & Title */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            MOA-BKG-{b.id}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 mt-1 leading-snug">{b.eventTitle}</div>
                      </td>

                      {/* Client */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{b.organizerOrganization || b.organization || 'Ministry Partner'}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" /> {b.organizerName}
                        </div>
                      </td>

                      {/* Dates & Venue */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#268053]" /> {b.venueName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> {b.startDate} to {b.endDate}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900 text-base">{formatMoney(netPrice)}</div>
                        {b.status === 'partial_paid' && (
                          <div className="text-[10px] text-blue-600 font-bold mt-0.5">
                            Paid 50%: {formatMoney(netPrice * 0.5)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${billStatus.color}`}>
                          {billStatus.icon}
                          {billStatus.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* Payment Processing Trigger */}
                          {isActionable && (
                            <button
                              onClick={() => {
                                setPaymentModalBooking(b);
                                setPaymentTargetStatus(b.status === 'partial_paid' ? 'paid' : 'partial_paid');
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#268053] text-white rounded-xl text-xs font-bold hover:bg-[#1e6642] focus:ring-4 focus:ring-[#268053]/20 transition-all shadow-sm"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {b.status === 'partial_paid' ? 'Collect Balance (50%)' : 'Record Payment'}
                            </button>
                          )}

                          {/* Official Invoice / Receipt Modal Trigger */}
                          <button
                            onClick={() => setSelectedInvoiceBooking(b)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#268053]" />
                            {['paid', 'confirmed', 'completed'].includes(b.status) ? 'Receipt' : 'Invoice'}
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ─── RECORD PAYMENT MODAL ──────────────────────────────── */}
      {paymentModalBooking && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setPaymentModalBooking(null)}>
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-[#268053] p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
                  <Banknote className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-white leading-tight">Process Payment Transaction</h3>
                  <p className="text-xs text-emerald-100/80 font-medium">Ref: MOA-BKG-{paymentModalBooking.id} • {paymentModalBooking.eventTitle}</p>
                </div>
              </div>
              <button onClick={() => setPaymentModalBooking(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Event Price Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Net Calculated Fee</span>
                  <span className="text-xs text-slate-500 font-medium">{paymentModalBooking.organizerOrganization || paymentModalBooking.organization}</span>
                </div>
                <span className="text-xl font-black text-slate-900">
                  {formatMoney(calculateAdjustedPrice(paymentModalBooking))}
                </span>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Select Payment Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentTargetStatus('partial_paid')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${paymentTargetStatus === 'partial_paid' ? 'border-[#268053] bg-emerald-50/50 text-[#268053]' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                  >
                    <div className="font-bold text-xs">50% Advance Deposit</div>
                    <div className="text-[11px] opacity-75 mt-0.5">{formatMoney(calculateAdjustedPrice(paymentModalBooking) * 0.5)}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentTargetStatus('paid')}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all ${paymentTargetStatus === 'paid' ? 'border-[#268053] bg-emerald-50/50 text-[#268053]' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                  >
                    <div className="font-bold text-xs">100% Full Payment</div>
                    <div className="text-[11px] opacity-75 mt-0.5">{formatMoney(calculateAdjustedPrice(paymentModalBooking))}</div>
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#268053]/20"
                >
                  <option value="Bank Transfer (CBE / Telebirr)">Bank Transfer (CBE / Telebirr)</option>
                  <option value="Certified Cheque (CPO)">Certified Cheque (CPO)</option>
                  <option value="Cash Receipt">Cash Deposit / Counter Receipt</option>
                  <option value="Government Budget Transfer">Government Inter-Departmental Transfer</option>
                </select>
              </div>

              {/* Transaction / Receipt Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Transaction Ref / Receipt No. (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CBE-TXN-9823412 or Receipt #1042"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#268053]/20 placeholder:text-slate-400"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPaymentModalBooking(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isUpdating}
                className="px-6 py-2.5 rounded-xl bg-[#268053] text-white font-bold text-xs hover:bg-[#1e6642] focus:ring-4 focus:ring-[#268053]/20 transition-all disabled:opacity-50 shadow-md shadow-[#268053]/20 flex items-center gap-2"
              >
                {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isUpdating ? 'Saving...' : 'Confirm & Record Payment'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── OFFICIAL PRO-FORMA INVOICE & RECEIPT MODAL ────────── */}
      {selectedInvoiceBooking && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto" onClick={() => setSelectedInvoiceBooking(null)}>
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            
            {/* Modal Controls Bar */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">
                  {['paid', 'confirmed', 'completed'].includes(selectedInvoiceBooking.status) ? 'Official Payment Receipt' : 'Pro-Forma Invoice'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-[#268053] hover:bg-[#1e6642] text-white px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  onClick={() => setSelectedInvoiceBooking(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 sm:p-12 overflow-y-auto space-y-8 print:p-0 print:overflow-visible">
              
              {/* Document Header / Ministry Branding */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center">
                      MoA
                    </div>
                    <div>
                      <h2 className="font-serif font-bold text-slate-900 text-lg leading-tight">Ministry of Agriculture</h2>
                      <p className="text-xs font-semibold text-slate-500">Federal Democratic Republic of Ethiopia</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Conference Center & Event Logistics Office • CMC Road, Addis Ababa</p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                    {['paid', 'confirmed', 'completed'].includes(selectedInvoiceBooking.status) ? 'RECEIPT' : 'PRO-FORMA INVOICE'}
                  </span>
                  <p className="text-xs font-mono text-slate-500 font-bold">Doc #: MOA-FIN-2026-{selectedInvoiceBooking.id}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">Booking Ref: MOA-BKG-{selectedInvoiceBooking.id}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Date: {format(new Date(), 'MMMM d, yyyy')}</p>
                </div>
              </div>

              {/* Billed To & Event Card */}
              <div className="grid sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Billed Client / Organization</h4>
                  <p className="font-bold text-slate-900 text-sm">{selectedInvoiceBooking.organizerOrganization || selectedInvoiceBooking.organization || 'Ministry Partner'}</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">Attn: {selectedInvoiceBooking.organizerName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedInvoiceBooking.organizerEmail}</p>
                  {selectedInvoiceBooking.organizerPhone && <p className="text-xs text-slate-500">{selectedInvoiceBooking.organizerPhone}</p>}
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Event Summary</h4>
                  <p className="font-bold text-slate-900 text-sm">{selectedInvoiceBooking.eventTitle}</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">Venue: {selectedInvoiceBooking.venueName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Dates: {selectedInvoiceBooking.startDate} to {selectedInvoiceBooking.endDate}</p>
                  <p className="text-xs text-slate-500">Participants: {selectedInvoiceBooking.participantCount} Guests</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Itemized Financial Breakdown</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-center">Status / Adjustments</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      
                      {/* Venue Line */}
                      <tr>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{selectedInvoiceBooking.venueName} Rental</div>
                          <div className="text-[11px] text-slate-500">Facility usage for scheduled event dates</div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Included
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          {formatMoney(selectedInvoiceBooking.totalPrice || selectedInvoiceBooking.total_price || 0)}
                        </td>
                      </tr>

                      {/* Technical Services Deductions Callout if any */}
                      {selectedInvoiceBooking.ictAcknowledged && selectedInvoiceBooking.unavailableTechnicalServices && selectedInvoiceBooking.unavailableTechnicalServices.length > 0 && (
                        selectedInvoiceBooking.unavailableTechnicalServices.map(id => {
                          const s = technicalServices.find(ts => String(ts.id) === String(id));
                          return s ? (
                            <tr key={`tech-${id}`} className="bg-rose-50/40">
                              <td className="px-4 py-3">
                                <div className="font-bold text-rose-900 text-xs">Technical Adjustment: {s.name}</div>
                                <div className="text-[10px] text-rose-600">Service unavailable on requested date</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                                  Deducted
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-rose-600">
                                - {formatMoney(Number(s.price || 0))}
                              </td>
                            </tr>
                          ) : null;
                        })
                      )}

                      {/* Catering Deductions Callout if any */}
                      {selectedInvoiceBooking.cateringAcknowledged && selectedInvoiceBooking.unavailableSupportServices && selectedInvoiceBooking.unavailableSupportServices.length > 0 && (
                        selectedInvoiceBooking.unavailableSupportServices.map(id => {
                          const s = supportServices.find(ss => String(ss.id) === String(id));
                          return s ? (
                            <tr key={`sup-${id}`} className="bg-amber-50/40">
                              <td className="px-4 py-3">
                                <div className="font-bold text-amber-900 text-xs">Catering Adjustment: {s.name}</div>
                                <div className="text-[10px] text-amber-600">Service unavailable on requested date</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                  Deducted
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-amber-600">
                                - {formatMoney(Number(s.price || 0))}
                              </td>
                            </tr>
                          ) : null;
                        })
                      )}

                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 text-white p-6 rounded-2xl gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Final Calculated Net Fee</span>
                  <p className="text-xs text-slate-300 mt-0.5">Approved in accordance with MoA Conference Portal Tariff Rules</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">
                    {formatMoney(calculateAdjustedPrice(selectedInvoiceBooking))}
                  </span>
                </div>
              </div>

              {/* Signatures & Seal Block */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="h-12 flex items-end justify-center">
                    <span className="font-serif italic text-slate-400">Authorized Signature</span>
                  </div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-700">MoA Finance Officer</div>
                </div>
                <div>
                  <div className="h-12 flex items-end justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-emerald-800/30 flex items-center justify-center text-[9px] font-black text-emerald-800 uppercase tracking-widest transform -rotate-12">
                      SEAL
                    </div>
                  </div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-700">MoA Events Management</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
