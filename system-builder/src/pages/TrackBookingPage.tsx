import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, Ticket, Clock, MapPin, Users, Edit2, XCircle, Info, Phone, AlignLeft, Save, Calendar, Lock, AlertTriangle, Crown } from 'lucide-react';
import moaLogo from '@/assets/moa-logo.png';
import { API_BASE, mapBooking } from '@/lib/app-context';
import { Booking } from '@/lib/types';
import { toast } from 'sonner';
import { ETH_MONTHS } from '@/components/ui/ethiopian-calendar';
import { EthDateTime } from 'ethiopian-calendar-date-converter';

export default function TrackBookingPage() {
  const [refId, setRefId] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ eventTitle: '', eventDescription: '', organizerPhone: '', participantCount: '' });

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

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const formattedHr = hr % 12 || 12;
    return `${formattedHr}:${m} ${ampm}`;
  };

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return { label: 'Confirmed (Paid)', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'partial_paid':
        return { label: '1st Round Paid', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'approved':
        return { label: 'VIP Approved', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'rejected':
      case 'cancelled':
        return { label: status.charAt(0).toUpperCase() + status.slice(1), color: 'bg-rose-100 text-rose-700 border-rose-200' };
      default:
        return { label: 'Pending / Tentative', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
  };

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!refId.trim()) return;
    setLoading(true);
    setIsEditing(false);
    try {
      const res = await fetch(`${API_BASE}/bookings/track/?ref_id=${refId}`);
      if (!res.ok) throw new Error('Booking not found');
      const data = await res.json();
      const mapped = mapBooking(data);
      setBooking(mapped);
      setEditForm({
         eventTitle: mapped.eventTitle,
         eventDescription: mapped.eventDescription || '',
         organizerPhone: mapped.organizerPhone || '',
         participantCount: mapped.participantCount.toString()
      });
    } catch (err) {
      toast.error('Booking not found. Please check your Reference ID.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const isLockedForEditing = (startDate: string, startTime?: string) => {
    if (!startDate) return false;
    try {
      const d = startDate.split('T')[0];
      const t = startTime || '08:00:00';
      const eventDate = new Date(`${d}T${t}`);
      const now = new Date();
      const diffInHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffInHours < 24; 
    } catch { 
      return false; 
    }
  };

  const normalizedStatus = booking?.status?.toLowerCase() || '';
  const isLocked = booking ? isLockedForEditing(booking.startDate, booking.startTime) && ['paid', 'approved', 'pending', 'partial_paid'].includes(normalizedStatus) : false;
  const isVipBooking = booking?.eventTitle?.includes('⭐ [VIP OVERRIDE]');

  const handleCancel = async () => {
    if (!booking) return;
    
    if (isLocked) {
      toast.error('Bookings cannot be cancelled within 24 hours of the event start time.');
      return;
    }

    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE}/bookings/public_cancel/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref_id: booking.id })
      });
      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || 'Failed to cancel booking');
      }
      toast.success('Booking cancelled successfully');
      handleTrack(); 
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    try {
      const res = await fetch(`${API_BASE}/bookings/public_edit/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           ref_id: booking.id,
           event_title: editForm.eventTitle,
           event_description: editForm.eventDescription,
           organizer_phone: editForm.organizerPhone,
           participant_count: editForm.participantCount
        })
      });
      if (!res.ok) throw new Error('Failed to update details');
      toast.success('Booking details updated successfully!');
      setIsEditing(false);
      handleTrack(); 
    } catch (err) {
      toast.error('Failed to update booking details');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-6 relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-[#1b4332] rounded-b-[4rem] shadow-2xl"></div>
      
      <div className="w-full max-w-2xl relative z-10 flex flex-col">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white transition-colors mb-10 w-fit">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        {/* Search Area */}
        <div className="bg-white rounded-3xl shadow-xl p-4 flex items-center gap-4 mb-8 border border-slate-100">
           <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100">
             <img src={moaLogo} alt="MoA Logo" className="w-8 h-8 object-contain" />
           </div>
           <form onSubmit={handleTrack} className="flex-1 flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Enter Reference ID (e.g. MOA-BKG-12)" 
                value={refId}
                onChange={e => setRefId(e.target.value)}
                className="w-full bg-slate-50 border-none outline-none font-bold text-slate-800 placeholder:text-slate-400 px-4 py-3 rounded-xl focus:ring-2 focus:ring-[#268053]/20 transition-all uppercase"
              />
              <button disabled={loading} type="submit" className="bg-[#111827] hover:bg-[#268053] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 shrink-0">
                {loading ? 'Searching...' : <><Search size={18} /> Track</>}
              </button>
           </form>
        </div>

        {/* Display Booking Details */}
        {booking && !isEditing && (
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
             
             {/* VIP OVERRIDE NOTICE */}
             <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-left flex gap-3 shadow-inner">
               <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
               <div>
                 <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Important Policy Notice</p>
                 <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                   As a state facility, high-level Ministerial and VIP events hold supreme priority. Your booking may be subject to overriding or cancellation (with full refund) even after payment is confirmed.
                 </p>
               </div>
             </div>

             {/* Header */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reference ID</p>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    MOA-BKG-{booking.id}
                    {isVipBooking && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                        <Crown size={12} /> VIP
                      </span>
                    )}
                  </h2>
                </div>
                <div className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${getStatusInfo(normalizedStatus).color}`}>
                  <div className="w-2 h-2 rounded-full bg-current opacity-70" />
                  {getStatusInfo(normalizedStatus).label}
                </div>
             </div>

             {normalizedStatus === 'rejected' && booking.rejectionReason && (
               <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex gap-3 text-rose-800">
                 <Info className="w-5 h-5 shrink-0 mt-0.5" />
                 <div>
                   <p className="text-xs font-black uppercase tracking-widest mb-1">Rejection Reason</p>
                   <p className="text-sm font-medium">{booking.rejectionReason}</p>
                 </div>
               </div>
             )}

             {/* Details Grid */}
             <div className="grid sm:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <p className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><Ticket size={14} /> Event Name</p>
                    <p className="text-lg font-bold text-slate-800">{booking.eventTitle}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><MapPin size={14} /> Venue</p>
                    <p className="text-sm font-bold text-slate-800">{booking.venueName}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><Calendar size={14} /> Schedule</p>
                    <p className="text-sm font-bold text-[#268053]">
                      {booking.startDate === booking.endDate 
                        ? getEthDateString(booking.startDate)
                        : `${getEthDateString(booking.startDate).split(',')[0]} - ${getEthDateString(booking.endDate)}`}
                    </p>
                    <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {formatTime(booking.startTime)} to {formatTime(booking.endTime)}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><Users size={14} /> Expected Guests</p>
                    <p className="text-sm font-bold text-slate-800">{booking.participantCount} People</p>
                  </div>
                </div>
             </div>

             {/* Description Box */}
             {booking.eventDescription && (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><AlignLeft size={14} /> Description</p>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{booking.eventDescription}"</p>
                </div>
             )}

             {/* EDIT AND CANCEL ACTIONS BAR */}
             {['paid', 'approved', 'pending', 'partial_paid'].includes(normalizedStatus) && (
                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100 mt-4">
                   {isLocked ? (
                     <div className="w-full flex items-center justify-center gap-3 text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200">
                       <Lock size={20} className="shrink-0" />
                       <p className="text-sm font-bold">Locked: Less than 24 hours to event.</p>
                     </div>
                   ) : (
                     <>
                       {['pending', 'partial_paid'].includes(normalizedStatus) && (
                         <button onClick={() => setIsEditing(true)} className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm">
                           <Edit2 size={16} /> Edit Details
                         </button>
                       )}
                       <button onClick={handleCancel} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 hover:border-rose-200 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm">
                         <XCircle size={16} /> Cancel Booking
                       </button>
                     </>
                   )}
                </div>
             )}
             
             {/* Read-only notice */}
             {!['paid', 'approved', 'pending', 'partial_paid'].includes(normalizedStatus) && (
               <div className="pt-6 border-t border-slate-100 text-center">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">This booking can no longer be edited or cancelled.</p>
               </div>
             )}
          </div>
        )}

        {/* Display Edit Form Modal */}
        {booking && isEditing && (
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border border-[#268053]/20 animate-in zoom-in-95">
             <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
               <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Edit2 size={18} /></div>
               <div>
                 <h3 className="text-xl font-black text-slate-800">Edit Request Details</h3>
                 <p className="text-xs font-medium text-slate-500">To change the venue or dates, please cancel and create a new request.</p>
               </div>
             </div>

             <form onSubmit={handleEditSubmit} className="space-y-6">
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1"><Ticket size={12} className="inline mr-1"/> Event Title</label>
                 <input required type="text" value={editForm.eventTitle} onChange={e => setEditForm({...editForm, eventTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm focus:outline-none focus:border-[#268053]" />
               </div>
               
               <div className="grid sm:grid-cols-2 gap-6">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1"><Users size={12} className="inline mr-1"/> Participants</label>
                   <input required type="number" min="1" value={editForm.participantCount} onChange={e => setEditForm({...editForm, participantCount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm focus:outline-none focus:border-[#268053]" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1"><Phone size={12} className="inline mr-1"/> Phone Number</label>
                   <input required type="text" value={editForm.organizerPhone} onChange={e => setEditForm({...editForm, organizerPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm focus:outline-none focus:border-[#268053]" />
                 </div>
               </div>

               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1"><AlignLeft size={12} className="inline mr-1"/> Description</label>
                 <textarea rows={3} value={editForm.eventDescription} onChange={e => setEditForm({...editForm, eventDescription: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-bold text-sm focus:outline-none focus:border-[#268053]" />
               </div>

               <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all">Discard Changes</button>
                 <button type="submit" className="flex-1 bg-[#268053] hover:bg-[#1a5b3a] text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"><Save size={16}/> Save Updates</button>
               </div>
             </form>
          </div>
        )}
      </div>
    </div>
  );
}