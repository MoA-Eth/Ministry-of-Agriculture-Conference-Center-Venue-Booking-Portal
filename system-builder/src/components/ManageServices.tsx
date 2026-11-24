import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { 
  Wifi, Monitor, Mic, Volume2, Video, Camera, Save, Languages, 
  Laptop, FileText, Coffee, Utensils, Droplets, Layout, 
  ClipboardList, Users, ShieldCheck, Eraser, Plus, Trash2, 
  Edit3, Check, X, DollarSign, Settings2, Zap
} from 'lucide-react';
import { toast } from 'sonner';

export default function ManageServices() {
  const { 
    technicalServices, supportServices, servicePrices, 
    addService, removeService, updateServicePrice
  } = useApp();

  // Service Management State
  const [isAdding, setIsAdding] = useState<'technical' | 'support' | null>(null);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('0');
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  const serviceIcons: Record<string, any> = {
    'Internet Access': Wifi,
    'HDMI Connection': Monitor,
    'Wireless Sharing': Settings2,
    'LED Screen / Display': Layout,
    'Microphone': Mic,
    'Sound System': Volume2,
    'Video Conferencing': Video,
    'Photography': Camera,
    'Meeting Recording': Save,
    'Livestreaming': Monitor,
    'Interpretation System': Languages,
    'Presentation Laptop': Laptop,
    'Stationery': FileText,
    'Coffee Break': Coffee,
    'Lunch Catering': Utensils,
    'Water Service': Droplets,
    'Registration Desk': ClipboardList,
    'Event Signage': Layout,
    'Reception Support': Users,
    'Security Support': ShieldCheck,
    'Cleaning Service': Eraser,
  };

  const handleAdd = () => {
    if (!newServiceName.trim()) {
      toast.error('Service name is required');
      return;
    }
    addService(isAdding!, newServiceName, parseFloat(newServicePrice) || 0);
    setIsAdding(null);
    setNewServiceName('');
    setNewServicePrice('0');
    toast.success('Service added successfully');
  };

  const handleUpdatePrice = (id: string, name: string, type: 'technical' | 'support') => {
    updateServicePrice(id, name, parseFloat(editPrice) || 0, type);
    setEditingService(null);
  };

  const renderServiceList = (services: any[], type: 'technical' | 'support') => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800 font-serif lowercase first-letter:uppercase">
          {type} services
        </h3>
        <button 
          onClick={() => setIsAdding(type)}
          className="flex items-center gap-2 px-4 py-2 bg-[#268053] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#1b6b47] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(s => {
          const Icon = serviceIcons[s.name] || Settings2;
          const isEditing = editingService === s.id;
          const price = servicePrices[s.name] || 0;

          return (
            <div key={s.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              
              <div className="flex items-start justify-between relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${type === 'technical' ? 'bg-emerald-50 text-[#268053]' : 'bg-amber-50 text-amber-600'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => removeService(type, s.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6 relative z-10">
                <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{s.name}</h4>
                <div className="mt-4 flex items-center justify-between">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input 
                          type="number" 
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          className="w-24 pl-6 pr-2 py-1 text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold focus:ring-[#268053]"
                          autoFocus
                        />
                      </div>
                      <button 
                        onClick={() => handleUpdatePrice(s.id, s.name, type)}
                        className="p-1.5 bg-[#268053] text-white rounded-lg hover:bg-[#1b6b47]"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingService(null)}
                        className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-black text-slate-800">
                        {price > 0 ? `${Number(price).toLocaleString()} ETB` : 'Free / Included'}
                      </span>
                      <button 
                        onClick={() => {
                          setEditingService(s.id);
                          setEditPrice(price.toString());
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="w-3 h-3" /> Adjust
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-emerald-400 shadow-2xl shrink-0">
              <Zap className="w-8 h-8" />
           </div>
           <div>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                Manage Services
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Configure technical and support offerings with dynamic pricing
              </p>
           </div>
        </div>
        
        {/* Count Badges */}
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
           <div className="px-3 sm:px-4 py-2 border-r border-slate-200 text-center">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Tech Services</p>
              <p className="text-base sm:text-lg font-black text-slate-800">{technicalServices.length}</p>
           </div>
           <div className="px-3 sm:px-4 py-2 text-center">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Services</p>
              <p className="text-base sm:text-lg font-black text-slate-800">{supportServices.length}</p>
           </div>
        </div>
      </div>

      <div className="space-y-16 animate-in fade-in duration-300">
        {renderServiceList(technicalServices, 'technical')}
        <div className="h-px bg-slate-100" />
        {renderServiceList(supportServices, 'support')}
      </div>

      {/* MODAL: ADD SERVICE */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h2 className="text-2xl font-serif font-bold text-slate-900">Add {isAdding} Service</h2>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Expansion Registry</p>
                </div>
                <button onClick={() => setIsAdding(null)} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Service Identity</label>
                  <input 
                    type="text" 
                    value={newServiceName}
                    onChange={e => setNewServiceName(e.target.value)}
                    placeholder="Enter service name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-[#268053] focus:border-[#268053] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Base Unit Price (ETB)</label>
                  <div className="relative">
                     <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input 
                       type="number" 
                       value={newServicePrice}
                       onChange={e => setNewServicePrice(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3 text-sm font-bold focus:ring-[#268053] focus:border-[#268053] transition-all"
                     />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                 <button 
                  onClick={() => setIsAdding(null)}
                  className="flex-1 py-3 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                  onClick={handleAdd}
                  className="flex-[2] bg-slate-900 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                 >
                   Register Service
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
