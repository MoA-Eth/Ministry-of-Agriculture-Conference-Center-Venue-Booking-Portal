import { useState, useEffect, lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/lib/app-context';
import AppShell from '@/components/AppShell';

// Lazy-load all sub-pages — only the active page's chunk is fetched
const CalendarView = lazy(() => import('@/components/CalendarView'));
const VenuesPage = lazy(() => import('@/components/VenuesPage'));
const NewBookingForm = lazy(() => import('@/components/NewBookingForm'));
const MyBookings = lazy(() => import('@/components/BookingsList'));
const ManageBookings = lazy(() => import('@/components/ManageBookings'));
const Dashboard = lazy(() => import('@/components/Dashboard'));
const UserManagement = lazy(() => import('@/components/UserManagement'));
const VIPBookingForm = lazy(() => import('@/components/VIPBookingForm'));
const ManageServices = lazy(() => import('@/components/ManageServices'));
const VenueOperations = lazy(() => import('@/components/VenueOperations'));
const EmailTemplateManager = lazy(() => import('@/components/MessageCenter'));
const TechnicalTasks = lazy(() => import('@/components/TechnicalTasks'));
const CateringTasks = lazy(() => import('@/components/CateringTasks'));
const AuditLog = lazy(() => import('@/components/AuditLog'));
const BusinessRules = lazy(() => import('@/components/BusinessRules'));
const BillingAdmin = lazy(() => import('@/components/BillingAdmin'));

// Lightweight spinner for lazy sub-pages within the AppShell
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-400">Loading page…</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { role, token } = useApp();
  
  const defaultPage = 
    !token ? 'vip-booking' : 
    role === 'ict_admin' ? 'technical-tasks' :
    role === 'catering_support' ? 'catering-tasks' :
    ['system_admin', 'event_management', 'admin_finance', 'leadership'].includes(role) ? 'dashboard' : 
    'calendar';
    
  const [page, setPage] = useState(defaultPage);

  if (!token && !['calendar', 'venues', 'new-booking', 'vip-booking'].includes(page)) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const handleHash = () => {
      const hashWithQuery = window.location.hash.replace('#/', '').replace('#', '');
      const [hash] = hashWithQuery.split('?');
      
      // Added 'venue-operations' to the list of valid pages!
      const validPages = [
        'dashboard', 'calendar', 'venues', 'new-booking', 'vip-booking', 
        'my-bookings', 'manage-bookings', 'user-management', 'manage-services', 
        'venue-operations', 'message-center', 'technical-tasks', 'catering-tasks',
        'audit-log', 'business-rules', 'billing-admin'
      ];
      
      if (validPages.includes(hash)) {
        setPage(hash);
      }
    };

    handleHash(); 
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const renderPage = () => {
    // Role-based access control
    const isSpecialist = ['ict_admin', 'catering_support'].includes(role);
    const isAdmin = ['system_admin', 'event_management', 'admin_finance', 'leadership'].includes(role);
    const isOrganizer = role === 'organizer';

    switch (page) {
      case 'dashboard': 
        return isAdmin ? <Dashboard /> : <CalendarView />;
      case 'calendar': 
        return <CalendarView />;
      case 'venues': 
        return <VenuesPage />;
      case 'new-booking': 
        return <NewBookingForm onComplete={() => setPage('my-bookings')} />;
      case 'vip-booking': 
        return isAdmin ? <VIPBookingForm onComplete={() => setPage('my-bookings')} /> : <CalendarView />;
      case 'my-bookings': 
        return <MyBookings />;
      case 'manage-bookings': 
        return isAdmin ? <ManageBookings /> : <CalendarView />;
      case 'user-management': 
        return role === 'system_admin' ? <UserManagement /> : <CalendarView />;
      case 'manage-services': 
        return isAdmin ? <ManageServices /> : <CalendarView />;
      case 'venue-operations': 
        return isAdmin ? <VenueOperations /> : <CalendarView />;
      case 'message-center': 
        return role === 'system_admin' ? <EmailTemplateManager /> : <CalendarView />;
      case 'technical-tasks': 
        return (isSpecialist || isAdmin) ? <TechnicalTasks /> : <CalendarView />;
      case 'catering-tasks': 
        return (isSpecialist || isAdmin) ? <CateringTasks /> : <CalendarView />;
      case 'audit-log': 
        return isAdmin ? <AuditLog /> : <CalendarView />;
      case 'business-rules':
        return ['system_admin', 'event_management'].includes(role) ? <BusinessRules /> : <CalendarView />;
      case 'billing-admin':
        return role === 'admin_finance' ? <BillingAdmin /> : <CalendarView />;
      default: 
        return !token ? <VIPBookingForm onComplete={() => setPage('my-bookings')} /> : <Dashboard />;
    }
  };

  return (
    <AppShell 
      currentPage={page} 
      onNavigate={(p) => {
        setPage(p);
        window.location.hash = `#/${p}`;
      }}
    >
      <Suspense fallback={<PageLoader />}>
        {renderPage()}
      </Suspense>
    </AppShell>
  );
}

export default function Index() {
  return <AppContent />;
}