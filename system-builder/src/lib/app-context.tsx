import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Booking, UserRole, TechnicalService, SupportService, Venue, SystemUser } from './types';
import { toast } from 'sonner';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://10.10.20.251/api';
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://10.10.20.251';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  token: string | null;
  user: SystemUser | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  bookings: Booking[];
  venues: Venue[];
  technicalServices: TechnicalService[];
  supportServices: SupportService[];
  servicePrices: Record<string, number>;
  addBooking: (booking: any) => Promise<any>;
  updateBookingStatus: (id: string, status: Booking['status'], reason?: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  addService: (type: 'technical' | 'support', name: string, price: number) => Promise<void>;
  removeService: (type: 'technical' | 'support', id: string) => Promise<void>;
  updateServicePrice: (id: string, name: string, price: number, type: 'technical' | 'support') => Promise<void>;
  acknowledgeTechnicalTask: (id: string, acknowledged: boolean) => Promise<void>;
  toggleTechnicalServiceAvailability: (bookingId: string, serviceId: string) => Promise<void>;
  acknowledgeCateringTask: (id: string, acknowledged: boolean) => Promise<void>;
  toggleSupportServiceAvailability: (bookingId: string, serviceId: string) => Promise<void>;
  auditLogs: any[];
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// =======================================================
// CRASH-PROOF MAPPERS (Prevents the White Screen of Death)
// =======================================================
export const mapBooking = (b: any): Booking => ({
  id: b.id?.toString() || '',
  userId: b.user ? b.user.toString() : null,
  venueId: b.venue?.toString() || '',
  venueName: b.venue_name || 'Unknown Venue',
  eventTitle: b.event_title || 'Untitled Event',
  eventDescription: b.event_description || '',
  organizerName: b.organizer_name || 'Unknown Organizer',
  organizerEmail: b.organizer_email || '',
  organizerPhone: b.organizer_phone || '',
  organizerOrganization: b.organization || '',
  startDate: b.start_date || '',
  endDate: b.end_date || '',
  startTime: b.start_time?.substring(0, 5) || '',
  endTime: b.end_time?.substring(0, 5) || '',
  dailySchedules: b.daily_schedules || [],
  participantCount: b.participant_count || 0,
  status: b.status || 'reserved',
  // Safely mapping arrays so it never crashes!
  technicalServices: (b.technical_services || []).map((id: any) => id?.toString()),
  supportServices: (b.support_services || []).map((id: any) => id?.toString()),
  letterAttachment: b.letter_attachment ? (b.letter_attachment.startsWith('http') ? b.letter_attachment : `${SERVER_URL}${b.letter_attachment}`) : null,
  ictAcknowledged: b.ict_acknowledged || false,
  unavailableTechnicalServices: (b.unavailable_technical_services || []).map((id: any) => id?.toString()),
  cateringAcknowledged: b.catering_acknowledged || false,
  unavailableSupportServices: (b.unavailable_support_services || []).map((id: any) => id?.toString()),
  createdAt: b.created_at || new Date().toISOString(),
  rejectionReason: b.rejection_reason || '',
  venueDailyRate: Number(b.venue_daily_rate || 0),
  serviceFees: Number(b.service_fees || 0),
  totalPrice: Number(b.total_price || 0),
});

const mapVenue = (v: any): Venue => ({
  id: v.id?.toString() || '',
  name: v.name || '',
  type: v.type || '',
  capacity: v.capacity || 0,
  bestFor: v.best_for || '',
  price: Number(v.price || 0),
  status: v.status || 'vacant',
  included_services: v.included_services || [],

  image: v.image ? (v.image.startsWith('http') ? v.image : `${SERVER_URL}${v.image}`) : null,
});

const mapService = (s: any): any => ({
  ...s,
  id: s.id?.toString() || '',
  price: Number(s.price || 0),
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('organizer');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<SystemUser | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [technicalServices, setTechnicalServices] = useState<TechnicalService[]>([]);
  const [supportServices, setSupportServices] = useState<SupportService[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- ETHIOPIAN TIME UTILITY ---
  const toEthTime = (date: Date | string | undefined | null) => {
    if (!date) return 'TBD';
    try {
      const d = typeof date === 'string' ? (date.includes('T') ? new Date(date) : new Date(`2000-01-01T${date}`)) : date;
      if (isNaN(d.getTime())) return typeof date === 'string' ? date : 'TBD';

      const gregHour = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');

      // Ethiopian 12-hour convention: 6 AM is 12:00
      let ethHour = (gregHour - 6 + 12) % 12;
      if (ethHour === 0) ethHour = 12;

      let period = "";
      if (gregHour >= 6 && gregHour < 12) period = "Morning";
      else if (gregHour >= 12 && gregHour < 18) period = "Afternoon";
      else if (gregHour >= 18 && gregHour < 24) period = "Evening";
      else period = "Night";

      return `${ethHour}:${mins} ${period}`;
    } catch {
      return typeof date === 'string' ? date : 'TBD';
    }
  };

  const refreshData = useCallback(() => setRefreshTrigger(prev => prev + 1), []);

  const getHeaders = useCallback((isJson = true) => {
    const h: any = {};
    if (isJson) h['Content-Type'] = 'application/json';
    if (token) h['Authorization'] = `Token ${token}`;
    return h;
  }, [token]);

  useEffect(() => {
    if (user) setRole(user.role);
  }, [user]);

  const login = async (email: string, pass: string) => {
    const res = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setToken(data.token);
    setUser(data.user);
    setRole(data.user.role);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    refreshData();
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await fetch(`${API_BASE}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setToken(data.token);
    setUser(data.user);
    setRole(data.user.role);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    refreshData();
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` }
        });
      } catch (_) { }
    }
    setToken(null);
    setUser(null);
    setRole('organizer');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/auth/me/`, { headers: { 'Authorization': `Token ${token}` } })
      .then(r => {
        if (r.status === 401 || r.status === 403) {
          setToken(null); setUser(null);
          localStorage.removeItem('token'); localStorage.removeItem('user');
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (data && data.id) {
          setUser(data);
          setRole(data.role);
          localStorage.setItem('user', JSON.stringify(data));
        }
      })
      .catch(() => { });
  }, [token]);

  // =======================================================
  // MASTER DATA FETCHER & PRIVACY SHIELD
  // =======================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentToken = localStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (currentToken) headers['Authorization'] = `Token ${currentToken}`;

        const bookingsUrl = currentToken ? `${API_BASE}/bookings/` : `${API_BASE}/bookings/?public=true`;

        // FIX: Fetch ALL core data simultaneously, regardless of login status!
        const fetchPromises: any[] = [
          fetch(bookingsUrl, { headers }),
          fetch(`${API_BASE}/venues/`, { headers }),
          fetch(`${API_BASE}/technical-services/`, { headers }),
          fetch(`${API_BASE}/support-services/`, { headers }),
          ...(currentToken ? [fetch(`${API_BASE}/audit-logs/`, { headers })] : [])
        ];

        const responses = await Promise.all(fetchPromises);

        // Check if any response is 401 (Unauthorized)
        if (responses.some(r => r.status === 401)) {
          console.warn("Unauthorized access detected. Clearing invalid token.");
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        }

        const bData = await responses[0].json();
        const vData = await responses[1].json();
        const tData = await responses[2].json();
        const sData = await responses[3].json();
        const aData = currentToken ? await responses[4].json() : [];

        const rawBookings = (bData.results || bData || []).map(mapBooking);

        // PRIVACY SHIELD
        const securedBookings = rawBookings.map((b: Booking) => {
          const isAdmin = role !== 'organizer';
          const isMyBooking = user && (
            b.userId?.toString() === user.id?.toString() ||
            b.organizerEmail?.toLowerCase() === user.email?.toLowerCase()
          );

          if (!isAdmin && !isMyBooking) {
            return {
              ...b,
              eventTitle: 'Reserved (Unavailable)',
              organizerName: 'Private Booking',
              organizerEmail: 'Hidden',
              organizerPhone: 'Hidden',
              organizerOrganization: 'Protected',
              eventDescription: 'This time slot has been secured by another user.',
              totalPrice: 0,
              participantCount: 0,
              technicalServices: [],
              supportServices: [],
              letterAttachment: null,
            };
          }
          return b;
        });

        setBookings(securedBookings);
        setVenues((vData.results || vData || []).map(mapVenue));

        // Set the services globally so the form can instantly read them!
        setTechnicalServices((tData.results || tData || []).map(mapService));
        setSupportServices((sData.results || sData || []).map(mapService));
        if (currentToken) setAuditLogs(aData.results || aData || []);

      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [refreshTrigger, token, user, role]); // Removed getHeaders from dependency to prevent loops

  const servicePrices = useMemo(() => {
    const prices: Record<string, number> = {};
    technicalServices.forEach(s => { prices[s.name] = Number(s.price); });
    supportServices.forEach(s => { prices[s.name] = Number(s.price); });
    return prices;
  }, [technicalServices, supportServices]);

  const addBooking = useCallback(async (form: any) => {
    try {
      const formData = new FormData();
      formData.append('venue', form.venueId || form.venue);
      formData.append('event_title', form.eventTitle || form.event_title);
      formData.append('event_description', form.eventDescription || form.event_description || '');
      formData.append('organizer_name', form.organizerName || form.organizer_name || form.name || '');
      formData.append('organizer_email', form.organizerEmail || form.organizer_email || form.email || '');
      formData.append('organizer_phone', form.organizerPhone || form.organizer_phone || form.phone || '');

      formData.append('organization', form.organization || form.organizerOrganization || '');
      formData.append('total_price', (form.totalPrice || form.total_price || 0).toString());

      formData.append('start_date', form.startDate || form.start_date);
      formData.append('end_date', form.endDate || form.end_date);
      formData.append('participant_count', (form.participantCount || form.participant_count || 0).toString());

      formData.append('daily_schedules', JSON.stringify(form.dailySchedules || []));

      if (form.dailySchedules?.length > 0) {
        const first = form.dailySchedules[0];
        formData.append('start_time', first.allDay ? '00:00' : (first.startTime || '08:00'));
        const last = form.dailySchedules[form.dailySchedules.length - 1];
        formData.append('end_time', last.allDay ? '23:59' : (last.endTime || '17:00'));
      }

      const t_services = form.technicalServices || form.technical_services || [];
      const s_services = form.supportServices || form.support_services || [];
      t_services.forEach((id: string) => formData.append('technical_services', id));
      s_services.forEach((id: string) => formData.append('support_services', id));

      if (form.status) formData.append('status', form.status);
      if (form.asGuest) formData.append('as_guest', 'true');

      if (form.letterAttachment) {
        formData.append('letter_attachment', form.letterAttachment);
      }

      const res = await fetch(`${API_BASE}/bookings/`, {
        method: 'POST',
        headers: getHeaders(false),
        body: formData,
      });

      const responseData = await res.json();

      if (!res.ok) {
        let errMsg = 'Failed to submit booking';
        if (responseData) {
          if (typeof responseData === 'string') {
            errMsg = responseData;
          } else if (responseData.detail) {
            errMsg = responseData.detail;
          } else if (responseData.error) {
            errMsg = responseData.error;
          } else {
            const firstField = Object.keys(responseData)[0];
            const firstErr = responseData[firstField];
            errMsg = `${firstField.replace(/_/g, ' ')}: ${Array.isArray(firstErr) ? firstErr[0] : firstErr}`;
          }
        }
        throw new Error(errMsg);
      }

      toast.success('Booking request submitted successfully!');
      refreshData();
      return responseData;
    } catch (error: any) {
      console.error('Booking failed:', error);
      const msg = error.message || 'Failed to submit booking';
      toast.error(msg);
      throw error;
    }
  }, [refreshData, getHeaders]);

  const updateBookingStatus = useCallback(async (id: string, status: string, reason?: string) => {
    try {
      // 1. SAFE MAPPING: Ensure frontend labels match backend choices
      let backendStatus = status.toLowerCase();
      if (backendStatus === 'confirmed') backendStatus = 'paid';
      if (backendStatus === 'override') backendStatus = 'approved';
      if (backendStatus === 'reserved') backendStatus = 'pending';

      const res = await fetch(`${API_BASE}/bookings/${id}/update_status/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: backendStatus, rejection_reason: reason }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        console.error("SERVER ERROR DETAIL:", responseData);
        throw new Error(responseData.error || responseData.detail || JSON.stringify(responseData));
      }

      toast.success(`Booking set to ${backendStatus}`);

      // FIX: Using your app's actual data refresh function
      refreshData();

    } catch (error: any) {
      console.error("Update failed:", error);
      toast.error(error.message || 'Update failed');
      throw error;
    }
  }, [refreshData, getHeaders]);

  const cancelBooking = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/cancel/`, { method: 'PATCH', headers: getHeaders() });
      if (res.ok) {
        toast.success('Booking cancelled');
        refreshData();
      }
    } catch (error) {
      toast.error('Cancellation failed');
    }
  }, [refreshData, getHeaders]);

  const addService = useCallback(async (type: 'technical' | 'support', name: string, price: number) => {
    const endpoint = type === 'technical' ? 'technical-services' : 'support-services';
    try {
      await fetch(`${API_BASE}/${endpoint}/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, price }),
      });
      refreshData();
      toast.success('Service added');
    } catch (error) {
      toast.error('Failed to add service');
    }
  }, [refreshData, getHeaders]);

  const removeService = useCallback(async (type: 'technical' | 'support', id: string) => {
    const endpoint = type === 'technical' ? 'technical-services' : 'support-services';
    try {
      await fetch(`${API_BASE}/${endpoint}/${id}/`, { method: 'DELETE', headers: getHeaders() });
      refreshData();
      toast.success('Service removed');
    } catch (error) {
      toast.error('Failed to remove service');
    }
  }, [refreshData, getHeaders]);

  const updateServicePrice = useCallback(async (id: string, name: string, price: number, type: 'technical' | 'support') => {
    const endpoint = type === 'technical' ? 'technical-services' : 'support-services';
    try {
      await fetch(`${API_BASE}/${endpoint}/${id}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ price }),
      });
      refreshData();
      toast.success('Price updated');
    } catch (error) {
      toast.error('Price update failed');
    }
  }, [refreshData, getHeaders]);

  const acknowledgeTechnicalTask = useCallback(async (id: string, acknowledged: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/acknowledge_ict/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ ict_acknowledged: acknowledged }),
      });
      if (res.ok) {
        toast.success(acknowledged ? 'Task acknowledged' : 'Acknowledgment reset');
        refreshData();
      }
    } catch (error) {
      toast.error('Failed to update technical status');
    }
  }, [refreshData, getHeaders]);

  const toggleTechnicalServiceAvailability = useCallback(async (bookingId: string, serviceId: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      let newList = [...(booking.unavailableTechnicalServices || [])];
      if (newList.includes(serviceId)) {
        newList = newList.filter(id => id !== serviceId);
      } else {
        newList.push(serviceId);
      }

      const res = await fetch(`${API_BASE}/bookings/${bookingId}/set_unavailable_services/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ unavailable_technical_services: newList }),
      });
      if (res.ok) {
        toast.success('Service status updated');
        refreshData();
      }
    } catch (error) {
      toast.error('Failed to update service availability');
    }
  }, [bookings, getHeaders, refreshData]);

  const toggleSupportServiceAvailability = useCallback(async (bookingId: string, serviceId: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      let newList = [...(booking.unavailableSupportServices || [])];
      if (newList.includes(serviceId)) {
        newList = newList.filter(id => id !== serviceId);
      } else {
        newList.push(serviceId);
      }

      const res = await fetch(`${API_BASE}/bookings/${bookingId}/set_unavailable_support_services/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ unavailable_support_services: newList }),
      });
      if (res.ok) {
        toast.success('Service status updated');
        refreshData();
      }
    } catch (error) {
      toast.error('Failed to update service availability');
    }
  }, [bookings, getHeaders, refreshData]);

  const acknowledgeCateringTask = useCallback(async (id: string, acknowledged: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/acknowledge_catering/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ catering_acknowledged: acknowledged }),
      });
      if (res.ok) {
        toast.success(acknowledged ? 'Catering task acknowledged' : 'Acknowledgment reset');
        refreshData();
      }
    } catch (error) {
      toast.error('Failed to update catering status');
    }
  }, [refreshData, getHeaders]);

  return (
    <AppContext.Provider value={{
      role, setRole, token, user, login, register, logout, bookings, venues, addBooking, updateBookingStatus, cancelBooking,
      technicalServices, supportServices, servicePrices,
      addService, removeService, updateServicePrice,
      acknowledgeTechnicalTask, toggleTechnicalServiceAvailability, acknowledgeCateringTask, toggleSupportServiceAvailability,
      auditLogs, toEthTime,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}