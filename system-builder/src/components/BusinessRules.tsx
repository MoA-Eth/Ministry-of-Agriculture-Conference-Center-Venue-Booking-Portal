import React, { useState, useEffect } from 'react';
import { Settings, Clock, ShieldAlert, CalendarClock, Save, CheckCircle2 } from 'lucide-react';
import { useApp, API_BASE } from '@/lib/app-context';
import { toast } from 'sonner';

export default function BusinessRules() {
  const { token } = useApp();
  const [waitingPeriod, setWaitingPeriod] = useState('48');
  const [bufferTime, setBufferTime] = useState('60');
  const [cancellationPolicy, setCancellationPolicy] = useState('strict');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWaitingPeriod(data.waiting_period_hours?.toString() || '48');
          setBufferTime(data.buffer_time_minutes?.toString() || '60');
          setCancellationPolicy(data.cancellation_policy || 'strict');
        }
      } catch (err) {
        console.error('Failed to load system settings', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchSettings();
  }, [token]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/settings/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          waiting_period_hours: parseInt(waitingPeriod) || 48,
          buffer_time_minutes: parseInt(bufferTime) || 60,
          cancellation_policy: cancellationPolicy
        })
      });
      
      if (!res.ok) throw new Error('Failed to update rules');
      
      setShowSuccess(true);
      toast.success('Business Rules updated successfully');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-4 border-[#268053]/30 border-t-[#268053] rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#268053]" />
            Business Rules Configuration
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage system-wide event logic, waiting periods, and cancellation policies.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm font-bold text-slate-700">Rules Enforced Globally</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
        <div className="p-8 sm:p-10 space-y-10">
          
          {/* Waiting Period */}
          <div className="grid sm:grid-cols-3 gap-6 items-start border-b border-slate-100 pb-10">
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-900">Waiting Period</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">The minimum hours required to book an event in advance. System will reject requests closer than this threshold.</p>
            </div>
            <div className="sm:col-span-2">
              <div className="relative max-w-xs">
                <input
                  type="number"
                  value={waitingPeriod}
                  onChange={(e) => setWaitingPeriod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-16 transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase tracking-wider">
                  Hours
                </div>
              </div>
            </div>
          </div>

          {/* Buffer Time */}
          <div className="grid sm:grid-cols-3 gap-6 items-start border-b border-slate-100 pb-10">
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <CalendarClock className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900">Buffer Time</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Mandatory transition time between back-to-back events in the same venue for cleaning and setup.</p>
            </div>
            <div className="sm:col-span-2">
              <div className="relative max-w-xs">
                <input
                  type="number"
                  value={bufferTime}
                  onChange={(e) => setBufferTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 pr-16 transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase tracking-wider">
                  Minutes
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="grid sm:grid-cols-3 gap-6 items-start">
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="font-bold text-slate-900">Cancellation Policy</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Determine how cancellations are handled regarding refunds and penalties.</p>
            </div>
            <div className="sm:col-span-2">
              <div className="grid gap-3">
                {[
                  { id: 'flexible', label: 'Flexible', desc: 'Full refund up to 24 hours before the event' },
                  { id: 'moderate', label: 'Moderate', desc: '50% refund up to 48 hours before the event' },
                  { id: 'strict', label: 'Strict', desc: 'No refunds within 7 days of the event' },
                ].map(policy => (
                  <label 
                    key={policy.id} 
                    onClick={() => setCancellationPolicy(policy.id)}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${cancellationPolicy === policy.id ? 'border-[#268053] bg-emerald-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${cancellationPolicy === policy.id ? 'border-[#268053]' : 'border-slate-300'}`}>
                      {cancellationPolicy === policy.id && <div className="w-2.5 h-2.5 bg-[#268053] rounded-full" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{policy.label}</div>
                      <div className="text-xs text-slate-500 mt-1">{policy.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

        </div>

        <div className="bg-slate-50 p-6 sm:px-10 border-t border-slate-100 flex items-center justify-between">
          <div>
            {showSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-bold">Rules successfully synchronized.</span>
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#268053] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#1e6642] focus:ring-4 focus:ring-[#268053]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#268053]/20"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
