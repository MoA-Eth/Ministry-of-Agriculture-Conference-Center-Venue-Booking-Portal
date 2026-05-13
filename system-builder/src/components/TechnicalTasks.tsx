import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Monitor, 
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
  Cpu,
  Wifi,
  Video,
  Tv
} from 'lucide-react';
import { ETH_MONTHS } from '@/components/ui/ethiopian-calendar';
import { EthDateTime } from 'ethiopian-calendar-date-converter';

const serviceIcons: Record<string, React.ReactNode> = {
  'Internet Access': <Wifi className="w-4 h-4" />,
  'LED Screen / Display': <Tv className="w-4 h-4" />,
  'Video Conferencing': <Video className="w-4 h-4" />,
  'Livestreaming': <Monitor className="w-4 h-4" />,
  'default': <Cpu className="w-4 h-4" />
};

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

export default function TechnicalTasks() {
  const { bookings, venues, technicalServices, acknowledgeTechnicalTask, toggleTechnicalServiceAvailability } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter ONLY bookings that have technical services requested
  const techBookings = bookings.filter(b => b.technicalServices && b.technicalServices.length > 0);

  const toggleAck = (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    acknowledgeTechnicalTask(id, !currentStatus);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16" style={{ animation: 'fade-in-up 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
      
      {/* Header */}
      <div className="mb-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 border border-slate-100 z-0 opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-serif font-bold text-slate-900 flex items-center gap-3">
            <Monitor className="w-8 h-8 text-[#268053]" />
            Technical Support Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl">
            Monitor and coordinate IT / Technical requirements for ministry conferences. 
            Track high-value equipment requests and verify infrastructure readiness.
          </p>
        </div>
      </div>

      {techBookings.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-20 text-center shadow-sm">
          <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#268053]" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">Systems Clear</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            There are currently no active bookings with specialized technical service requests.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {techBookings.map((b, i) => {
            const venue = venues.find(v => v.id === b.venueId);
            const isExpanded = expandedId === b.id;
            const isAck = b.ictAcknowledged;
            
            // NEW: Check if any services are marked as unavailable
            const unavailableCount = b.unavailableTechnicalServices?.length || 0;
            const hasUnavailable = unavailableCount > 0;

            return (
              <div 
                key={b.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'shadow-xl ring-1 ring-slate-100' : 'shadow-soft hover:shadow-md hover:border-slate-300'
                } ${hasUnavailable ? 'border-rose-200' : ''}`}
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
                      <h3 className="text-xl font-serif font-bold text-slate-900 truncate group-hover:text-[#268053] transition-colors mb-2">
                        {b.eventTitle}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-700">{venue?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {/* NEW: Ethiopian Date applied here */}
                          <span>{getEthDateString(b.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{b.startTime} - {b.endTime}</span>
                        </div>
                      </div>

                      {/* NEW: Prominent warning badge if services are unavailable */}
                      {hasUnavailable && (
                        <div className="flex items-center gap-1.5 mt-3 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg w-fit border border-rose-200 shadow-sm animate-pulse">
                          <AlertCircle size={14} />
                          {unavailableCount} Requested Service{unavailableCount > 1 ? 's' : ''} Unavailable
                        </div>
                      )}
                    </div>

                    {/* Action Toggle */}
                    <div className="flex items-center gap-3">
                      <Button 
                        size="sm"
                        variant={isAck ? "outline" : "default"}
                        className={`font-bold transition-all px-6 py-5 rounded-xl ${
                          isAck ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'bg-slate-900 hover:bg-black text-white'
                        }`}
                        onClick={(e) => toggleAck(b.id, !!isAck, e)}
                      >
                        {isAck ? 'Awaiting Event' : 'Acknowledge Task'}
                      </Button>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-[#268053] group-hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-[#f8fafc] p-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid lg:grid-cols-2 gap-10">
                      
                      {/* Technical Specs */}
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Detailed Technical Requirements</span>
                        <div className="grid gap-3">
                          {b.technicalServices.map(id => {
                            const s = technicalServices.find(ts => ts.id === id);
                            const isUnavailable = b.unavailableTechnicalServices?.includes(id);
                            
                            return s ? (
                              <div key={id} className={`flex items-center justify-between border rounded-xl p-4 shadow-sm group/item transition-all ${isUnavailable ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200 hover:border-[#268053]'}`}>
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors border ${isUnavailable ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-50 text-[#268053] border-slate-100 group-hover/item:bg-emerald-50'}`}>
                                    {serviceIcons[s.name] || serviceIcons.default}
                                  </div>
                                  <div>
                                    <span className={`font-bold block ${isUnavailable ? 'text-rose-700' : 'text-slate-800'}`}>{s.name}</span>
                                    {isUnavailable && <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Not Available</span>}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => toggleTechnicalServiceAvailability(b.id, id)}
                                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${
                                      isUnavailable 
                                        ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white' 
                                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-600'
                                    }`}
                                  >
                                    {isUnavailable ? 'Mark as Available' : 'Set Unavailable'}
                                  </button>
                                  <span className={`w-3 h-3 rounded-full ${isUnavailable ? 'bg-rose-400' : (isAck ? 'bg-emerald-400' : 'bg-amber-400')} shadow-sm`}></span>
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
                              <Monitor className="w-5 h-5 text-slate-400" />
                              <p><span className="text-slate-400 mr-2">Infrastructure:</span> {venue?.bestFor || 'Standard ICT Suite'}</p>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                               <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-3">Organizer Contact</p>
                               <p className="text-lg font-bold text-slate-900 mb-3">{b.organizerName}</p>
                               <div className="space-y-2">
                                 <a href={`mailto:${b.organizerEmail}`} className="flex items-center gap-3 text-[#268053] hover:underline">
                                   <Mail size={16} /> {b.organizerEmail}
                                 </a>
                                 <a href={`tel:${b.organizerPhone}`} className="flex items-center gap-3 text-[#268053] hover:underline">
                                   <Phone size={16} /> {b.organizerPhone || 'N/A'}
                                 </a>
                               </div>
                            </div>
                          </div>
                        </div>

                        {b.eventDescription && (
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Technical Notes / Context</span>
                            <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-6 text-slate-700 leading-relaxed italic text-sm">
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