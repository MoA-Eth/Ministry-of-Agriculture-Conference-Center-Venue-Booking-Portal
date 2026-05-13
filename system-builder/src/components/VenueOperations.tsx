import { useState, useEffect } from 'react';
import { useApp, API_BASE } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Building2, AlertTriangle, CheckCircle2, Clock, Droplets, Power, ShieldCheck, Activity } from 'lucide-react';

export default function VenueOperations() {
  // FIX: Grab the verified 'token' directly from our global context!
  const { venues, refreshData, token, role, toEthTime } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0');
  const isCleaningTime = timeStr >= '06:00' && timeStr <= '08:00';

  const handleToggleStatus = async (venueId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'vacant' ? 'out_of_order' : 'vacant';
    const confirmMsg = newStatus === 'out_of_order' 
      ? "Marking this venue as 'Out of Order' will block all new bookings. Proceed?" 
      : "Bring this venue back to 'Vacant' status?";

    if (confirm(confirmMsg)) {
      try {
        const response = await fetch(`${API_BASE}/venues/${venueId}/`, {
          method: 'PATCH',
          // FIX: Use the context token here so Django accepts the request
          headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
          body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
          toast.success(`Venue is now ${newStatus.replace('_', ' ').toUpperCase()}`);
          refreshData(); // Instantly updates the global context!
        } else {
          toast.error("You do not have permission to do this.");
        }
      } catch (err) {
        toast.error("Failed to update status");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in-up duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <ShieldCheck className="w-8 h-8 text-[#268053]" /> Venue Operations
          </h1>
          <p className="text-slate-500 font-medium mt-2">Manage physical room availability and maintenance status.</p>
        </div>
        
        <div className={`px-6 py-3 rounded-2xl border flex items-center gap-4 transition-all duration-500 ${isCleaningTime ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse' : 'bg-white border-slate-200 text-slate-600'}`}>
          <Clock className={isCleaningTime ? 'text-amber-600' : 'text-slate-400'} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Current Facility Time</p>
            <p className="text-xl font-black leading-none">{toEthTime(timeStr)}</p>
          </div>
          {isCleaningTime && (
            <div className="pl-4 border-l border-amber-200 ml-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Active Status</p>
              <p className="text-xs font-bold">Facility-Wide Cleaning</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {venues.map((v) => {
          const isOutOfOrder = v.status === 'out_of_order';
          
          return (
            <div key={v.id} className={`group relative rounded-[2.5rem] border-2 p-8 transition-all duration-300 overflow-hidden ${isOutOfOrder ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-[#268053]/30 shadow-sm hover:shadow-xl hover:-translate-y-1'}`}>
              
              <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-10 transition-colors ${isOutOfOrder ? 'bg-red-600' : 'bg-[#268053]'}`} />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isOutOfOrder ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-[#268053]'}`}>
                  <Building2 size={28} />
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${isOutOfOrder ? 'bg-red-600 text-white border-red-700 shadow-md animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {isOutOfOrder ? 'Out of Order' : 'Vacant'}
                  </span>
                </div>
              </div>

              <div className="relative z-10 mb-8">
                <h3 className={`text-xl font-black mb-1 ${isOutOfOrder ? 'text-red-950' : 'text-slate-800'}`}>{v.name}</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{v.bestFor}</p>
              </div>

               <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                  <div className={`p-3 rounded-xl border ${isOutOfOrder ? 'bg-red-100/50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                     <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Capacity</p>
                     <p className={`text-sm font-bold ${isOutOfOrder ? 'text-red-900' : 'text-slate-700'}`}>{v.capacity} Max</p>
                  </div>
                  {role !== 'organizer' && (
                    <div className={`p-3 rounded-xl border ${isOutOfOrder ? 'bg-red-100/50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                       <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Daily Rate</p>
                       <p className={`text-sm font-bold ${isOutOfOrder ? 'text-red-900' : 'text-slate-700'}`}>{v.price} ETB</p>
                    </div>
                  )}
               </div>

              <div className="pt-6 border-t border-slate-100 relative z-10 flex gap-3">
                <Button 
                  onClick={() => handleToggleStatus(v.id.toString(), v.status)}
                  className={`flex-1 font-black uppercase tracking-widest text-[11px] h-12 rounded-xl shadow-lg transition-all active:scale-95 ${isOutOfOrder ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'}`}
                >
                  {isOutOfOrder ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Make Vacant</> : <><Power className="w-4 h-4 mr-2" /> Set Out of Order</>}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 bg-[#111827] rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-[#268053] rounded-full -mr-32 -mt-32 blur-[100px] opacity-20" />
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center shrink-0 border border-white/10">
               <Droplets className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
               <h2 className="text-2xl font-black mb-2 tracking-tight">Cleaning Schedule Protocol</h2>
               <p className="text-slate-400 max-w-2xl leading-relaxed">
  To maintain facility standards, a mandatory <strong className="text-white">1-hour cleaning window</strong> is automatically required between consecutive meetings. During this turnaround time, the booking system will block overlapping schedules to ensure our staff can fully prepare the room for the next event.
</p>
            </div>
         </div>
      </div>
    </div>
  );
}