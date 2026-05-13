import React, { useState, useEffect } from 'react';
import { useApp, API_BASE } from '@/lib/app-context';
import { UserRole } from '@/lib/types';
import {
  Calendar,
  LayoutDashboard,
  Building2,
  PlusCircle,
  ClipboardList,
  Mail,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  Bell,
  Home,
  Monitor,
  UtensilsCrossed,
  Star,
  CheckCircle2,
  Users,
  History, 
  Menu, 
  X, 
  Settings,
  Banknote
} from 'lucide-react';
import { Link } from 'react-router-dom';
import moaLogo from '@/assets/moa-logo.png';

const roleLabels: Record<UserRole, string> = {
  organizer: 'Event Organizer',
  event_management: 'Event Management',
  ict_admin: 'ICT / Sys Admin',
  catering_support: 'Catering & Support',
  admin_finance: 'Admin & Finance',
  leadership: 'Ministry Leadership',
  system_admin: 'System Administrator',
};

interface NavItem {
  label: string;
  icon: React.ReactNode;
  id: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, id: 'dashboard', roles: ['event_management', 'admin_finance', 'leadership', 'system_admin'] },
  { label: 'Calendar', icon: <Calendar size={20} />, id: 'calendar', roles: ['organizer', 'event_management', 'ict_admin', 'catering_support', 'admin_finance', 'leadership', 'system_admin'] },
  { label: 'Venues', icon: <Building2 size={20} />, id: 'venues', roles: ['organizer', 'event_management', 'ict_admin', 'catering_support', 'admin_finance', 'leadership', 'system_admin'] },
  { label: 'Venue Operations', icon: <ShieldCheck size={20} />, id: 'venue-operations', roles: ['event_management', 'system_admin'] },
  { label: 'My Bookings', icon: <ClipboardList size={20} />, id: 'my-bookings', roles: ['organizer'] },
  { label: 'VIP Override Booking', icon: <Star size={20} />, id: 'vip-booking', roles: ['event_management', 'system_admin'] },
  { label: 'Manage Bookings', icon: <ShieldCheck size={20} />, id: 'manage-bookings', roles: ['event_management', 'system_admin'] },
  { label: 'Manage Services', icon: <Zap size={20} />, id: 'manage-services', roles: ['event_management', 'system_admin'] },
  { label: 'Technical Tasks', icon: <Monitor size={20} />, id: 'technical-tasks', roles: ['ict_admin'] },
  { label: 'Catering Tasks', icon: <UtensilsCrossed size={20} />, id: 'catering-tasks', roles: ['catering_support'] },
  { label: 'Message Center', icon: <Mail size={20} />, id: 'message-center', roles: ['system_admin'] },
  { label: 'User Management', icon: <Users size={20} />, id: 'user-management', roles: ['system_admin'] },
  { label: 'Activity Log', icon: <History size={20} />, id: 'audit-log', roles: ['event_management', 'system_admin', 'leadership'] },
  { label: 'Business Rules', icon: <Settings size={20} />, id: 'business-rules', roles: ['system_admin', 'event_management'] },
  { label: 'Billing & Admin', icon: <Banknote size={20} />, id: 'billing-admin', roles: ['admin_finance'] },
];

interface AppShellProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export default function AppShell({ currentPage, onNavigate, children }: AppShellProps) {
  const { role, user, logout, token } = useApp();
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.results || data);
      }
    } catch (err) { console.error("Notif fetch error", err); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/notifications/read_all/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Token ${token}` }
      });
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const handleNotifClick = async (n: any) => {
    if (!n.is_read) {
      try {
        await fetch(`${API_BASE}/notifications/${n.id}/read/`, {
          method: 'PATCH',
          headers: { 'Authorization': `Token ${token}` }
        });
        fetchNotifications();
      } catch (err) { console.error(err); }
    }
    if (n.link) {
      window.location.hash = n.link;
      setShowNotifications(false);
    }
  };

  // Close mobile menu if window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredNav = navItems.filter(item => {
    if (!token && item.id === 'my-bookings') return false;
    return item.roles.includes(role);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] w-full">
      
      {/* MOBILE OVERLAY BACKDROP */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* FLOATING MODERN SIDEBAR */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full flex flex-col bg-[#112a1f] text-white shadow-2xl transition-all duration-300 ease-in-out z-50 
        ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} 
        ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Mobile Close Button inside Sidebar */}
        <div className="lg:hidden absolute top-4 right-4 z-50">
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/80 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Logo area */}
        <Link 
          to="/" 
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-4 px-6 py-8 border-b border-white/10 hover:bg-white/5 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-center w-12 h-12 shrink-0 transition-transform group-hover:scale-105">
            <img src={moaLogo} alt="MoA Logo" className="w-full h-full object-contain" />
          </div>
          {(!collapsed || mobileMenuOpen) && (
            <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="text-[17px] font-serif font-medium tracking-wide text-white/95">MoA Portal</p>
              <p className="text-[10px] font-medium tracking-[0.2em] text-[#8cbaa2] uppercase mt-0.5">Conference System</p>
            </div>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-2 px-4 overflow-y-auto custom-scrollbar">
          {(!collapsed || mobileMenuOpen) && (
            <p className="text-[10px] font-bold tracking-widest text-[#5c8b74] uppercase mb-4 px-2">Menu</p>
          )}
          {filteredNav.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false); // Close menu on mobile after clicking
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-[#1b4332] text-white shadow-inner border border-white/5'
                    : 'text-[#a3c4b3] hover:bg-white/5 hover:text-white'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (!collapsed || mobileMenuOpen) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#2ed18a] rounded-r-full shadow-[0_0_10px_#2ed18a]" />
                )}
                
                <div className={`${isActive ? 'text-[#2ed18a]' : 'text-[#8cbaa2] group-hover:text-[#2ed18a]'} transition-colors ml-1`}>
                  {item.icon}
                </div>
                {(!collapsed || mobileMenuOpen) && <span className="font-semibold text-sm truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Role switcher (Bottom profile block) */}
        {(!collapsed || mobileMenuOpen) && token && user && (
          <div className="px-6 py-6 border-t border-white/10 bg-black/20 mt-auto shrink-0">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm border border-white/20 uppercase shrink-0">
                 {user.name?.charAt(0) || 'U'}
               </div>
               <div className="min-w-0">
                 <p className="text-sm font-bold truncate text-white">{user.name}</p>
                 <p className="text-xs text-[#8cbaa2] truncate">{user.email}</p>
               </div>
            </div>
            
            <div className="w-full text-xs font-bold text-[#b4d1c3] bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-center truncate">
              {roleLabels[user.role as UserRole] || user.role}
            </div>
          </div>
        )}

        {/* Desktop Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center py-4 border-t border-white/10 bg-[#0d2218] text-[#8cbaa2] hover:text-white hover:bg-black/40 transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight size={18} /> : 
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
              <ChevronLeft size={16} /> Collapse
            </div>
          }
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col w-full h-full overflow-hidden relative">
        
        {/* Top Header Bar - REFINED RESPONSIVENESS */}
        <header className="h-16 sm:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
             
             {/* Mobile Hamburger Button */}
             <button 
               onClick={() => setMobileMenuOpen(true)}
               className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
             >
               <Menu size={24} />
             </button>

             {/* Dynamic Page Title */}
             <h2 className="text-base sm:text-lg md:text-xl font-medium text-slate-700 tracking-wide font-serif truncate">
               {navItems.find(n => n.id === currentPage)?.label || 'Conference Center'}
             </h2>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
             {token && (
               <div className="relative">
                 <button 
                   onClick={() => setShowNotifications(!showNotifications)}
                   className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors relative"
                 >
                   <Bell size={20} />
                   {unreadCount > 0 && (
                     <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white animate-pulse"></span>
                   )}
                 </button>
                 
                 {/* NOTIFICATION OVERLAY */}
                 {showNotifications && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                     <div className="absolute top-12 right-0 w-[280px] sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4">
                       <div className="px-5 py-4 bg-[#f8fafc] border-b border-slate-100 flex justify-between items-center">
                         <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Bell size={14} className="text-[#268053]" /> Notifications</span>
                         {unreadCount > 0 && (
                           <button onClick={markAllRead} className="text-[9px] font-black uppercase text-[#268053] hover:underline">Mark all read</button>
                         )}
                       </div>
                       <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto custom-scrollbar">
                         {notifications.length === 0 ? (
                           <div className="p-8 text-center flex flex-col items-center">
                             <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                <CheckCircle2 className="w-6 h-6 text-slate-300" />
                             </div>
                             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                You're all caught up!
                             </p>
                           </div>
                         ) : (
                           notifications.map((n) => (
                             <div key={n.id} onClick={() => handleNotifClick(n)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer group ${!n.is_read ? 'bg-emerald-50/20' : ''}`}>
                               <div className="flex justify-between items-start mb-1.5 gap-2">
                                 <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${n.type === 'error' ? 'text-rose-500' : n.type === 'success' ? 'text-emerald-500' : 'text-amber-500'}`}>{n.title}</span>
                                 {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                               </div>
                               <p className="text-xs font-semibold text-slate-600 leading-snug group-hover:text-slate-900 transition-colors line-clamp-2">{n.message}</p>
                               <p className="text-[9px] font-black text-slate-300 uppercase mt-2 tracking-wider">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                             </div>
                           ))
                         )}
                       </div>
                     </div>
                   </>
                 )}
               </div>
             )}

             <Link 
               to="/"
               className="flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-full hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors shrink-0"
               title="Portal Home"
             >
               <Home size={18} /> <span className="hidden md:inline">Portal Home</span>
             </Link>
             
             {token ? (
               <button 
                 onClick={logout} 
                 className="flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-full hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-sm transition-colors shrink-0"
                 title="Logout"
               >
                 <LogOut size={18} /> <span className="hidden md:inline">Logout</span>
               </button>
             ) : (
               <Link to="/login" className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full bg-[#268053] hover:bg-[#1b4332] text-white font-bold text-sm transition-colors shadow-md shrink-0">
                 Log In
               </Link>
             )}
          </div>
        </header>

        {/* Scrollable Content Area with strict overflow control */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-[#f8fafc] p-4 sm:p-6 lg:p-8" id="main-scroll-container">
          <div className="max-w-[1400px] mx-auto 2xl:max-w-[1600px] w-full">
             {/* Rendered page component goes here */}
             {children}
          </div>
        </div>

      </main>
    </div>
  );
}