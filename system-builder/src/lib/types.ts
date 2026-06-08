export type UserRole = 'organizer' | 'event_management' | 'ict_admin' | 'catering_support' | 'admin_finance' | 'leadership' | 'system_admin';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
  created_at?: string;
}

export type BookingStatus = 'pending' | 'management_approved' | 'partial_paid' | 'paid' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'reserved' | 'confirmed';

export type VenueType = 'Cinema' | 'Theatre/Auditorium' | 'Meeting' | 'Boardroom' | 'Lounge' | 'Refreshment';

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  capacity: number | null;
  bestFor: string;
  best_for?: string; // Backend alias
  price: number | null;
  status: 'vacant' | 'out_of_order';
  included_services: string[];
  image?: string | null;
}

export interface TechnicalService {
  id: string;
  name: string;
  price: number;
}

export interface SupportService {
  id: string;
  name: string;
  price: number;
}

export interface DailySchedule {
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

export interface Booking {
  id: string;
  userId: string | null;
  venueId: string;
  venueName?: string;
  eventTitle: string;
  eventDescription: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  organizerOrganization: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  dailySchedules?: DailySchedule[];
  participantCount: number;
  status: BookingStatus;
  technicalServices: string[];
  supportServices: string[];
  letterAttachment?: string | null;
  ictAcknowledged: boolean;
  unavailableTechnicalServices?: string[];
  cateringAcknowledged: boolean;
  unavailableSupportServices?: string[];
  rejectionReason: string;
  venueDailyRate: number;
  serviceFees?: number;
  totalPrice?: number;
  createdAt: string;
  managementApprovedBy?: string | null;
  managementApprovedAt?: string | null;
  
  // Backend & Legacy Aliases
  user?: any;
  organizer_email?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  event_title?: string;
  unavailable_technical_services?: string[];
  unavailable_support_services?: string[];
  total_price?: number;
  venue_name?: string;
  participant_count?: number;
  pax?: number;
  venue?: string | number;
  title?: string;
  description?: string;
  phone?: string;
  rejection_reason?: string;
}
