import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ChevronLeft, ChevronRight, Building, CheckCircle2, Building2, Users,
  X, Calendar as CalendarIcon, Clock, User, Mail, Phone, Info, Tag, CalendarCheck, AlertTriangle,
  MapPin, Send, ShieldCheck, ArrowUpRight, Globe, Crown, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp, API_BASE, mapBooking } from '@/lib/app-context';
import { format, isSameDay, isAfter, isBefore, parseISO } from 'date-fns';
import { EthDateTime } from 'ethiopian-calendar-date-converter';
import { ETH_MONTHS } from '@/components/ui/ethiopian-calendar';
import moaLogo from '@/assets/moa-logo.png';
import { Booking } from '@/lib/types';

// Load all images from assets folder except the logo
const heroModules = import.meta.glob('../assets/*.{png,jpg,jpeg,webp}', { eager: true });
const HERO_IMAGES = Object.entries(heroModules)
  .filter(([path]) => !path.toLowerCase().includes('moa-logo.png') && !path.toLowerCase().includes('moa logo.png'))
  .map(([_, mod]: any) => mod.default);

// Helper to display Gregorian date strings (YYYY-MM-DD) as Ethiopian dates
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

// Simple helper for full Ethiopian date (e.g. "Meskerem 1")
const getFullEthDate = (gregStr: string) => {
  if (!gregStr) return '';
  try {
    const [y, m, d] = gregStr.split('-').map(Number);
    const gDate = new Date(y, m - 1, d, 12, 0, 0);
    const ethDate = EthDateTime.fromEuropeanDate(gDate);
    return `${ETH_MONTHS[ethDate.month - 1]} ${ethDate.date}`;
  } catch {
    return gregStr;
  }
};



const getVenueImage = (type: string) => {
  const images: Record<string, string> = {
    'Cinema': 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800',
    'Theatre/Auditorium': 'https://images.unsplash.com/photo-1507676184212-d0330a15183c?auto=format&fit=crop&q=80&w=800',
    'Meeting': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    'Boardroom': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
    'Lounge': 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800',
  };
  return images[type] || `https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=800`;
};

interface EventDetailsModalProps {
  booking: Booking;
  venueName?: string;
  onClose: () => void;
}

function EventDetailsModal({ booking, venueName, onClose, toEthTime }: EventDetailsModalProps & { toEthTime: any }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      {/* MOBILE RESPONSIVE MODAL WRAPPER */}
      <div className="bg-white w-[95%] max-w-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="relative h-24 sm:h-32 shrink-0 bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 sm:p-8 flex items-end">
          <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
            <X size={20} />
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight truncate pr-10">{booking.eventTitle}</h2>
        </div>
        <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ethiopian Date</p>
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <CalendarIcon size={14} className="text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm truncate">{getEthDateString(booking.startDate)}</span>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Clock size={14} className="text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm truncate">{toEthTime(booking.startTime)} - {toEthTime(booking.endTime)} (Local)</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-100 flex items-start gap-4">
            <Building2 size={20} className="text-emerald-600 shrink-0 mt-1" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Facility Name</p>
              <p className="text-sm sm:text-base font-black text-slate-900 leading-tight uppercase truncate">{venueName}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Event Summary</p>
            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-4 sm:p-5 rounded-2xl italic border border-slate-100">
              "{booking.eventDescription || 'No detailed description provided for this session.'}"
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-center shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto px-10 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest">
            Close Briefing
          </button>
        </div>
      </div>
    </div>
  );
}

function Counter({ value, duration = 2500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 5);
      setCount(Math.floor(easedProgress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, value, duration]);

  return <span ref={elementRef}>{count.toLocaleString()}</span>;
}

interface ScheduleCarouselProps {
  bookings: Booking[];
  onSelect: (b: Booking) => void;
  toEthTime: any;
}

function ScheduleCarousel({ bookings, onSelect, toEthTime }: ScheduleCarouselProps) {
  const [index, setIndex] = useState(0);
  const itemsPerPage = 1;
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % totalPages);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(timer);
  }, [totalPages]);

  const pages = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(bookings.slice(i * itemsPerPage, (i + 1) * itemsPerPage));
  }

  return (
    <div className="relative group/carousel overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {pages.map((page, pIdx) => (
          <div key={pIdx} className="w-full shrink-0 space-y-2 px-0.5">
            {page.map((b) => {
              const isConfirmed = ['paid', 'approved'].includes(b.status.toLowerCase());

              return (
                <button
                  key={b.id}
                  onClick={() => onSelect(b)}
                  className="w-full flex items-center justify-between bg-slate-50/50 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all active:scale-[0.98] group/item"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-slate-700 group-hover/item:text-emerald-700 truncate">{getFullEthDate(b.startDate)}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight group-hover/item:text-emerald-600 flex items-center gap-1.5 shrink-0">
                    <span className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[8px] ${isConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isConfirmed ? 'Confirmed' : 'Pending'}
                    </span>
                    {toEthTime(b.startTime)} - {toEthTime(b.endTime)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1 relative z-10">
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'bg-emerald-500 w-4' : 'bg-slate-200 w-1.5'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={prev} className="p-1 rounded-lg bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors shadow-sm">
              <ChevronLeft size={14} />
            </button>
            <button onClick={next} className="p-1 rounded-lg bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 transition-colors shadow-sm">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { venues, technicalServices, supportServices, token, role, toEthTime } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  // MOBILE MENU STATE
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isPrivilegedUser = ['leadership', 'system_admin', 'event_management'].includes(role || '');

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPublicBookings = async () => {
      try {
        const res = await fetch(`${API_BASE}/bookings/?public=true`);
        const data = await res.json();
        setBookings((data.results || data).map(mapBooking));
      } catch (error) {
        console.error('Failed to fetch public bookings:', error);
      }
    };
    fetchPublicBookings();
  }, []);

  const ACTIVE_STATUSES = ['pending', 'partial_paid', 'paid', 'approved'];

  const getVenueStatus = (venueId: string) => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const activeBookings = bookings.filter(b => b.venueId === venueId && ACTIVE_STATUSES.includes(b.status));

    for (const b of activeBookings) {
      let todayStartTime: string | null = null;
      let todayEndTime: string | null = null;

      if (b.dailySchedules && b.dailySchedules.length > 0) {
        const ds = b.dailySchedules.find(d => d.date === todayStr);
        if (ds) {
          todayStartTime = ds.allDay ? '00:00' : (ds.startTime || b.startTime);
          todayEndTime = ds.allDay ? '23:59' : (ds.endTime || b.endTime);
        }
      } else if (b.startDate <= todayStr && b.endDate >= todayStr) {
        todayStartTime = b.startTime;
        todayEndTime = b.endTime;
      }

      if (todayStartTime && todayEndTime) {
        const startTime = parseISO(`${todayStr}T${todayStartTime}`);
        const endTime = parseISO(`${todayStr}T${todayEndTime}`);

        if (isAfter(now, startTime) && isBefore(now, endTime)) {
          return {
            label: `Occupied until ${toEthTime(todayEndTime)}`,
            color: 'bg-rose-500',
            textColor: 'text-rose-600',
            bgColor: 'bg-rose-50',
            booking: b
          };
        }
        if (isBefore(now, startTime)) {
          return {
            label: `Booked today at ${toEthTime(todayStartTime)}`,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-700',
            bgColor: 'bg-emerald-50',
            booking: b
          };
        }
      }
    }

    return {
      label: 'Available Today',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      booking: null
    };
  };

  const getUpcomingBookings = (venueId: string) => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const nowTimeStr = format(now, 'HH:mm');

    const entries: Booking[] = [];
    const activeBookings = bookings.filter(b => b.venueId === venueId && ACTIVE_STATUSES.includes(b.status));

    for (const b of activeBookings) {
      if (b.dailySchedules && b.dailySchedules.length > 0) {
        for (const ds of b.dailySchedules) {
          const schedDate = ds.date;
          const sTime = ds.allDay ? '00:00' : (ds.startTime || b.startTime);
          const eTime = ds.allDay ? '23:59' : (ds.endTime || b.endTime);

          if (schedDate > todayStr || (schedDate === todayStr && eTime > nowTimeStr)) {
            entries.push({
              ...b,
              startDate: schedDate,
              endDate: schedDate,
              startTime: sTime,
              endTime: eTime,
            });
          }
        }
      } else {
        if (b.endDate > todayStr || (b.endDate === todayStr && b.endTime > nowTimeStr)) {
          entries.push(b);
        }
      }
    }

    return entries.sort((a, b) =>
      a.startDate.localeCompare(b.startDate) || a.startTime.localeCompare(b.startTime)
    );
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-[#268053] selection:text-white">

      {activeBooking && (
        <EventDetailsModal
          booking={activeBooking}
          venueName={venues.find(v => v.id === activeBooking.venueId)?.name}
          onClose={() => setActiveBooking(null)}
          toEthTime={toEthTime}
        />
      )}

      {/* Top Navigation Bar - REFINED RESPONSIVENESS */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 animate-[slide-down_0.8s_cubic-bezier(0.16,1,0.3,1)] ${isScrolled
            ? 'bg-white/95 backdrop-blur-md py-3 shadow-lg border-b border-slate-200 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20'
            : 'bg-white border-b border-slate-100 py-4 sm:py-5 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20'
          }`}
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <img src={moaLogo} alt="MoA Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg lg:text-xl font-serif font-bold text-[#111827] leading-none mb-0.5 sm:mb-1 tracking-tight truncate">MoA Conference</h1>
              <p className="text-[8px] sm:text-[10px] font-medium text-slate-500 leading-none uppercase tracking-wide hidden sm:block truncate">Booking Management System</p>
            </div>
          </div>

          {/* Desktop Navigation - Improved Spacing/Breakpoints */}
          <div className="hidden xl:flex items-center gap-6 2xl:gap-10">
            <a href="#/venues" onClick={(e) => { e.preventDefault(); navigate('/app#/venues'); }} className="text-sm 2xl:text-base font-medium text-slate-800 hover:text-[#268053] transition-colors whitespace-nowrap">Venues</a>
            <a href="/book" onClick={(e) => { e.preventDefault(); navigate('/book'); }} className="text-sm 2xl:text-base font-medium text-slate-800 hover:text-[#268053] transition-colors whitespace-nowrap">Book a Venue</a>
            <a href="/track" onClick={(e) => { e.preventDefault(); navigate('/track'); }} className="text-sm 2xl:text-base font-medium text-slate-800 hover:text-[#268053] transition-colors whitespace-nowrap">Track Status</a>
            <a href="#/my-bookings" onClick={(e) => { e.preventDefault(); if (token) navigate('/app#/my-bookings'); else navigate('/login'); }} className="text-sm 2xl:text-base font-medium text-slate-800 hover:text-[#268053] transition-colors whitespace-nowrap">My Bookings</a>
            <a href="#/calendar" onClick={(e) => { e.preventDefault(); navigate('/app#/calendar'); }} className="text-sm 2xl:text-base font-medium text-slate-800 hover:text-[#268053] transition-colors whitespace-nowrap">Calendar</a>
            <a href="#/manage-bookings" onClick={(e) => { e.preventDefault(); if (token) navigate('/app#/manage-bookings'); else navigate('/login'); }} className="text-sm 2xl:text-base font-medium text-slate-800 hover:text-[#268053] transition-colors whitespace-nowrap">Admin Panel</a>
          </div>

          <div className="hidden lg:flex items-center gap-3 sm:gap-4 shrink-0">
            {token ? (
              <button onClick={() => navigate('/app')} className="px-4 xl:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border-2 border-[#268053] text-[#268053] rounded-full hover:bg-emerald-50 transition-all">
                Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="px-4 xl:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border-2 border-slate-200 text-slate-600 rounded-full hover:border-[#268053] hover:text-[#268053] transition-all">
                  Log In
                </button>
                <button onClick={() => navigate('/register')} className="px-5 xl:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-bold bg-[#268053] text-white rounded-full hover:bg-[#1b4332] transition-all shadow-md">
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* MOBILE & TABLET ACTION BUTTONS */}
          <div className="xl:hidden flex items-center gap-2 sm:gap-3">
            {token ? (
              <button onClick={() => navigate('/app')} className="px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-emerald-50 text-[#268053] rounded-full border-2 border-emerald-200 shadow-sm">
                Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button onClick={() => navigate('/login')} className="px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-white text-[#268053] rounded-full border-2 border-[#268053]/30 shadow-sm">
                  Login
                </button>
                <button onClick={() => navigate('/register')} className="hidden xs:flex px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest bg-[#268053] text-white rounded-full shadow-sm">
                  Sign Up
                </button>
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl transition-colors ${isMobileMenuOpen ? 'bg-slate-100 text-[#268053]' : 'text-slate-800 hover:bg-slate-50'}`}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MODERN MOBILE MENU OVERLAY - FIXED POSITIONING */}
        {isMobileMenuOpen && (
          <div className="xl:hidden absolute top-full left-0 w-full bg-white z-[150] shadow-2xl border-t border-slate-100 overflow-y-auto animate-in slide-in-from-top-4 duration-300 max-h-[calc(100vh-80px)]">
            <div className="p-6 flex flex-col gap-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Navigation</p>
              {[
                { label: 'Browse Venues', path: '/app#/venues' },
                { label: 'Book a Facility', path: '/book' },
                { label: 'Track My Request', path: '/track' },
                { label: 'Official Calendar', path: '/app#/calendar' },
                { label: 'My Bookings', path: '/app#/my-bookings', auth: true },
                { label: 'Admin Panel', path: '/app#/manage-bookings' },
              ].map((item) => {
                if (item.auth && !token) return null;
                return (
                  <a
                    key={item.label}
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();
                      const [route, hash] = item.path.split('#');
                      if (hash) navigate(`${route}#${hash}`);
                      else navigate(route);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 rounded-2xl transition-all group"
                  >
                    <span className="text-base font-bold text-slate-800 group-hover:text-[#268053]">{item.label}</span>
                    <ArrowUpRight size={18} className="text-slate-300 group-hover:text-[#268053]" />
                  </a>
                );
              })}

              {!token && (
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-100 text-slate-600">Login</button>
                  <button onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }} className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-[#268053] text-white shadow-lg">Register</button>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">© {new Date().getFullYear()} MoA Conference Center</p>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* RESPONSIVE HERO SECTION */}
        <section className="relative w-full overflow-visible min-h-[400px] sm:min-h-[550px] pt-24 pb-20 sm:pb-24 flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 z-0 overflow-hidden">
            {HERO_IMAGES.map((img, idx) => (
              <img
                key={img}
                src={img}
                alt={`Professional Conference Hall ${idx + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out ${idx === currentHeroIndex ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  animation: idx === currentHeroIndex ? 'zoom-out 20s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
                }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/95" />

            {HERO_IMAGES.length > 1 && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {HERO_IMAGES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentHeroIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentHeroIndex ? 'bg-emerald-500 w-8' : 'bg-white/30 w-2 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 bg-white/10 backdrop-blur-lg border border-white/30 rounded-full text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-6 sm:mb-8 shadow-2xl">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,1)]"></span> Official Venue Booking Portal
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-extrabold text-white leading-[1.15] tracking-tight mb-6 sm:mb-8 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              Ministry of Agriculture<br />Conference Center
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/95 font-medium mb-10 sm:mb-12 max-w-2xl leading-relaxed drop-shadow-lg opacity-90 text-center px-4">
              Reserve world-class conference facilities for your official events, ministerial meetings, and institutional gatherings.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto px-4">
              <button onClick={() => navigate('/book')} className="w-full sm:w-auto bg-[#da9131] hover:bg-[#c2812c] text-white font-extrabold px-8 sm:px-12 py-4 sm:py-5 rounded-xl shadow-[0_20px_40px_-15px_rgba(218,145,49,0.5)] transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 text-base sm:text-lg">
                Request a Booking <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button onClick={() => navigate('/app#/calendar')} className="w-full sm:w-auto bg-white/5 backdrop-blur-md border border-white/40 text-white hover:bg-white/10 font-extrabold px-8 sm:px-12 py-4 sm:py-5 rounded-xl shadow-xl transition-all text-base sm:text-lg">
                View Availability
              </button>
            </div>
          </div>

          {/* RESPONSIVE STATS BAR */}
          <div className="absolute bottom-0 translate-y-1/2 z-20 w-full max-w-5xl px-4 sm:px-6 lg:px-12 grid grid-cols-3 gap-2 sm:gap-6">
            <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col items-center text-center group hover:bg-[#268053] transition-all duration-500 border-b-2 sm:border-b-4 border-emerald-500/50">
              <span className="text-white text-xl sm:text-4xl font-black mb-1 sm:mb-2"><Counter value={venues.length} /></span>
              <span className="text-emerald-100/60 text-[8px] sm:text-[10px] font-black uppercase tracking-widest sm:tracking-[0.2em] group-hover:text-white transition-colors leading-tight">Venues Available</span>
            </div>
            <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col items-center text-center group hover:bg-[#268053] transition-all duration-500 border-b-2 sm:border-b-4 border-emerald-500/50">
              <span className="text-white text-xl sm:text-4xl font-black mb-1 sm:mb-2"><Counter value={venues.reduce((acc, v) => acc + (v.capacity || 0), 0)} />+</span>
              <span className="text-emerald-100/60 text-[8px] sm:text-[10px] font-black uppercase tracking-widest sm:tracking-[0.2em] group-hover:text-white transition-colors leading-tight">Max Capacity</span>
            </div>
            <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col items-center text-center group hover:bg-[#268053] transition-all duration-500 border-b-2 sm:border-b-4 border-emerald-500/50">
              <span className="text-white text-xl sm:text-4xl font-black mb-1 sm:mb-3"><Counter value={technicalServices.length + supportServices.length} /></span>
              <span className="text-emerald-100/60 text-[8px] sm:text-[10px] font-black uppercase tracking-widest sm:tracking-[0.2em] group-hover:text-white transition-colors leading-tight">Available Services</span>
            </div>
          </div>
        </section>

        <div className="h-16 sm:h-24 bg-white" />

        <section className="bg-[#fcfdfd] py-16 sm:py-24 w-full border-t border-slate-100">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-20 gap-6 sm:gap-8 text-center md:text-left">
              <div className="max-w-3xl">
                <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[#268053] text-[10px] font-black uppercase tracking-widest mb-4 sm:mb-6">
                  <Building2 className="w-3.5 h-3.5" /> Premium Venues
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-extrabold text-[#111827] tracking-tight leading-tight">
                  Discover Our Premium <br className="hidden sm:block" />
                  Conference Halls
                </h2>
              </div>
              <div className="md:text-right">
                <p className="text-slate-500 font-medium text-sm sm:text-lg max-w-md mx-auto md:ml-auto leading-relaxed">
                  Tailored environments designed for high-impact meetings, international summits, and strategic state workshops.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {venues.map((venue, i) => {
                const isOutOfOrder = venue.status === 'out_of_order';
                const isVipVenue = (venue.name || '').toLowerCase().includes('vip');

                const purposes = (venue.bestFor || venue.best_for || 'General Facility').split(',').map((p: string) => p.trim()).filter(Boolean);

                return (
                  <div key={venue.id} className={`group bg-white rounded-[2rem] p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col transition-all duration-500 ease-out relative ${isOutOfOrder ? 'opacity-80 grayscale-[0.5]' : 'hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] hover:-translate-y-2'}`} style={{ animation: `fade-in-up 0.5s cubic-bezier(0.16,1,0.3,1) ${100 * i}ms both` }}>
                    <div className="relative aspect-[16/10] rounded-[1.5rem] overflow-hidden mb-6 bg-slate-50">
                      <img src={venue.image || getVenueImage(venue.type)} alt={venue.name} className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${isOutOfOrder ? '' : 'group-hover:scale-110 grayscale-[0.1] group-hover:grayscale-0'}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* OUT OF ORDER BADGE OVERLAY */}
                      {isOutOfOrder && (
                        <div className="absolute inset-0 bg-red-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-white mb-2" />
                          <div className="bg-red-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full shadow-2xl border-2 border-red-500/50">
                            Currently Out of Order
                          </div>
                        </div>
                      )}

                      {/* STATUS BADGE (Top Left) */}
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        {!isOutOfOrder && (
                          <div className="w-fit">
                            {(() => {
                              const status = getVenueStatus(venue.id);
                              return (
                                <button
                                  onClick={() => status.booking && setActiveBooking(status.booking)}
                                  className={`flex items-center gap-1.5 sm:gap-2 ${status.bgColor} backdrop-blur-md border border-white/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg transition-all ${status.booking ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'}`}
                                >
                                  <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${status.color} animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]`}></span>
                                  <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wider ${status.textColor}`}>{status.label}</span>
                                </button>
                              );
                            })()}
                          </div>
                        )}

                        {/* VIP EXCLUSIVE BADGE */}
                        {isVipVenue && (
                          <span className="w-fit text-[8px] sm:text-[9px] uppercase tracking-widest px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-black bg-purple-600 text-white shadow-lg flex items-center gap-1 border border-purple-400">
                            <Crown size={10} /> VIP EXCLUSIVE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="px-2 sm:px-3 flex-1 flex flex-col relative z-30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <h3 className={`text-xl sm:text-2xl font-bold tracking-tight transition-colors truncate ${isOutOfOrder ? 'text-slate-400 line-through' : 'text-[#111827] group-hover:text-[#268053]'}`}>{venue.name}</h3>
                        <span className="w-fit px-2 py-1 bg-slate-100 rounded-lg text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none">
                          {venue.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 mt-2 sm:mt-3">
                        <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest border ${isOutOfOrder ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'}`}>
                          <Users size={14} className={isOutOfOrder ? 'text-slate-400' : 'text-emerald-500'} />
                          {venue.capacity} Max
                        </div>
                      </div>

                      <div className="mt-auto pt-4 sm:pt-6 border-t border-slate-50">

                        <div className="flex flex-col mb-4 sm:mb-6">
                          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#268053] mb-2 sm:mb-3 leading-none">Upcoming Schedule</span>

                          {(() => {
                            if (isOutOfOrder) return <p className="text-[10px] sm:text-xs font-medium text-slate-400 italic">Schedule unavailable</p>;

                            // NEW CHECK: Protect VIP Schedules
                            if (isVipVenue) return (
                              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-2.5 sm:p-3 flex items-center gap-2">
                                <Crown size={14} className="text-purple-400" />
                                <span className="text-[10px] sm:text-xs font-bold text-purple-600/70">Schedule Restricted</span>
                              </div>
                            );

                            const upcoming = getUpcomingBookings(venue.id);
                            if (upcoming.length === 0) {
                              return <p className="text-[10px] sm:text-xs font-medium text-slate-400 italic">No future bookings scheduled</p>;
                            }
                            return (
                              <ScheduleCarousel
                                bookings={upcoming}
                                onSelect={(b) => setActiveBooking(b)}
                                toEthTime={toEthTime}
                              />
                            );
                          })()}

                        </div>

                        <div className="flex flex-col mb-6 sm:mb-8">
                          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#268053] mb-2 sm:mb-3 leading-none">Ideal Setting For</span>
                          <div className="flex flex-col gap-1.5 sm:gap-2">
                            {purposes.slice(0, 2).map((purpose: string, idx: number) => (
                              <p key={idx} className="text-[10px] sm:text-xs text-slate-500 font-bold flex items-center gap-2 truncate">
                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                <span className="truncate">{purpose}</span>
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Lock button for VIP Venues if user is not an Admin/Leadership */}
                        {isOutOfOrder ? (
                          <button disabled className="w-full py-4 sm:py-5 text-xs sm:text-sm font-black bg-slate-200 text-slate-400 rounded-2xl shadow-sm flex items-center justify-center gap-2 cursor-not-allowed">
                            Venue Unavailable
                          </button>
                        ) : isVipVenue ? (
                          !isPrivilegedUser ? (
                            <div className="w-full py-4 sm:py-5 text-[10px] sm:text-xs font-black bg-[#faf8ff] text-[#b181f7] rounded-3xl border border-[#eee4ff] flex items-center justify-center gap-2.5 shadow-sm">
                              <Crown className="w-4 h-4 text-[#b181f7]" strokeWidth={2.5} />
                              <span className="uppercase tracking-[0.08em] font-black">VIP Exclusive Facility</span>
                            </div>
                          ) : (
                            <button onClick={() => navigate('/app#/vip-booking')} className="w-full py-4 sm:py-5 text-xs sm:text-sm font-black bg-[#9333ea] text-white hover:bg-[#7c3aed] transition-all duration-300 rounded-2xl shadow-xl flex items-center justify-center gap-2 group/btn">
                              <Crown className="w-4 h-4" /> Book as VIP Manager <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                          )
                        ) : (
                          <button onClick={() => navigate(`/book?venueId=${venue.id}`)} className="w-full py-4 sm:py-5 text-xs sm:text-sm font-black bg-[#111827] text-white hover:bg-[#268053] transition-all duration-300 rounded-2xl shadow-xl flex items-center justify-center gap-2 group/btn">
                            Book This Venue <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-[#111827] mb-3 sm:mb-4">How It Works</h2>
              <p className="text-sm sm:text-base text-slate-500 font-medium">Follow these four simple steps to secure your official ministerial event venue.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
              {[
                { step: '01', title: 'Register Account', desc: 'Create your official Event Organizer profile to access the booking portal.' },
                { step: '02', title: 'Select Venue', desc: 'Browse available halls and check real-time availability for your preferred dates.' },
                { step: '03', title: 'Submit Request', desc: 'Fill out the event details and attach your official request letter for approval.' },
                { step: '04', title: 'Confirmation', desc: 'Receive instant updates as your booking is reviewed and confirmed by management.' },
              ].map((item, i) => (
                <div key={i} className="relative group p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-[#268053] hover:border-[#268053] transition-all duration-500">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-100/50 group-hover:text-white/20 transition-colors absolute top-4 right-6 sm:top-6 sm:right-8">{item.step}</span>
                  <h4 className="text-lg sm:text-xl font-bold text-[#111827] group-hover:text-white mb-2 sm:mb-3 mt-4">{item.title}</h4>
                  <p className="text-slate-500 group-hover:text-white/80 text-xs sm:text-sm font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-16 sm:py-24 bg-[#f8fafc] border-y border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 sm:mb-6">
                Help Center
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-[#111827] mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {[
                { q: "Who can book a venue?", a: "The portal is primarily for Ministry of Agriculture events and official partners. External organizations must be registered Event Organizers and have an official invitation or partnership letter." },
                { q: "What documents are required for booking?", a: "An official request letter signed by your organization's head is required. You can upload this directly in the booking form as a PDF or image." },
                { q: "Can I cancel a booking?", a: "Yes, you can cancel your request through 'My Bookings'. However, confirmed or completed bookings require administrative intervention for cancellation." },
                { q: "What technical support is provided?", a: "All venues include high-speed Wi-Fi and basic AV equipment. Advanced ICT support and catering can be requested during the booking process." },
              ].map((faq, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all">
                  <h4 className="text-base sm:text-lg font-bold text-[#111827] mb-3 sm:mb-4 flex gap-3 sm:gap-4">
                    <span className="text-emerald-600">Q.</span> {faq.q}
                  </h4>
                  <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed pl-6 sm:pl-8 border-l border-emerald-100">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0f172a] text-white pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-12 xl:px-20 mt-0">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 pb-16 sm:pb-20 border-b border-white/10 mb-12 sm:mb-20">
            <div>
              <h4 className="text-emerald-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-4 sm:mb-6">Main Headquarters</h4>
              <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">Ministry of Agriculture Area<br />Addis Ababa, Ethiopia<br />P.O. Box 62347</p>
            </div>
            <div>
              <h4 className="text-emerald-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-4 sm:mb-6">Office Hours</h4>
              <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">Mon - Fri: 8:30 AM - 5:30 PM<br />Sat: 9:00 AM - 12:30 PM<br />Sun: Closed</p>
            </div>
            <div>
              <h4 className="text-emerald-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-4 sm:mb-6">ICT Support</h4>
              <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">Email: support@moa.gov.et<br />Phone: +251 11 123 4567<br />Internal: Ext. 405</p>
            </div>
            <div>
              <h4 className="text-emerald-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-4 sm:mb-6">Facility Rental</h4>
              <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">Email: events@moa.gov.et<br />Phone: +251 11 123 8899</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-8 sm:gap-12 pb-8 sm:pb-12">
            <div className="max-w-sm">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                  <img src={moaLogo} alt="MoA Logo" className="w-full h-full object-contain grayscale brightness-200" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-none">MoA Conference Center</h3>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">Providing world-class infrastructure for the Ministry of Agriculture of Ethiopia.</p>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-center sm:text-left">© {new Date().getFullYear()} MoA Ethiopia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}