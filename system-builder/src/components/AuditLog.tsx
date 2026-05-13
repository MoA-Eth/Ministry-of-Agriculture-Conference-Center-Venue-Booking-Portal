import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApp, API_BASE } from '@/lib/app-context';
import {
  History, Search, RefreshCw, Download, ChevronDown, ChevronRight,
  AlertCircle, Filter, X, ArrowUpDown, UserCheck, ShieldAlert,
  DollarSign, Info, Calendar, Clock, Globe, User, Activity,
  TrendingUp, ShieldCheck, ChevronLeft
} from 'lucide-react';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, subDays } from 'date-fns';
import { EthDateTime } from 'ethiopian-calendar-date-converter';
import { EthiopianCalendar, ETH_MONTHS } from '@/components/ui/ethiopian-calendar';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: number;
  user_name: string;
  full_name: string;
  action: string;
  details: string;
  timestamp: string;
  ip_address: string;
}

type CategoryKey = 'all' | 'pricing' | 'override' | 'user' | 'booking' | 'system';

// ─── Category Config ─────────────────────────────────────────────────────────

const CATEGORIES: Record<CategoryKey, {
  label: string; icon: React.ReactNode;
  color: string; bg: string; border: string; dot: string;
  match: (action: string) => boolean;
}> = {
  all:     { label: 'All Events',   icon: <Activity size={14}/>,    color: 'text-slate-700',   bg: 'bg-slate-100',   border: 'border-slate-200',  dot: 'bg-slate-400',   match: () => true },
  pricing: { label: 'Pricing',      icon: <DollarSign size={14}/>,  color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200',  dot: 'bg-amber-500',   match: (a) => a.includes('Price Adjustment') },
  override:{ label: 'VIP Override', icon: <ShieldAlert size={14}/>, color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-200', dot: 'bg-purple-500',  match: (a) => a.includes('Override') },
  booking: { label: 'Booking',      icon: <Calendar size={14}/>,    color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',   dot: 'bg-blue-500',    match: (a) => a.includes('Booking') },
  user:    { label: 'User Mgmt',    icon: <UserCheck size={14}/>,   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200',dot: 'bg-emerald-500', match: (a) => a.includes('User') || a.includes('Password') },
  system:  { label: 'System',       icon: <Info size={14}/>,        color: 'text-rose-700',    bg: 'bg-rose-50',     border: 'border-rose-200',   dot: 'bg-rose-500',    match: (a) => a.includes('Venue Update') || a.includes('Service') || a.includes('System Settings') },
};

const DATE_PRESETS = [
  { label: 'Last 7 days',  days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

function getCategory(action: string): CategoryKey {
  for (const [key, cfg] of Object.entries(CATEGORIES)) {
    if (key !== 'all' && cfg.match(action)) return key as CategoryKey;
  }
  return 'system';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CategoryBadge({ action }: { action: string }) {
  const key = getCategory(action);
  const cfg = CATEGORIES[key];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function DetailPanel({ log }: { log: AuditEntry }) {
  const { toEthTime } = useApp();
  
  const toEthFullDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const checkDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
      const eth = EthDateTime.fromEuropeanDate(checkDate);
      return `${ETH_MONTHS[eth.month - 1]} ${eth.date}, ${eth.year} E.C.`;
    } catch { return '—'; }
  };

  return (
    <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 grid sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Full Details</p>
        <p className="text-sm text-slate-700 font-medium leading-relaxed">{log.details}</p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Globe size={14} className="text-slate-400 shrink-0"/>
          <span className="font-mono text-slate-600 font-medium">{log.ip_address || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User size={14} className="text-slate-400 shrink-0"/>
          <span className="text-slate-600 font-medium">{log.user_name || 'system_auto'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-slate-400 shrink-0"/>
          <span className="text-slate-600 font-medium">{toEthFullDate(log.timestamp)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-slate-400 shrink-0"/>
          <span className="text-slate-600 font-medium">{toEthTime(log.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AuditLog() {
  const { token, toEthTime } = useApp();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryKey>('all');
  const [datePreset, setDatePreset] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const PER_PAGE = 15;
  const logRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      let url = `${API_BASE}/audit-logs/?page=${page}&search=${search}&category=${category}`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Access denied or server error');
      const data = await res.json();
      setLogs(data.results || data);
      setTotalCount(data.count || (Array.isArray(data) ? data.length : 0));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, page, search, category, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Deep Linking ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (logs.length > 0) {
      const params = new URLSearchParams(window.location.hash.split('?')[1]);
      const targetId = params.get('id');
      if (targetId) {
        const idNum = parseInt(targetId);
        // Find index in filtered logs (assuming no other filters are active for deep link)
        const index = logs.findIndex(l => l.id === idNum);
        if (index !== -1) {
          const targetPage = Math.floor(index / PER_PAGE) + 1;
          setPage(targetPage);
          setExpanded(idNum);
          
          // Scroll after state updates
          setTimeout(() => {
            const el = logRefs.current[idNum];
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('bg-emerald-50', 'ring-2', 'ring-emerald-500', 'ring-inset');
              setTimeout(() => el.classList.remove('bg-emerald-50', 'ring-2', 'ring-emerald-500', 'ring-inset'), 3000);
            }
          }, 500);
        }
      }
    }
  }, [logs]);

  useEffect(() => { setPage(1); }, [search, category, datePreset]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    totalCount,
    today:    logs.filter(l => {
      const d = new Date(l.timestamp);
      const today = new Date();
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length,
  }), [logs, totalCount]);

  // ── Filtered logs ────────────────────────────────────────────────────────
  const paginated = logs;
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  const toEthDateDisplay = (iso: string) => {
    try {
      if (!iso) return '—';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      
      // FIX: Use noon to avoid timezone shifting
      const checkDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
      const eth = EthDateTime.fromEuropeanDate(checkDate);
      return `${ETH_MONTHS[eth.month - 1]} ${eth.date}, ${eth.year} E.C.`;
    } catch (e) { 
      console.error('Eth Conversion Error:', e);
      return iso; 
    }
  };

  // ── CSV Export ───────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = ['ID', 'Timestamp', 'User', 'Full Name', 'Action', 'Details', 'IP Address'];
    const rows = logs.map(l => [
      l.id, `${toEthDateDisplay(l.timestamp)} ${toEthTime(l.timestamp)}`,
      l.user_name || 'system', l.full_name || 'System',
      l.action, `"${l.details.replace(/"/g, '""')}"`, l.ip_address || ''
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `moa-audit-log-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const hasFilters = search || category !== 'all' || dateFrom || dateTo || datePreset !== null;
  const clearFilters = () => { 
    setSearch(''); 
    setCategory('all'); 
    setDatePreset(null); 
    setDateFrom(''); 
    setDateTo(''); 
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

      {/* ── Header Banner ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0d1f14] to-[#1b4332] rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <History className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-extrabold">Activity Log</h1>
              <p className="text-emerald-200/70 text-sm font-medium mt-0.5">
                {totalCount} total entries · Immutable audit trail
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchLogs} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-bold transition-all">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-white text-sm font-bold transition-all shadow-lg shadow-emerald-900/30">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <StatCard icon={<TrendingUp size={22} className="text-slate-600"/>} label="Total Entries" value={totalCount} color="bg-slate-100" />
        <StatCard icon={<Activity size={22} className="text-emerald-600"/>} label="Current Results" value={logs.length} sub="on this page" color="bg-emerald-50" />
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by action, user, or details…"
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none text-sm font-medium text-slate-900 bg-slate-50 focus:bg-white transition-all shadow-sm" />
            {search && <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={15} /></button>}
          </div>
          
          {/* Ethiopian Date Range Picker */}
          <div className="relative">
             <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all shadow-sm ${dateFrom || dateTo ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-500'}`}
             >
                <Calendar size={18} className={dateFrom || dateTo ? 'text-emerald-500' : 'text-slate-400'} />
                <div className="flex flex-col items-start leading-tight">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date Range (E.C.)</span>
                   <span className="text-xs font-bold">
                      {dateFrom ? toEthDateDisplay(dateFrom) : 'Start Date'} 
                      <span className="mx-2 text-slate-300">—</span> 
                      {dateTo ? toEthDateDisplay(dateTo) : 'End Date'}
                   </span>
                </div>
                <ChevronDown size={14} className={`ml-2 transition-transform ${showCalendar ? 'rotate-180' : ''}`} />
             </button>

             {showCalendar && (
                <div className="absolute top-full right-0 mt-2 z-[100] bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 animate-in fade-in zoom-in-95 duration-200">
                   <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-50">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Select Range</h4>
                      <button onClick={() => setShowCalendar(false)} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"><X size={18}/></button>
                   </div>
                   <EthiopianCalendar 
                      allowPast={true}
                      selected={{ 
                         from: dateFrom ? new Date(dateFrom + 'T12:00:00') : undefined, 
                         to: dateTo ? new Date(dateTo + 'T12:00:00') : undefined 
                      }}
                      onSelect={(range) => {
                         if (range.from) {
                            setDateFrom(format(range.from, 'yyyy-MM-dd'));
                            // Clear old dateTo when a new start is selected
                            if (!range.to) setDateTo('');
                         }
                         if (range.to) {
                            setDateTo(format(range.to, 'yyyy-MM-dd'));
                            setShowCalendar(false);
                         }
                         setPage(1);
                      }}
                   />
                   {/* Apply single-day filter if only from is selected */}
                   {dateFrom && !dateTo && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                         <span className="text-[10px] text-slate-400 font-bold">Single day selected</span>
                         <div className="flex gap-2">
                            <button onClick={() => { setDateTo(dateFrom); setShowCalendar(false); setPage(1); }}
                               className="px-4 py-2 bg-[#268053] text-white text-xs font-black rounded-xl hover:bg-[#1b4332] transition-colors">
                               Apply
                            </button>
                            <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                               className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-black rounded-xl hover:bg-slate-200 transition-colors">
                               Clear
                            </button>
                         </div>
                      </div>
                   )}
                </div>
             )}
          </div>
          
          <div className="h-8 w-px bg-slate-200 hidden lg:block" />

          <div className="flex gap-2">
             {DATE_PRESETS.map(p => (
               <button key={p.days} 
                 onClick={() => {
                   const from = format(subDays(new Date(), p.days), 'yyyy-MM-dd');
                   const to = format(new Date(), 'yyyy-MM-dd');
                   setDateFrom(from);
                   setDateTo(to);
                   setPage(1);
                   setShowCalendar(false);
                 }}
                 className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm">
                 {p.label}
               </button>
             ))}
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(CATEGORIES) as CategoryKey[]).map(key => {
            const cfg = CATEGORIES[key];
            const isActive = category === key;
            return (
              <button key={key} onClick={() => setCategory(isActive ? 'all' : key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isActive ? `${cfg.color} ${cfg.bg} ${cfg.border} shadow-sm` : 'text-slate-500 bg-white border-slate-200 hover:border-slate-300'}`}>
                {cfg.icon}{cfg.label}
              </button>
            );
          })}
          {hasFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 transition-all hover:bg-rose-100">
              <X size={12} />Clear Filters
            </button>
          )}
        </div>

        {/* Result count */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm text-slate-500 font-medium">
              Found <span className="font-black text-slate-900">{totalCount}</span> total matching entries
            </p>
          </div>
          {totalPages > 1 && <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Page {page} of {totalPages}</p>}
        </div>
      </div>

      {/* ── Log Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#268053]/20 border-t-[#268053] rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Loading audit trail…</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center flex flex-col items-center text-rose-500">
            <AlertCircle size={48} className="mb-4" />
            <p className="font-black text-lg">Failed to load logs</p>
            <p className="text-sm opacity-80 mt-1 mb-4">{error}</p>
            <button onClick={fetchLogs} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors">Retry</button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <History size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-900 font-black text-lg">No entries found</p>
            <p className="text-slate-400 text-sm mt-1 max-w-xs">{hasFilters ? 'Try adjusting your search or filters.' : 'No administrative actions have been recorded yet.'}</p>
            {hasFilters && <button onClick={clearFilters} className="mt-4 text-xs font-bold text-emerald-600 hover:underline">Clear all filters</button>}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[1.2fr_1.5fr_1.5fr_1fr_48px] bg-slate-900 text-slate-400 px-6 py-4 gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2"><Clock size={12} className="text-emerald-500"/> Timestamp</span>
              <span className="flex items-center gap-2"><User size={12} className="text-emerald-500"/> Authorized User</span>
              <span className="flex items-center gap-2"><Activity size={12} className="text-emerald-500"/> Action Context</span>
              <span className="flex items-center gap-2"><Info size={12} className="text-emerald-500"/> Overview</span>
              <span/>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {paginated.map((log) => {
                const catKey = getCategory(log.action);
                const catCfg = CATEGORIES[catKey];
                const isOpen = expanded === log.id;
                return (
                  <div key={log.id} ref={el => logRefs.current[log.id] = el} className="group rounded-xl transition-all duration-500">
                    <button
                      onClick={() => setExpanded(isOpen ? null : log.id)}
                      className={`w-full grid grid-cols-[1.2fr_1.5fr_1.5fr_1fr_48px] px-6 py-5 gap-4 items-center text-left transition-all duration-300 ${isOpen ? 'bg-slate-50/80 shadow-inner' : 'hover:bg-slate-50'}`}>

                      {/* Timestamp */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black text-slate-900 tracking-tight">{toEthDateDisplay(log.timestamp)}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span className="text-[11px] text-slate-500 font-bold tracking-wider">{toEthTime(log.timestamp)}</span>
                        </div>
                      </div>

                      {/* User */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#081c15] flex items-center justify-center text-emerald-400 text-xs font-black shadow-lg shadow-emerald-900/10 border border-emerald-500/20">
                            {(log.full_name || log.user_name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate tracking-tight">{log.full_name || 'System Auto'}</p>
                          <p className="text-[11px] font-bold text-slate-400 truncate flex items-center gap-1 italic">
                            @{log.user_name || 'system_service'}
                          </p>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black border w-fit uppercase tracking-wider ${catCfg.color} ${catCfg.bg} ${catCfg.border} shadow-sm`}>
                          {catCfg.icon}{catCfg.label}
                        </span>
                        <span className="text-xs text-slate-700 font-bold leading-tight line-clamp-1">{log.action}</span>
                      </div>

                      {/* Details preview */}
                      <div className="hidden sm:block">
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed italic">"{log.details}"</p>
                      </div>

                      {/* Expand toggle */}
                      <div className="flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-emerald-100 text-emerald-600 rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600'}`}>
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </button>

                    {/* Expanded detail panel */}
                    {isOpen && <DetailPanel log={log} />}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-bold text-slate-600">
            <ChevronLeft size={15} /> Previous
          </button>
          <div className="flex items-center gap-1.5">
            {totalPages <= 7 ? (
              [...Array(totalPages)].map((_, i) => (
                <button key={i+1} onClick={() => setPage(i+1)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${page === i+1 ? 'bg-[#268053] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                  {i+1}
                </button>
              ))
            ) : (
              <>
                <button onClick={() => setPage(1)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${page === 1 ? 'bg-[#268053] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                  1
                </button>
                {page > 3 && <span className="text-slate-400 px-1">...</span>}
                {Array.from({ length: 3 }, (_, i) => page - 1 + i)
                  .filter(p => p > 1 && p < totalPages)
                  .map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${page === p ? 'bg-[#268053] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {p}
                    </button>
                  ))}
                {page < totalPages - 2 && <span className="text-slate-400 px-1">...</span>}
                <button onClick={() => setPage(totalPages)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${page === totalPages ? 'bg-[#268053] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
                  {totalPages}
                </button>
              </>
            )}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-bold text-slate-600">
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── Compliance Banner ─────────────────────────────────────────── */}
      <div className="flex items-start gap-4 p-6 bg-blue-50 border border-blue-100 rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="text-blue-600" size={20} />
        </div>
        <div>
          <h4 className="text-blue-900 font-bold mb-1">Immutable Compliance Record</h4>
          <p className="text-blue-700 text-sm leading-relaxed">
            Every administrative action is recorded with a timestamp and actor identity, and <strong>cannot be deleted or modified</strong>.
            This audit trail ensures full accountability and compliance with MoA internal governance requirements.
          </p>
        </div>
      </div>

    </div>
  );
}
