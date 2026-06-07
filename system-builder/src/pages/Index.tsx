import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '@/lib/app-context';
import AppShell from '@/components/AppShell';
import CalendarView from '@/components/CalendarView';
import VenuesPage from '@/components/VenuesPage';
import NewBookingForm from '@/components/NewBookingForm';
import MyBookings from '@/components/BookingsList'; 
import ManageBookings from '@/components/ManageBookings';
import Dashboard from '@/components/Dashboard';
import UserManagement from '@/components/UserManagement';
import VIPBookingForm from '@/components/VIPBookingForm';
import ManageServices from '@/components/ManageServices';
import VenueOperations from '@/components/VenueOperations'; 
import EmailTemplateManager from '@/components/MessageCenter';
import TechnicalTasks from '@/components/TechnicalTasks';
import CateringTasks from '@/components/CateringTasks';
import AuditLog from '@/components/AuditLog';
import BusinessRules from '@/components/BusinessRules';
import BillingAdmin from '@/components/BillingAdmin';

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
      {renderPage()}
    </AppShell>
  );
}

export default function Index() {
  return <AppContent />;
}