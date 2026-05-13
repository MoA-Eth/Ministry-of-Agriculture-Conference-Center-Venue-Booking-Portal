import { useState, useRef } from 'react';
import { useApp, API_BASE } from '@/lib/app-context';
import { 
  Building2, Users, Tag, ChevronRight, MapPin, Sparkles, 
  Plus, Edit2, Trash2, X, Save, Info, DollarSign, Image as ImageIcon, Upload, AlertTriangle, MonitorSmartphone, CheckCircle2, Eye, Crown
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

const typeBadgeStyles: Record<string, string> = {
  'Cinema': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Theatre/Auditorium': 'bg-purple-100 text-purple-700 border-purple-200',
  'Meeting': 'bg-blue-100 text-blue-700 border-blue-200',
  'Boardroom': 'bg-amber-100 text-amber-700 border-amber-200',
  'Lounge': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Refreshment': 'bg-slate-100 text-slate-700 border-slate-200',
};

const venueTypes = [
  'Cinema', 'Theatre/Auditorium', 'Meeting', 'Boardroom', 'Lounge', 'Refreshment'
];

const getFallbackImage = (type: string) => {
  const images: Record<string, string> = {
    'Cinema': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800',
    'Theatre/Auditorium': 'https://images.unsplash.com/photo-1507676184212-d0330a15183c?auto=format&fit=crop&q=80&w=800',
    'Meeting': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    'Boardroom': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
    'Lounge': 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800',
  };
  return images[type] || `https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=800`;
};

// ==========================================
// VENUE DETAILS MODAL
// ==========================================
function VenueDetailsModal({ venue, onClose, technicalServices, supportServices, isPrivilegedUser = false }: { venue: any, onClose: () => void, technicalServices: any[], supportServices: any[], isPrivilegedUser?: boolean }) {
  const includedIds = Array.isArray(venue.included_services) ? venue.included_services : [];
  
  const includedTech = technicalServices.filter(s => includedIds.includes(s.id.toString()));
  const includedSupport = supportServices.filter(s => includedIds.includes(s.id.toString()));

  // Splitting the purposes by comma
  const purposes = (venue.bestFor || venue.best_for || 'General purpose facility').split(',').map((p: string) => p.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto pb-10 sm:pb-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 flex flex-col my-auto">
        <div className="relative h-48 shrink-0 bg-slate-100 flex items-end overflow-hidden">
           <img src={venue.image || getFallbackImage(venue.type)} className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0f241a] via-[#0f241a]/60 to-transparent" />
           <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10 backdrop-blur-md">
             <X size={20} />
           </button>
           <div className="relative z-10 p-8 w-full">
             <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-black border backdrop-blur-md mb-3 inline-block ${typeBadgeStyles[venue.type] || 'bg-white text-slate-900'}`}>{venue.type}</span>
             <h2 className="text-3xl font-black text-white uppercase tracking-tight truncate">{venue.name}</h2>
           </div>
        </div>
        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh] custom-scrollbar bg-[#f8fafc]">
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Max Capacity</p>
                 <div className="flex items-center gap-2 text-slate-900 font-black text-xl">
                    <Users size={20} className="text-emerald-600" />
                    <span>{venue.capacity} Max</span>
                 </div>
              </div>
               {isPrivilegedUser && (
                 <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Daily Rate</p>
                    <div className="flex items-center gap-2 text-slate-900 font-black text-xl">
                       <DollarSign size={20} className="text-emerald-600" />
                       <span>{venue.price} ETB</span>
                    </div>
                 </div>
               )}
           </div>

           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center gap-2"><Info size={14}/> Ideal Purpose & Capabilities</p>
              <div className="grid gap-2">
                {purposes.map((purpose: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">{purpose}</span>
                  </div>
                ))}
              </div>
           </div>

           <div>
              <p className="text-[10px] font-black text-[#268053] uppercase tracking-widest mb-3 ml-1 flex items-center gap-2"><Sparkles size={14}/> Included Free Services</p>
              <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                 {includedTech.length === 0 && includedSupport.length === 0 ? (
                    <p className="text-sm text-slate-500 italic font-medium">No pre-installed services. All services must be requested separately.</p>
                 ) : (
                    <div className="flex flex-wrap gap-2">
                       {includedTech.map(s => (
                         <span key={s.id} className="px-3 py-1.5 bg-white border border-emerald-200 text-[10px] font-black uppercase tracking-tight rounded-lg text-emerald-800 shadow-sm flex items-center gap-1.5"><MonitorSmartphone size={12} className="text-emerald-500"/> {s.name}</span>
                       ))}
                       {includedSupport.map(s => (
                         <span key={s.id} className="px-3 py-1.5 bg-white border border-amber-200 text-[10px] font-black uppercase tracking-tight rounded-lg text-amber-800 shadow-sm flex items-center gap-1.5"><Tag size={12} className="text-amber-500"/> {s.name}</span>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function VenuesPage() {
  const { venues, bookings, role, token, refreshData, technicalServices = [], supportServices = [] } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- VIP ROOM SECURITY FILTER ---
  // Only allow admins/leadership to see rooms with "VIP" in the name
  const isPrivilegedUser = ['leadership', 'system_admin', 'event_management'].includes(role || '');
  const availableVenues = venues?.filter(v => 
    isPrivilegedUser ? true : !(v.name || '').toLowerCase().includes('vip')
  ) || [];

  // Management State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [viewingVenue, setViewingVenue] = useState<any | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', type: 'Meeting', capacity: '', best_for: '', price: '',
    included_services: [] as string[]
  });

  const canManage = ['system_admin', 'event_management'].includes(role);

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setFormData({ name: '', type: 'Meeting', capacity: '', best_for: '', price: '', included_services: [] });
  };

  const handleEdit = (v: any) => {
    setEditingId(v.id);
    setImageFile(null);
    setImagePreview(v.image || null);
    
    let parsedServices = [];
    try {
      parsedServices = Array.isArray(v.included_services) ? v.included_services : JSON.parse(v.included_services || '[]');
    } catch { parsedServices = []; }

    setFormData({
      name: v.name,
      type: v.type,
      capacity: v.capacity?.toString() || '',
      best_for: v.bestFor || v.best_for || '',
      price: v.price?.toString() || '',
      included_services: parsedServices.map(String)
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('Image is too large. Max size is 15MB.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleIncludedService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      included_services: prev.included_services.includes(id) 
        ? prev.included_services.filter(s => s !== id) 
        : [...prev.included_services, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingId;
    const url = isEdit ? `${API_BASE}/venues/${editingId}/` : `${API_BASE}/venues/`;
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('type', formData.type);
      payload.append('best_for', formData.best_for);
      if (formData.capacity) payload.append('capacity', formData.capacity);
      if (formData.price) payload.append('price', formData.price);
      payload.append('included_services', JSON.stringify(formData.included_services));
      if (imageFile) payload.append('image', imageFile);

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Token ${token}` },
        body: payload
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Backend Error:", errData);
        const firstError = Object.values(errData)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : (errData.detail || 'Failed to save venue.');
        throw new Error(String(errorMessage));
      }
      
      toast.success(`Venue ${isEdit ? 'updated' : 'created'} successfully`);
      resetForm();
      refreshData();
    } catch (error: any) {
      toast.error(error.message || `Error saving venue`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/venues/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });

      if (res.status === 400) {
        const err = await res.json();
        toast.error(err.detail || 'Cannot delete venue with active bookings.');
        return;
      }
      if (!res.ok) throw new Error('Delete failed');
      
      toast.success('Venue removed');
      refreshData();
    } catch (error) {
      toast.error('Error deleting venue.');
    }
  };

  return (
    <div className="pb-16" style={{ animation: 'fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
      


      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-2xl shadow-soft border border-slate-100 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#268053]/5 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="relative z-10 font-sans">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-100">
            <Sparkles className="w-3.5 h-3.5" /> Catalog
          </div>
          <h1 className="text-4xl font-serif font-black text-slate-900 tracking-tight mb-2">Venue Directory</h1>
          <p className="text-slate-500 max-w-2xl text-base font-medium leading-relaxed">Browse official Ministry of Agriculture facilities available for conferences, summits, and technical workshops.</p>
        </div>
        
        <div className="flex gap-3 relative z-10">
          {canManage && (
            <Button 
              className="bg-slate-900 hover:bg-slate-800 text-white font-black h-12 px-6 shadow-xl"
              onClick={() => { resetForm(); setIsAdding(true); }}
            >
              <Plus className="w-4 h-4 mr-2" /> Register Venue
            </Button>
          )}
          {['organizer', 'leadership'].includes(role) && (
            <Button 
              className="bg-[#268053] hover:bg-[#1b4332] text-white font-black h-12 px-6 shadow-glow"
              onClick={() => window.location.hash = '#/new-booking'}
            >
              Book a Facility <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Admin Form as a Fixed Modal Overlay */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 z-[150] flex items-start sm:items-center justify-center p-4 sm:p-20 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
           <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-none sm:max-h-[90vh] animate-in zoom-in-95 duration-500 my-auto">
             
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 shrink-0 bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-6 h-6" />}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{editingId ? 'Edit Venue Details' : 'Register New Facility'}</h3>
                 </div>
                 <button onClick={resetForm} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-full transition-all shadow-sm">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="grid lg:grid-cols-4 gap-8 relative z-10 font-sans">
                   
                   {/* Image Upload Area */}
                   <div className="lg:col-span-1 space-y-3">
                      <label className="text-[10px] font-black text-[#5c8b74] uppercase tracking-widest ml-1">Cover Image</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative aspect-[4/3] rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-500 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center text-center p-4"
                      >
                         {imagePreview ? (
                           <>
                             <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="text-white w-8 h-8" />
                             </div>
                           </>
                         ) : (
                           <>
                             <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <ImageIcon className="text-slate-400 group-hover:text-emerald-500 w-6 h-6" />
                             </div>
                             <p className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 px-4">Click to upload facility photo</p>
                           </>
                         )}
                         <input 
                           ref={fileInputRef}
                           type="file" 
                           accept="image/*"
                           onChange={handleImageChange}
                           className="hidden" 
                         />
                      </div>
                   </div>

                   <div className="lg:col-span-3 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#5c8b74] uppercase tracking-widest ml-1">Venue Name</label>
                          <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Grand Auditorium" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#5c8b74] uppercase tracking-widest ml-1">Category</label>
                          <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 outline-none transition-all cursor-pointer">
                            {venueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#5c8b74] uppercase tracking-widest ml-1">Max Capacity</label>
                          <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm" placeholder="500" />
                          </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black text-[#5c8b74] uppercase tracking-widest ml-1">Ideal Setting/Purpose</label>
                          <div className="relative">
                            <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input required type="text" value={formData.best_for} onChange={(e) => setFormData({ ...formData, best_for: e.target.value })} className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm" placeholder="Separate with commas e.g. Large conferences, 24/7 available" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-[#5c8b74] uppercase tracking-widest ml-1">Daily Rate (ETB)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full pl-12 pr-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm" placeholder="0.00" />
                          </div>
                      </div>

                      {/* Included Services Multi-Select */}
                      <div className="space-y-3 md:col-span-2 lg:col-span-3 pt-6 border-t border-slate-100">
                          <label className="text-[10px] font-black text-[#5c8b74] uppercase tracking-widest ml-1">Included Technical Capabilities (Free)</label>
                          <p className="text-xs text-slate-500 mb-2 ml-1">Select the services that are permanently installed in this venue so users aren't charged for them.</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                             {technicalServices.map(s => {
                               const isSelected = formData.included_services.includes(s.id.toString());
                               return (
                                 <div 
                                   key={s.id} 
                                   onClick={() => toggleIncludedService(s.id.toString())}
                                   className={`cursor-pointer p-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${isSelected ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                 >
                                   <span className="truncate pr-2">{s.name}</span>
                                   <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-100 border-slate-300'}`}>
                                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                   </div>
                                 </div>
                               );
                             })}
                          </div>
                      </div>

                      <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-4">
                          <Button type="submit" className="bg-[#112a1f] hover:bg-emerald-700 text-white font-black px-12 py-7 rounded-2xl shadow-2xl flex items-center gap-3 text-lg transition-transform hover:-translate-y-1 active:scale-95">
                            <Save className="w-5 h-5" /> {editingId ? 'Save Changes' : 'Confirm Registration'}
                          </Button>
                      </div>
                   </div>
                </form>
              </div>
           </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* --- FIXED: Now maps over availableVenues instead of venues --- */}
        {availableVenues?.map((venue, i) => {
          const isOutOfOrder = venue.status === 'out_of_order';
          const isVipVenue = (venue.name || '').toLowerCase().includes('vip');

          // Splitting the purpose text
          const purposes = (venue.bestFor || venue.best_for || 'General Facility').split(',').map((p: string) => p.trim()).filter(Boolean);

          return (
            <div
              key={venue.id}
              className={`group bg-white rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col relative transition-all duration-500 ease-out
                ${isOutOfOrder ? 'opacity-80 grayscale-[0.5] shadow-sm' : 'shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:-translate-y-2 hover:shadow-2xl'}
              `}
              style={{ animation: `fade-in-up 0.5s cubic-bezier(0.16,1,0.3,1) ${100 * i}ms both` }}
            >
              {/* Image Header */}
              <div className="h-56 relative overflow-hidden bg-slate-50">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                <img 
                  src={venue.image || getFallbackImage(venue.type)} 
                  alt={venue.name} 
                  className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${isOutOfOrder ? '' : 'group-hover:scale-110'}`}
                />
                
                {/* Status/Badge */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                   <span className={`text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl font-black border backdrop-blur-md shadow-lg ${typeBadgeStyles[venue.type] || 'bg-white/90 text-slate-700'}`}>
                     {venue.type}
                   </span>
                   {isVipVenue && (
                     <span className="text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl font-black bg-purple-600 text-white shadow-lg flex items-center gap-1 border border-purple-400">
                       <Crown size={10} /> VIP EXCLUSIVE
                     </span>
                   )}
                </div>

                {/* Pricing Overlay */}
                {isPrivilegedUser && (
                   <div className="absolute top-4 right-4 z-20 bg-black/30 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black border border-white/20">
                      {venue.price || '0.00'} ETB/day
                   </div>
                )}

                {/* OUT OF ORDER BADGE OVERLAY */}
                {isOutOfOrder && (
                  <div className="absolute inset-0 bg-red-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <AlertTriangle className="w-12 h-12 text-white mb-2" />
                    <div className="bg-red-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-2xl border-2 border-red-500/50">
                      Currently Out of Order
                    </div>
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="p-8 flex flex-col flex-1 font-sans relative z-30">
                {/* Admin Quick Actions */}
                {canManage && (
                  <div className="absolute -top-6 right-6 flex gap-2 transition-transform duration-300">
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(venue); }}
                        className="w-12 h-12 bg-white hover:bg-emerald-600 hover:text-white text-slate-600 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-95 border border-slate-100"
                        title="Edit Venue"
                     >
                        <Edit2 className="w-5 h-5" />
                     </button>
                     <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(venue.id, venue.name); }}
                        className="w-12 h-12 bg-white hover:bg-rose-600 hover:text-white text-slate-600 rounded-2xl flex items-center justify-center shadow-xl transition-all active:scale-95 border border-slate-100"
                        title="Delete Venue"
                     >
                        <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
                )}

                <div className="mb-6 mt-4">
                  <h3 className={`text-2xl font-serif font-black tracking-tight mb-4 truncate transition-colors uppercase ${isOutOfOrder ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-emerald-700'}`}>{venue.name}</h3>
                  
                  {/* NEW: Formatted Purpose List */}
                  <div className="flex flex-col gap-2">
                    {purposes.slice(0, 2).map((purpose: string, idx: number) => (
                      <p key={idx} className="text-xs text-slate-500 font-bold flex items-center gap-2 truncate">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span className="truncate">{purpose}</span>
                      </p>
                    ))}
                    {purposes.length > 2 && (
                      <p className="text-[10px] font-black text-slate-400 ml-6 mt-1 uppercase tracking-widest">
                        + {purposes.length - 2} more capabilities
                      </p>
                    )}
                  </div>

                </div>
                
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {venue.capacity && (
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</span>
                         <div className={`flex items-center gap-1.5 font-black text-sm ${isOutOfOrder ? 'text-slate-400' : 'text-slate-900'}`}>
                            <Users size={16} className={isOutOfOrder ? 'text-slate-400' : 'text-emerald-600'} />
                            <span>{venue.capacity}</span>
                         </div>
                      </div>
                    )}
                    
                    {/* View Details Button */}
                    <button onClick={() => setViewingVenue(venue)} className="flex flex-col items-start hover:opacity-70 transition-opacity">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Capabilities</span>
                       <div className={`flex items-center gap-1.5 font-black text-sm text-[#268053]`}>
                          <Eye size={16} />
                          <span className="border-b border-[#268053]/30 border-dashed">View Details</span>
                       </div>
                    </button>
                  </div>
                  
                  {isOutOfOrder ? (
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 shadow-sm cursor-not-allowed">
                      <X size={20} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm cursor-pointer" onClick={() => window.location.hash = `#/new-booking?venueId=${venue.id}`}>
                      <ChevronRight size={20} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* --- FIXED: Now uses availableVenues.length --- */}
      {(!availableVenues || availableVenues.length === 0) && (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-inner">
           <Building2 className="w-20 h-20 text-slate-100 mx-auto mb-8" />
           <p className="text-2xl font-serif font-black text-slate-300 italic">"The catalog is currently empty."</p>
           {canManage && (
              <button 
                onClick={() => setIsAdding(true)} 
                className="mt-6 text-emerald-600 font-black text-xs uppercase tracking-widest hover:text-emerald-700 transition-colors"
              >
                + Register the first venue
              </button>
           )}
        </div>
      )}
      {viewingVenue && (
         <VenueDetailsModal 
           venue={viewingVenue} 
           onClose={() => setViewingVenue(null)} 
           technicalServices={technicalServices}
           supportServices={supportServices}
           isPrivilegedUser={isPrivilegedUser}
         />
      )}
    </div>
  );
}