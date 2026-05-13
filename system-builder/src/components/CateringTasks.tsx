import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  UtensilsCrossed, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  HandHelping,
  Brush
} from 'lucide-react';

const serviceIcons: Record<string, React.ReactNode> = {
  'Catering': <UtensilsCrossed className="w-4 h-4" />,
  'Cleaning': <Brush className="w-4 h-4" />,
  'Security': <ShieldCheck className="w-4 h-4" />,
  'Decoration': <Sparkles className="w-4 h-4" />,
  'Ushering': <HandHelping className="w-4 h-4" />,
  'default': <HandHelping className="w-4 h-4" />
};

const getServiceIcon = (name: string) => {
  const match = Object.keys(serviceIcons).find(key => name.toLowerCase().includes(key.toLowerCase()));
  return match ? serviceIcons[match] : serviceIcons.default;
};

export default function CateringTasks() {
  const { bookings, venues, supportServices, acknowledgeCateringTask, toggleSupportServiceAvailability } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter ONLY bookings that have support services requested
  const cateringBookings = bookings.filter(b => b.supportServices && b.supportServices.length > 0);

  const toggleAck = (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    acknowledgeCateringTask(id, !currentStatus);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16" style={{ animation: 'fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
      
      {/* Header */}
      <div className="mb-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full -mr-32 -mt-32 border border-amber-100 z-0 opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-amber-600" />
            Catering & Support Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl">
            Monitor and manage catering, cleaning, security, and other support service requirements for ministry conferences.
            Track service requests and confirm readiness for each event.
          </p>
        </div>
      </div>

      {cateringBookings.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-20 text-center shadow-sm">
          <div className="mx-auto w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">All Clear</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            There are currently no active bookings with support service requests.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {cateringBookings.map((b, i) => {
            const venue = venues.find(v => v.id === b.venueId);
            const isExpanded = expandedId === b.id;
            const isAck = b.cateringAcknowledged;

            return (
              <div 
                key={b.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'shadow-xl ring-1 ring-slate-100' : 'shadow-soft hover:shadow-md hover:border-slate-300'
                }`}
                style={{ animation: `fade-in-up 0.5s cubic-bezier(0.16,1,0.3,1) ${50 * i}ms both` }}
              >
                {/* Task Card Header */}
                <div 
                  className="p-6 cursor-pointer group"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                    
                    {/* Status indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${
                        isAck ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {isAck ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${isAck ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isAck ? 'Ready' : 'Pending'}
                      </span>
                    </div>

                    {/* Event Detail */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-serif font-bold text-slate-900 truncate group-hover:text-amber-600 transition-colors mb-2">
                        {b.eventTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-700">{venue?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{format(new Date(b.startDate), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{b.startTime} - {b.endTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Toggle */}
                    <div className="flex items-center gap-3">
                      <Button 
                        size="sm"
                        variant={isAck ? "outline" : "default"}
                        className={`font-bold transition-all px-6 py-5 rounded-xl ${
                          isAck ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                        onClick={(e) => toggleAck(b.id, !!isAck, e)}
                      >
                        {isAck ? 'Awaiting Event' : 'Acknowledge Task'}
                      </Button>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-[#fffbf5] p-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid lg:grid-cols-2 gap-10">
                      
                      {/* Support Service Specs */}
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Support Service Requirements</span>
                        <div className="grid gap-4">
                          {b.supportServices.map(id => {
                            const s = supportServices.find(ss => ss.id === id);
                            const isUnavailable = (b.unavailableSupportServices || []).includes(id);

                            return s ? (
                              <div key={id} className={`flex items-center justify-between border rounded-2xl p-5 shadow-sm transition-all duration-300 ${
                                isUnavailable ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200 hover:border-amber-300'
                              }`}>
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                                    isUnavailable ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                    {getServiceIcon(s.name)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold transition-colors ${isUnavailable ? 'text-rose-900' : 'text-slate-800'}`}>
                                        {s.name}
                                      </span>
                                      {isUnavailable && (
                                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">
                                          Not Available
                                        </span>
                                      )}
                                    </div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isUnavailable ? 'text-rose-400' : 'text-slate-400'}`}>
                                      {isUnavailable ? 'Resource Shortage' : 'Standard Delivery'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleSupportServiceAvailability(b.id, id); }}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border transition-all ${
                                      isUnavailable 
                                        ? 'bg-rose-600 text-white border-transparent hover:bg-rose-700 shadow-sm' 
                                        : 'bg-white text-slate-400 border-slate-200 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50'
                                    }`}
                                  >
                                    {isUnavailable ? 'Set Available' : 'Set Unavailable'}
                                  </button>
                                  <span className={`w-3 h-3 rounded-full shadow-inner ${isAck ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>

                      {/* Coordination & Info */}
                      <div className="space-y-8">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Event Logistics</span>
                          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-medium text-slate-700">
                            <div className="flex items-center gap-4">
                              <Users className="w-5 h-5 text-slate-400" />
                              <p><span className="text-slate-400 mr-2">Participants:</span> {b.participantCount}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <UtensilsCrossed className="w-5 h-5 text-slate-400" />
                              <p><span className="text-slate-400 mr-2">Venue:</span> {venue?.name} ({venue?.type})</p>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                               <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-3">Organizer Contact</p>
                               <p className="text-lg font-bold text-slate-900 mb-3">{b.organizerName}</p>
                               <div className="space-y-2">
                                 <a href={`mailto:${b.organizerEmail}`} className="flex items-center gap-3 text-amber-600 hover:underline">
                                   <Mail size={16} /> {b.organizerEmail}
                                 </a>
                                 <a href={`tel:${b.organizerPhone}`} className="flex items-center gap-3 text-amber-600 hover:underline">
                                   <Phone size={16} /> {b.organizerPhone || 'N/A'}
                                 </a>
                               </div>
                            </div>
                          </div>
                        </div>

                        {b.eventDescription && (
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Event Notes / Context</span>
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 text-slate-700 leading-relaxed italic text-sm">
                              "{b.eventDescription}"
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
