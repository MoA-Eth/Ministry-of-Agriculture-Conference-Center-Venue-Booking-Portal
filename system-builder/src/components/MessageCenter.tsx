import { useState, useEffect } from 'react';
import { useApp, API_BASE } from '@/lib/app-context';
import { 
  Mail, Save, Info, Terminal, BellRing, History, 
  CheckCircle2, Clock, AlertTriangle, Send 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Make triggers look professional in the UI
const triggerLabels: Record<string, string> = {
  pending: 'Booking Received',
  partial_paid: '1st Round Paid',
  paid: 'Fully Paid (Confirmed)',
  approved: 'VIP Approved',
  rejected: 'Rejected / Overridden',
  cancelled: 'Cancelled',
  completed: 'Event Completed',
  reminder_24h: '24h Reminder',
  reminder_48h_pay: 'Payment Expiration Warning',
  last_day: 'Event Conclusion'
};

export default function MessageCenter() {
  const { token } = useApp();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchTemplates();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/email-templates/`, {
        headers: { 
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) throw new Error("Failed to fetch templates");

      const data = await res.json();
      
      const templateList = Array.isArray(data) ? data : (data.results || []);
      
      setTemplates(templateList);
      
      if (templateList.length > 0 && !selected) {
        setSelected(templateList[0]);
      }
    } catch (err) {
      console.error("Comm Engine Error:", err);
      toast.error("Failed to sync with Communication Engine");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    
    try {
      const res = await fetch(`${API_BASE}/email-templates/${selected.id}/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}` 
        },
        body: JSON.stringify({
          subject: selected.subject,
          body: selected.body
        })
      });
      
      if (res.ok) {
        toast.success("Official Protocol Updated");
        fetchTemplates();
      } else {
        throw new Error("Update failed");
      }
    } catch (err) {
      toast.error("Protocol update failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-[#268053] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-black text-slate-400 uppercase tracking-widest">Syncing Comm-Channels...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Mail className="w-8 h-8 text-[#268053]" /> Communication Hub
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage automated ministerial alerts and event protocols.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">SMTP: Operational</span>
           </div>
           <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
              <Clock size={14} className="text-amber-600" />
              <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">48h Expiration: Active</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Template Navigation */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4">Automation Triggers</p>
          {templates.length === 0 ? (
            <p className="text-xs text-slate-400 italic px-4">No templates found in database.</p>
          ) : (
            templates.map(t => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${selected?.id === t.id ? 'border-[#268053] bg-emerald-50 shadow-md' : 'border-white bg-white hover:border-slate-200'}`}
              >
                <div className="relative z-10">
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selected?.id === t.id ? 'text-[#268053]' : 'text-slate-400'}`}>
                    {triggerLabels[t.trigger] || t.trigger?.replace('_', ' ')}
                  </p>
                  <p className="text-sm font-bold text-slate-700 truncate">{t.subject}</p>
                </div>
              </button>
            ))
          )}
          
          <div className="mt-12 p-6 bg-[#0f172a] rounded-3xl text-white">
             <div className="flex items-center gap-2 mb-4">
                <Terminal size={16} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Logs</span>
             </div>
             <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px]">
                   <span className="text-slate-400">Active Reminders</span>
                   <span className="font-bold text-emerald-400">Online</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                   <span className="text-slate-400">Auto-Cancellations</span>
                   <span className="font-bold text-rose-400">Enabled</span>
                </div>
             </div>
          </div>
        </div>

        {/* Professional Editor */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
              <div className="p-10 border-b border-slate-50 bg-gradient-to-r from-white to-slate-50/50">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <History size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Edit Notification Protocol</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          Trigger: {triggerLabels[selected.trigger] || selected.trigger}
                        </p>
                      </div>
                   </div>
                   <Button onClick={handleSave} className="bg-[#268053] hover:bg-[#1b4332] text-white font-black px-8 py-6 rounded-xl transition-all active:scale-95">
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                   </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Official Subject Line</label>
                    <input 
                      value={selected.subject}
                      onChange={e => setSelected({...selected, subject: e.target.value})}
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/5 focus:border-[#268053] outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Message Content</label>
                    <textarea 
                      rows={12}
                      value={selected.body}
                      onChange={e => setSelected({...selected, body: e.target.value})}
                      className="w-full px-8 py-6 bg-white border border-slate-200 rounded-[2rem] font-medium text-slate-600 focus:ring-4 focus:ring-emerald-500/5 focus:border-[#268053] outline-none transition-all shadow-sm leading-relaxed"
                      placeholder="Enter the professional message body here..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl flex items-start gap-3">
                      <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-1">Placeholders</p>
                        <p className="text-[10px] text-emerald-700 leading-relaxed font-medium italic">
                          {"{name}, {event}, {venue}, {date}, {ref}, {reason}"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 bg-slate-50/30">
               <Mail className="w-16 h-16 text-slate-200 mb-4" />
               <p className="text-xl font-serif font-black text-slate-300 italic">"Select a trigger to modify its protocol."</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}