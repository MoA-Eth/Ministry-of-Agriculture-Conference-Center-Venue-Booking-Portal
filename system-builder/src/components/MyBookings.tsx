// Pricing is hidden from organizer view (admin/finance only)
import { useState } from 'react';
import { useApp, API_BASE } from '@/lib/app-context';
import { venues } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar, Users, MapPin, Edit, Trash2, Lock, XCircle, CheckCircle2 } from 'lucide-react';
import { EthDateTime } from 'ethiopian-calendar-date-converter';

const statusStyles: Record<string, { bg: string, text: string, label: string, dot: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Awaiting MoA Approval', dot: 'bg-amber-500' },
  reserved: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Awaiting MoA Approval', dot: 'bg-amber-500' },
  management_approved: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'MoA Approved (Awaiting Payment)', dot: 'bg-teal-500' },
  partial_paid: { bg: 'bg-blue-50', text: 'text-blue-700', label: '1st Round Paid', dot: 'bg-blue-500' },
  approved: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'VIP Approved', dot: 'bg-purple-500' },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Confirmed', dot: 'bg-emerald-500' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Fully Paid', dot: 'bg-emerald-500' },
  override: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'VIP Override', dot: 'bg-purple-500' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected', dot: 'bg-red-500' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Cancelled', dot: 'bg-slate-400' },
  completed: { bg: 'bg-slate-800', text: 'text-white', label: 'Completed', dot: 'bg-white' },
};

const ethMonths = ["Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit", "Miazia", "Genbot", "Sene", "Hamle", "Nehase", "Puagme"];

const toEthDateString = (gStr: string | undefined | null) => {
  if (!gStr) return 'TBD';
  try {
    const [y, m, d] = gStr.split('T')[0].split('-').map(Number);
    const gDate = new Date(y, m - 1, d, 12, 0, 0); 
    const ethDate = EthDateTime.fromEuropeanDate(gDate);
    return `${ethMonths[ethDate.month - 1]} ${ethDate.date}, ${ethDate.year}`;
  } catch {
    return gStr;
  }
};

const isWithin24Hours = (startDate: string, startTime?: string) => {
  if (!startDate) return false;
  try {
    const d = startDate.split('T')[0];
    const t = startTime || '08:00:00';
    const eventDate = new Date(`${d}T${t}`);
    const diff = (eventDate.getTime() - Date.now()) / (1000 * 3600);
    return diff > 0 && diff < 24;
  } catch { return false; }
};

export default function MyBookings() {
  const { bookings, cancelBooking, user, token, toEthTime } = useApp();
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editForm, setEditForm] = useState({ event_title: '', event_description: '', participant_count: 0, organizer_phone: '' });

  const handleCancel = async (id: string) => {
    if (confirm('Are you certain you wish to cancel this booking? This action cannot be undone.')) {
      cancelBooking(id);
      toast.success('Your booking has been successfully cancelled.');
    }
  };

  const handleOpenEdit = (b: any) => {
    setEditingBooking(b);
    setEditForm({
      event_title: b.eventTitle || b.event_title || b.title || '',
      event_description: b.eventDescription || b.event_description || b.description || '',
      participant_count: b.participantCount || b.participant_count || b.pax || 0,
      organizer_phone: b.organizerPhone || b.organizer_phone || b.phone || '',
    });
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`${API_BASE}/bookings/public_edit/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Token ${token}` } : {}) },
        body: JSON.stringify({ ref_id: editingBooking.id, ...editForm })
      });
      if(res.ok) {
        toast.success("Booking modifications saved successfully!");
        setEditingBooking(null);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error("Failed to save changes. Please try again.");
      }
    } catch(err) {
      toast.error("Network error while trying to save.");
    }
  };

  const myBookings = bookings.filter(b => user && String(b.userId) === String(user.id));

  return (
    <div className="max-w-6xl mx-auto pb-16 animate-in fade-in duration-500">
      
      {/* EDIT MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8">
              <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><Edit className="text-[#268053]" /> Modify Booking</h2>
              <div className="space-y-4">
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Event Title</label><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#268053]" value={editForm.event_title} onChange={e => setEditForm({...editForm, event_title: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Participant Count (Max)</label><input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#268053]" value={editForm.participant_count} onChange={e => setEditForm({...editForm, participant_count: Number(e.target.value)})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Contact Phone</label><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[#268053]" value={editForm.organizer_phone} onChange={e => setEditForm({...editForm, organizer_phone: e.target.value})} /></div>
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Detailed Description</label><textarea rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:ring-2 focus:ring-[#268053] resize-none" value={editForm.event_description} onChange={e => setEditForm({...editForm, event_description: e.target.value})} /></div>
              </div>
              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
                  <Button variant="outline" className="flex-1 font-bold h-12" onClick={() => setEditingBooking(null)}>Cancel</Button>
                  <Button className="flex-1 bg-[#268053] hover:bg-[#1b4332] text-white font-bold h-12 shadow-glow" onClick={handleSaveEdit}>Save Modifications</Button>
              </div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3"><Calendar className="w-8 h-8 text-[#268053]" /> My Bookings</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-2">MANAGE AND TRACK YOUR FACILITY REQUESTS</p>
        </div>
        <Button className="shrink-0 bg-[#268053] hover:bg-[#1b4332] text-white font-bold h-11 px-6 shadow-glow" onClick={() => window.location.hash = '#/new-booking'}>+ BOOK A VENUE</Button>
      </div>

      {/* Flat Content List */}
      <div className="space-y-6">
        {myBookings.length === 0 ? (
           <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center text-slate-500 font-bold">No bookings found.</div>
        ) : (
          myBookings.map((b) => {
            const venue = venues.find(v => String(v.id) === String(b.venueId || b.venue));
            const safeId = String(b.id);
            const style = statusStyles[b.status] || statusStyles.reserved;
            const title = b.eventTitle || b.event_title || b.title || 'Untitled Event';
            const startDate = b.startDate || b.start_date || '';
            const endDate = b.endDate || b.end_date || '';
            const startTime = b.startTime || b.start_time || '';
            const pax = b.participantCount || b.participant_count || b.pax;
            const isLocked = isWithin24Hours(startDate, startTime) && ['pending', 'management_approved', 'partial_paid', 'approved', 'confirmed', 'paid'].includes(b.status);

            return (
              <div key={safeId} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-start border-b border-slate-100 pb-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ref: MOA-BKG-{safeId}</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${style.bg} ${style.text}`}><span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>{style.label}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">{title}</h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600 font-medium">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> <span className="font-bold">{venue?.name || 'Venue TBD'}</span></div>
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /><span className="font-bold text-[#268053]">{startDate === endDate ? toEthDateString(startDate) : `${toEthDateString(startDate).split(',')[0]} - ${toEthDateString(endDate)}`}</span></div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /><span className="font-bold">{toEthTime(startTime)}</span></div>
                      <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> <span className="font-bold">{pax} Max</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full sm:w-auto">
                    {b.status === 'rejected' && (<p className="text-sm font-bold text-red-600 flex items-center gap-2"><XCircle className="w-4 h-4"/> Reason: {b.rejectionReason || b.rejection_reason || "Not provided."}</p>)}
                    {b.status === 'confirmed' && (<p className="text-sm font-bold text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Payment Verified. Venue Secured.</p>)}
                  </div>

                  {['pending', 'management_approved', 'partial_paid', 'approved', 'confirmed', 'paid'].includes(b.status) && (
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
                      {isLocked ? (
                         <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200"><Lock size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Locked (Under 24h)</span></div>
                      ) : (
                        <>
                          {['pending', 'reserved'].includes(b.status) && (
                            <Button variant="outline" className="w-full sm:w-auto font-bold border-slate-300" onClick={() => handleOpenEdit(b)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                          )}
                          <Button variant="ghost" className="w-full sm:w-auto font-bold text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleCancel(safeId)}><Trash2 className="w-4 h-4 mr-2" /> Cancel</Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}