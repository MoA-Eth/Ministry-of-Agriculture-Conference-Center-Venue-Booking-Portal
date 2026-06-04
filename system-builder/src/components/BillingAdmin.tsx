import React, { useMemo, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Booking } from '@/lib/types';
import { Banknote, FileText, CheckCircle2, Clock, Search, Filter, AlertTriangle, ArrowUpRight, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function BillingAdmin() {
  const { bookings, updateBookingStatus, technicalServices, supportServices } = useApp();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
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
    return Math.max(0, (b.totalPrice || 0) - deduction);
  };

  // Derive "billing status" based on booking status
  const getBillingStatus = (status: string) => {
    switch(status) {
      case 'paid': 
      case 'confirmed': return { label: 'Fully Paid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'completed': return { label: 'Settled', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'partial_paid': return { label: '1st Round Paid', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'approved': return { label: 'Awaiting Payment', color: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'reserved':
      case 'pending': return { label: 'Pending Quote', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      default: return { label: 'N/A', color: 'bg-slate-100 text-slate-400 border-slate-100' };
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Exclude rejected/cancelled unless specifically searching for them
      if (['rejected', 'cancelled'].includes(b.status)) return false;
      
      const searchMatch = (b.eventTitle || '').toLowerCase().includes(search.toLowerCase()) || 
                          (b.organizerOrganization || '').toLowerCase().includes(search.toLowerCase());
      
      let statusMatch = true;
      if (filterStatus === 'unpaid') statusMatch = ['approved', 'reserved', 'pending'].includes(b.status);
      if (filterStatus === 'paid') statusMatch = ['paid', 'confirmed', 'completed', 'partial_paid'].includes(b.status);
      
      return searchMatch && statusMatch;
    }).sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime());
  }, [bookings, search, filterStatus]);

  const totalReceivables = useMemo(() => {
    return bookings
      .filter(b => ['approved', 'reserved', 'pending', 'partial_paid'].includes(b.status))
      .reduce((sum, b) => sum + calculateAdjustedPrice(b), 0);
  }, [bookings, technicalServices, supportServices]);

  const totalCollected = useMemo(() => {
    return bookings
      .filter(b => ['paid', 'confirmed', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + calculateAdjustedPrice(b), 0);
  }, [bookings, technicalServices, supportServices]);

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Banknote className="w-8 h-8 text-[#268053]" />
            Billing & Administration
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Track payments, issue invoices, and manage financial requests.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-xl"></div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 z-10">
            <DollarSign className="w-7 h-7" />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Collected</p>
            <p className="text-2xl font-black text-slate-900">ETB {totalCollected.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full blur-xl"></div>
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 z-10">
            <Clock className="w-7 h-7" />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Awaiting Payment</p>
            <p className="text-2xl font-black text-slate-900">ETB {totalReceivables.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 z-10 border border-white/10">
            <FileText className="w-7 h-7" />
          </div>
          <div className="z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Quotes</p>
            <p className="text-2xl font-black text-white">{filteredBookings.length} Invoices</p>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by event or organization..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#268053]/20 focus:border-[#268053] transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#268053]/20"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Awaiting Payment</option>
              <option value="paid">Paid / Settled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Event Details</th>
                <th className="px-6 py-4">Client / Org</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Billing Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">No billing records match your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const billStatus = getBillingStatus(b.status);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{b.eventTitle}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{b.venueName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{b.organizerOrganization}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{b.organizerName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{b.startDate} to {b.endDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-900">ETB {calculateAdjustedPrice(b).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${billStatus.color}`}>
                          {billStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {b.status === 'approved' && (
                            <button 
                              onClick={async () => {
                                setIsUpdating(b.id);
                                try {
                                  await updateBookingStatus(b.id, 'confirmed');
                                } finally {
                                  setIsUpdating(null);
                                }
                              }}
                              disabled={isUpdating === b.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#268053] text-white rounded-lg text-xs font-bold hover:bg-[#1e6642] transition-all shadow-sm disabled:opacity-50"
                            >
                              {isUpdating === b.id ? '...' : 'Confirm Payment'}
                            </button>
                          )}
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            Invoice <ArrowUpRight className="w-3 h-3" />
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
    </div>
  );
}
