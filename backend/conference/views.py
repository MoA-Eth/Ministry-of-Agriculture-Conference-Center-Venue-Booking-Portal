"""
API views for the Conference Management System.
Full role-based access control with proper permissions.
"""
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from datetime import datetime, time, timedelta
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated 
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token

from .utils import send_automated_email, log_action
from .models import Venue, TechnicalService, SupportService, Booking, SystemUser, EmailTemplate, AuditLog, SystemSettings, Notification
from .serializers import (
    RegisterSerializer,
    VenueSerializer,
    TechnicalServiceSerializer,
    SupportServiceSerializer,
    BookingSerializer,
    BookingStatusSerializer,
    SystemUserSerializer,
    EmailTemplateSerializer,
    AuditLogSerializer,
    SystemSettingsSerializer,
    NotificationSerializer,
)
from .permissions import (
    get_role,
    IsSystemAdmin,
    IsEventManagementOrAdmin,
    IsOrganizerOrAdmin,
    IsICTOrAdmin,
    IsCateringOrAdmin,
    IsAuthenticatedOrPublicRead,
    IsLeadership,
)

# ---------------------------------------------------------------------------
# Authentication Views
# ---------------------------------------------------------------------------
def health_check(request):
    return JsonResponse({"status": "ok"})
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        role = serializer.validated_data.get('role', 'organizer')
        if role != 'organizer':
            return Response(
                {'error': 'Only Event Organizer accounts can be self-registered.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        system_user = serializer.save()
        token, _ = Token.objects.get_or_create(user=system_user.user)
        return Response({
            'token': token.key,
            'user': {
                'id':    system_user.id,
                'name':  system_user.name,
                'email': system_user.email,
                'role':  system_user.role,
            }
        }, status=status.HTTP_201_CREATED)

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = (request.data.get('email') or '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=400)

        user = authenticate(username=email, password=password)
        if not user:
            return Response({'error': 'Invalid email or password.'}, status=400)

        if not user.is_active:
            return Response({'error': 'This account has been deactivated.'}, status=403)

        token, _ = Token.objects.get_or_create(user=user)

        try:
            sp = user.system_profile
            user_data = {
                'id':         sp.id,
                'name':       sp.name,
                'email':      sp.email,
                'role':       sp.role,
                'created_at': sp.created_at.isoformat() if sp.created_at else None,
            }
        except SystemUser.DoesNotExist:
            user_data = {
                'id':    user.id,
                'name':  user.get_full_name() or user.username,
                'email': user.email,
                'role':  'system_admin',
            }

        return Response({'token': token.key, 'user': user_data})

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sp = request.user.system_profile
            return Response({
                'id':         sp.id,
                'name':       sp.name,
                'email':      sp.email,
                'role':       sp.role,
                'created_at': sp.created_at.isoformat() if sp.created_at else None,
            })
        except SystemUser.DoesNotExist:
            return Response({
                'id':    request.user.id,
                'name':  request.user.get_full_name() or request.user.username,
                'email': request.user.email,
                'role':  'system_admin',
            })

    def patch(self, request):
        try:
            sp = request.user.system_profile
        except SystemUser.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=404)

        name     = request.data.get('name')
        password = request.data.get('password')
        new_pass = request.data.get('new_password')

        if name:
            sp.name = name
            sp.save()
            request.user.first_name = name.split(' ')[0]
            request.user.last_name  = ' '.join(name.split(' ')[1:]) if ' ' in name else ''
            request.user.save()

        if password and new_pass:
            if not request.user.check_password(password):
                return Response({'error': 'Current password is incorrect.'}, status=400)
            if len(new_pass) < 8:
                return Response({'error': 'New password must be at least 8 characters.'}, status=400)
            request.user.set_password(new_pass)
            request.user.save()
            Token.objects.filter(user=request.user).delete()
            token, _ = Token.objects.get_or_create(user=request.user)
            return Response({'detail': 'Password updated.', 'token': token.key})

        return Response({
            'id':    sp.id, 'name': sp.name,
            'email': sp.email, 'role': sp.role,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        request.user.auth_token.delete()
        return Response({'detail': 'Successfully logged out.'})


# ---------------------------------------------------------------------------
# Notifications ViewSet
# ---------------------------------------------------------------------------

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = get_role(user)
        return Notification.objects.filter(
            Q(recipient=user) | Q(role_target=role) | Q(role_target='all')
        )

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'read'})

    @action(detail=False, methods=['patch'])
    def read_all(self, request):
        user = self.request.user
        role = get_role(user)
        Notification.objects.filter(
            Q(recipient=user) | Q(role_target=role) | Q(role_target='all'),
            is_read=False
        ).update(is_read=True)
        return Response({'status': 'all_read'})


# ---------------------------------------------------------------------------
# Core ViewSets
# ---------------------------------------------------------------------------

class VenueViewSet(viewsets.ModelViewSet):
    queryset           = Venue.objects.all()
    serializer_class   = VenueSerializer
    filter_backends    = [filters.OrderingFilter]
    ordering_fields    = ['id', 'name', 'capacity']
    ordering           = ['id']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsEventManagementOrAdmin()]

    def perform_update(self, serializer):
        old_instance = self.get_object()
        new_instance = serializer.save()
        
        # Log pricing changes
        if old_instance.price != new_instance.price:
            log_action(
                self.request.user,
                "Venue Price Adjustment",
                f"Venue '{new_instance.name}' price changed from {old_instance.price} to {new_instance.price}",
                self.request
            )
        else:
            log_action(
                self.request.user,
                "Venue Update",
                f"Venue '{new_instance.name}' updated.",
                self.request
            )

    def destroy(self, request, *args, **kwargs):
        from django.db.models.deletion import ProtectedError
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "This venue cannot be deleted because it has existing bookings associated with it. Please cancel or delete the bookings first."},
                status=status.HTTP_400_BAD_REQUEST
            )


class TechnicalServiceViewSet(viewsets.ModelViewSet):
    queryset = TechnicalService.objects.all()
    serializer_class = TechnicalServiceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] 

    def perform_update(self, serializer):
        old_instance = self.get_object()
        new_instance = serializer.save()
        if old_instance.price != new_instance.price:
            log_action(
                self.request.user,
                "Service Price Adjustment",
                f"Technical Service '{new_instance.name}' price changed from {old_instance.price} to {new_instance.price}",
                self.request
            )

class SupportServiceViewSet(viewsets.ModelViewSet):
    queryset = SupportService.objects.all()
    serializer_class = SupportServiceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_update(self, serializer):
        old_instance = self.get_object()
        new_instance = serializer.save()
        if old_instance.price != new_instance.price:
            log_action(
                self.request.user,
                "Service Price Adjustment",
                f"Support Service '{new_instance.name}' price changed from {old_instance.price} to {new_instance.price}",
                self.request
            )


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related('venue', 'user').prefetch_related(
        'technical_services', 'support_services'
    )
    serializer_class   = BookingSerializer
    permission_classes = [IsAuthenticatedOrPublicRead]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    filter_backends    = [filters.OrderingFilter]
    ordering_fields    = ['created_at', 'start_date', 'status']
    ordering           = ['-created_at']

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        booking = serializer.save()
        new_status = booking.status

        if old_status != new_status:
            self._trigger_email(booking, new_status)

    def _trigger_email(self, booking, status):
        valid_triggers = ['pending', 'management_approved', 'management_rejected', 'partial_paid', 'paid', 'approved', 'rejected', 'cancelled', 'completed']
        if status in valid_triggers:
            import threading
            def run_email():
                from conference.models import Booking
                from conference.utils import send_automated_email
                try:
                    fresh_booking = Booking.objects.select_related('venue').get(id=booking.id)
                    send_automated_email(fresh_booking, status)
                except Exception as e:
                    print(f"[BACKGROUND EMAIL ERROR] {e}")

            thread = threading.Thread(target=run_email)
            thread.start()

    def get_permissions(self):
        if self.action in ['create', 'track', 'public_cancel', 'public_edit']:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        is_public = self.request.query_params.get('public', 'false').lower() == 'true'
        if is_public:
            return qs.filter(status__in=['pending', 'partial_paid', 'paid', 'approved'])

        user = self.request.user
        if user.is_authenticated:
            role = get_role(user)
            if role in ('system_admin', 'leadership'):
                pass
            elif role in ('event_management', 'admin_finance'):
                # Event management and Finance only see bookings that have passed MoA management approval
                qs = qs.exclude(status='pending')
            elif role == 'organizer':
                scheduled_q = Q(status__in=['pending', 'management_approved', 'partial_paid', 'paid', 'approved'])
                qs = qs.filter(Q(user=user) | scheduled_q).distinct()
            elif role == 'ict_admin':
                qs = qs.exclude(status__in=['pending', 'rejected', 'management_approved']).filter(technical_services__isnull=False).distinct()
            elif role == 'catering_support':
                qs = qs.exclude(status__in=['pending', 'rejected', 'management_approved']).filter(support_services__isnull=False).distinct()
            else:
                qs = qs.none()
        else:
            return qs.none()

        status_filter = self.request.query_params.get('status')
        venue_id = self.request.query_params.get('venue')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if status_filter: qs = qs.filter(status=status_filter)
        if venue_id: qs = qs.filter(venue_id=venue_id)
        if date_from: qs = qs.filter(start_date__gte=date_from)
        if date_to: qs = qs.filter(end_date__lte=date_to)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        as_guest = self.request.data.get('as_guest', 'false').lower() == 'true'

        # ── Load live business rules ────────────────────────────────────────
        rules = SystemSettings.load()

        # ── Rule 1: Waiting Period ──────────────────────────────────────────
        # Staff / admin roles (event_management, leadership, system_admin,
        # admin_finance) are exempt from the advance-notice restriction so
        # they can create urgent internal bookings.
        start_date_str = serializer.validated_data.get('start_date')
        if start_date_str and rules.waiting_period_hours > 0:
            role = get_role(user) if (user and user.is_authenticated) else 'organizer'
            if role == 'organizer':
                start_dt = datetime.combine(start_date_str, time.min).replace(
                    tzinfo=timezone.get_current_timezone()
                )
                min_allowed = timezone.now() + timedelta(hours=rules.waiting_period_hours)
                if start_dt < min_allowed:
                    raise ValidationError(
                        f"Bookings must be made at least {rules.waiting_period_hours} hour(s) in advance. "
                        f"Please choose a date after {min_allowed.strftime('%Y-%m-%d %H:%M')}."
                    )

        # ── Rule 2: Buffer Time ─────────────────────────────────────────────
        venue = serializer.validated_data.get('venue')
        req_start_date = serializer.validated_data.get('start_date')
        req_end_date   = serializer.validated_data.get('end_date')
        req_start_time = serializer.validated_data.get('start_time')
        req_end_time   = serializer.validated_data.get('end_time')

        if venue and req_start_date and req_end_date and rules.buffer_time_minutes > 0:
            buf = timedelta(minutes=rules.buffer_time_minutes)
            # Expand the requested window by the buffer on both sides
            buf_start_date = req_start_date
            buf_end_date   = req_end_date

            neighbors = Booking.objects.filter(
                venue=venue,
                status__in=['pending', 'management_approved', 'partial_paid', 'paid', 'approved'],
                start_date__lte=buf_end_date,
                end_date__gte=buf_start_date,
            )

            for neighbor in neighbors:
                if req_start_time and req_end_time and neighbor.start_time and neighbor.end_time:
                    # Time-precise check: expand by buffer
                    req_start_dt  = datetime.combine(req_start_date, req_start_time)
                    req_end_dt    = datetime.combine(req_end_date,   req_end_time)
                    n_start_dt    = datetime.combine(neighbor.start_date, neighbor.start_time)
                    n_end_dt      = datetime.combine(neighbor.end_date,   neighbor.end_time)
                    if (req_start_dt - buf) < n_end_dt and req_end_dt > (n_start_dt - buf):
                        raise ValidationError(
                            f"This venue requires a {rules.buffer_time_minutes}-minute buffer between events. "
                            f"Another booking exists from {neighbor.start_date} {neighbor.start_time} "
                            f"to {neighbor.end_date} {neighbor.end_time}."
                        )
                else:
                    # Date-only check
                    if req_start_date <= neighbor.end_date and req_end_date >= neighbor.start_date:
                        raise ValidationError(
                            f"This venue requires at least a {rules.buffer_time_minutes}-minute buffer between events. "
                            f"Another booking already occupies an overlapping date range."
                        )

        if user and user.is_authenticated:
            role = get_role(user)
            if role not in ('organizer', 'event_management', 'leadership', 'system_admin', 'admin_finance'):
                raise PermissionDenied('You do not have permission to create bookings.')
            booking = serializer.save(user=None if as_guest else user)
        else:
            booking = serializer.save(user=None)

        self._trigger_email(booking, 'pending')

        # Notify leadership (MoA Management) instead of Event Management first
        Notification.objects.create(
            role_target='leadership',
            title='New Booking Awaiting Approval',
            message=f"Event '{booking.event_title}' requires MoA Management review.",
            type='info',
            link='#/manage-bookings'
        )

    def _handle_vip_clashes(self, booking):
        # Override handles clashes by rejecting existing active bookings
        clashes = Booking.objects.filter(
            venue=booking.venue,
            status__in=['pending', 'partial_paid', 'paid', 'approved'],
            start_date__lte=booking.end_date,
            end_date__gte=booking.start_date,
        ).exclude(pk=booking.pk)
        
        if booking.start_time and booking.end_time:
            clashes = clashes.filter(
                Q(start_time__isnull=True) | 
                Q(end_time__isnull=True) |
                Q(start_time__lt=booking.end_time, end_time__gt=booking.start_time)
            )
            
        for clash in clashes:
            clash.status = 'rejected'
            clash.rejection_reason = 'Automatically rejected. This slot was overridden by a high-priority VIP/State requirement.'
            clash.save()
            self._trigger_email(clash, 'rejected')

            # Notify the organizer
            if clash.user:
                Notification.objects.create(
                    recipient=clash.user,
                    title='Booking Overridden',
                    message=f"Your booking for '{clash.event_title}' was overridden by a VIP requirement.",
                    type='error',
                    link='#/my-bookings'
                )

    @action(detail=True, methods=['patch'], url_path='update_status', permission_classes=[IsEventManagementOrAdmin])
    def update_status(self, request, pk=None):
        booking = self.get_object()
        old_status = booking.status  # Capture before mutation for audit log
        serializer = BookingStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        rejection_reason = serializer.validated_data.get('rejection_reason', '')

        if booking.status == 'cancelled': 
            return Response({'error': 'Cannot modify a cancelled booking.'}, status=400)
        
        if new_status == 'rejected' and not rejection_reason: 
            return Response({'rejection_reason': 'A reason is required when rejecting.'}, status=400)

        # Block processing of pending bookings (they must be management_approved first)
        if booking.status == 'pending' and new_status in ('partial_paid', 'paid', 'approved'):
            return Response({'error': 'This booking must be approved by MoA Management before it can be processed.'}, status=400)

        # Trigger destruction of other events if VIP Override is triggered
        if new_status == 'approved':
            self._handle_vip_clashes(booking)

        booking.status = new_status
        if new_status == 'rejected': 
            booking.rejection_reason = rejection_reason
        
        booking.save()
        
        # Notify the organizer
        if booking.user:
            Notification.objects.create(
                recipient=booking.user,
                title=f'Booking {new_status.title()}',
                message=f"Status for '{booking.event_title}' updated to {new_status}.",
                type='success' if new_status in ('paid', 'approved') else 'warning',
                link='#/my-bookings'
            )

        if new_status in ('partial_paid', 'paid'):
            Notification.objects.create(
                role_target='ict_admin',
                title=f'Booking Payment Confirmed',
                message=f"Payment for '{booking.event_title}' has been confirmed.",
                type='success',
                link='#/manage-bookings'
            )
            Notification.objects.create(
                role_target='system_admin',
                title=f'Booking Payment Confirmed',
                message=f"Payment for '{booking.event_title}' has been confirmed.",
                type='success',
                link='#/manage-bookings'
            )
            Notification.objects.create(
                role_target='event_management',
                title=f'Booking Payment Confirmed',
                message=f"Payment for '{booking.event_title}' has been confirmed.",
                type='success',
                link='#/manage-bookings'
            )

        # Audit Log
        action_name = "Booking Override" if new_status == 'approved' else "Booking Status Change"
        log_action(
            request.user,
            action_name,
            f"Booking MOA-BKG-{booking.id} ({booking.event_title}) status changed from {old_status} to {new_status}.",
            request
        )

        self._trigger_email(booking, new_status)
        return Response(BookingSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['patch'], url_path='approve_management', permission_classes=[IsLeadership])
    def approve_management(self, request, pk=None):
        booking = self.get_object()
        if booking.status != 'pending':
            return Response({'error': 'Only pending bookings can be approved by MoA Management.'}, status=400)

        old_status = booking.status
        booking.status = 'management_approved'
        booking.management_approved_by = request.user
        booking.management_approved_at = timezone.now()
        booking.save()

        # Send notification to event_management role
        Notification.objects.create(
            role_target='event_management',
            title='Booking Approved by MoA Management',
            message=f"Booking '{booking.event_title}' has been approved by MoA Management and is ready for payment processing.",
            type='success',
            link='#/manage-bookings'
        )


        # Notify organizer
        if booking.user:
            Notification.objects.create(
                recipient=booking.user,
                title='Booking Approved by MoA Management',
                message=f"Your booking for '{booking.event_title}' was approved by MoA Management. It is now with the Event Management team for processing.",
                type='success',
                link='#/my-bookings'
            )

        # Audit Log
        log_action(
            request.user,
            "Booking Approved by MoA Management",
            f"Booking MOA-BKG-{booking.id} ({booking.event_title}) was approved by MoA Management.",
            request
        )

        self._trigger_email(booking, 'management_approved')
        return Response(BookingSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['patch'], url_path='reject_management', permission_classes=[IsLeadership])
    def reject_management(self, request, pk=None):
        booking = self.get_object()
        if booking.status != 'pending':
            return Response({'error': 'Only pending bookings can be rejected by MoA Management.'}, status=400)

        rejection_reason = request.data.get('rejection_reason', '')
        if not rejection_reason:
            return Response({'rejection_reason': 'A reason is required when rejecting.'}, status=400)

        old_status = booking.status
        booking.status = 'rejected'
        booking.rejection_reason = rejection_reason
        booking.save()

        # Notify organizer
        if booking.user:
            Notification.objects.create(
                recipient=booking.user,
                title='Booking Rejected by MoA Management',
                message=f"Your booking for '{booking.event_title}' was rejected by MoA Management. Reason: {rejection_reason}",
                type='error',
                link='#/my-bookings'
            )

        # Audit Log
        log_action(
            request.user,
            "Booking Rejected by MoA Management",
            f"Booking MOA-BKG-{booking.id} ({booking.event_title}) was rejected by MoA Management. Reason: {rejection_reason}",
            request
        )

        self._trigger_email(booking, 'management_rejected')
        return Response(BookingSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['patch'], url_path='cancel', permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        role = get_role(request.user)

        if role == 'organizer' and booking.user != request.user:
            raise PermissionDenied('You can only cancel your own bookings.')

        if booking.status not in ('pending', 'management_approved', 'partial_paid', 'paid', 'approved'):
            return Response({'error': 'Only active bookings can be cancelled.'}, status=400)

        # ── Rule 3: Cancellation Policy (only enforced for organizers) ──────
        if role == 'organizer':
            rules = SystemSettings.load()
            now = timezone.now()
            event_start = datetime.combine(booking.start_date, booking.start_time or time.min)
            event_start = timezone.make_aware(event_start) if timezone.is_naive(event_start) else event_start
            hours_until_event = (event_start - now).total_seconds() / 3600

            if rules.cancellation_policy == 'strict' and hours_until_event < 168:  # 7 days
                return Response(
                    {'error': 'Strict cancellation policy: Cancellations are not allowed within 7 days of the event.'},
                    status=400
                )
            elif rules.cancellation_policy == 'moderate' and hours_until_event < 48:
                return Response(
                    {'error': 'Moderate cancellation policy: Cancellations are not allowed within 48 hours of the event.'},
                    status=400
                )
            # 'flexible' policy: cancellation allowed up to 24 hours before
            elif rules.cancellation_policy == 'flexible' and hours_until_event < 24:
                return Response(
                    {'error': 'Flexible cancellation policy: Cancellations are not allowed within 24 hours of the event.'},
                    status=400
                )

        booking.status = 'cancelled'
        booking.save()
        return Response(BookingSerializer(booking, context={'request': request}).data)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='track')
    def track(self, request):
        ref_id = request.query_params.get('ref_id', '')
        if str(ref_id).startswith('MOA-BKG-'):
            ref_id = str(ref_id).replace('MOA-BKG-', '')
        try:
            booking = Booking.objects.get(id=ref_id)
            return Response(BookingSerializer(booking, context={'request': request}).data)
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found.'}, status=404)

    @action(detail=False, methods=['patch'], permission_classes=[AllowAny], url_path='public_cancel')
    def public_cancel(self, request):
        ref_id = request.data.get('ref_id', '')
        if str(ref_id).startswith('MOA-BKG-'):
            ref_id = str(ref_id).replace('MOA-BKG-', '')
        try:
            booking = Booking.objects.get(id=ref_id)
            if booking.status not in ('pending', 'management_approved', 'partial_paid', 'paid', 'approved'):
                return Response({'error': 'Only active bookings can be cancelled.'}, status=400)

            # ── Rule 3: Cancellation Policy ─────────────────────────────────
            rules = SystemSettings.load()
            now = timezone.now()
            event_start = datetime.combine(booking.start_date, booking.start_time or time.min)
            event_start = timezone.make_aware(event_start) if timezone.is_naive(event_start) else event_start
            hours_until_event = (event_start - now).total_seconds() / 3600

            if rules.cancellation_policy == 'strict' and hours_until_event < 168:
                return Response(
                    {'error': 'Strict cancellation policy: Cancellations are not allowed within 7 days of the event.'},
                    status=400
                )
            elif rules.cancellation_policy == 'moderate' and hours_until_event < 48:
                return Response(
                    {'error': 'Moderate cancellation policy: Cancellations are not allowed within 48 hours of the event.'},
                    status=400
                )
            elif rules.cancellation_policy == 'flexible' and hours_until_event < 24:
                return Response(
                    {'error': 'Flexible cancellation policy: Cancellations are not allowed within 24 hours of the event.'},
                    status=400
                )

            booking.status = 'cancelled'
            booking.save()
            return Response(BookingSerializer(booking, context={'request': request}).data)
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found.'}, status=404)

    @action(detail=False, methods=['patch'], permission_classes=[AllowAny], url_path='public_edit')
    def public_edit(self, request):
        ref_id = request.data.get('ref_id', '')
        if str(ref_id).startswith('MOA-BKG-'):
            ref_id = str(ref_id).replace('MOA-BKG-', '')
        try:
            booking = Booking.objects.get(id=ref_id)
            if booking.status in ('cancelled', 'completed', 'rejected'):
                return Response({'error': 'Cannot edit this booking status.'}, status=400)
            
            booking.event_title = request.data.get('event_title', booking.event_title)
            booking.event_description = request.data.get('event_description', booking.event_description)
            booking.organizer_phone = request.data.get('organizer_phone', booking.organizer_phone)
            try:
                if 'participant_count' in request.data:
                    booking.participant_count = int(request.data['participant_count'])
            except ValueError: pass
                
            booking.save()
            return Response(BookingSerializer(booking, context={'request': request}).data)
        except (Booking.DoesNotExist, ValueError):
            return Response({'error': 'Booking not found.'}, status=404)

    @action(detail=True, methods=['patch'], url_path='acknowledge_ict', permission_classes=[IsICTOrAdmin])
    def acknowledge_ict(self, request, pk=None):
        booking = self.get_object()
        booking.ict_acknowledged = request.data.get('ict_acknowledged', True)
        if booking.ict_acknowledged:
            booking.ict_rejected = False
            booking.ict_rejection_reason = ""
        
        # Recalculate price
        booking.total_price = booking.get_adjusted_total_price()
        booking.save()
        return Response(BookingSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['patch'], url_path='set_unavailable_services', permission_classes=[IsICTOrAdmin])
    def set_unavailable_services(self, request, pk=None):
        booking = self.get_object()
        services_ids = request.data.get('unavailable_technical_services', [])
        services = TechnicalService.objects.filter(id__in=services_ids)
        booking.unavailable_technical_services.set(services)
        
        # Recalculate price based on unavailability
        booking.total_price = booking.get_adjusted_total_price()
        booking.save()
        
        return Response(BookingSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['patch'], url_path='set_unavailable_support_services', permission_classes=[IsCateringOrAdmin])
    def set_unavailable_support_services(self, request, pk=None):
        booking = self.get_object()
        services_ids = request.data.get('unavailable_support_services', [])
        services = SupportService.objects.filter(id__in=services_ids)
        booking.unavailable_support_services.set(services)
        
        # Recalculate price based on unavailability
        booking.total_price = booking.get_adjusted_total_price()
        booking.save()
        
        return Response(BookingSerializer(booking, context={'request': request}).data)

    @action(detail=True, methods=['patch'], url_path='acknowledge_catering', permission_classes=[IsCateringOrAdmin])
    def acknowledge_catering(self, request, pk=None):
        booking = self.get_object()
        booking.catering_acknowledged = request.data.get('catering_acknowledged', True)
        if booking.catering_acknowledged:
            booking.catering_rejected = False
            booking.catering_rejection_reason = ""
            
        # Recalculate price
        booking.total_price = booking.get_adjusted_total_price()
        booking.save()
        return Response(BookingSerializer(booking, context={'request': request}).data)

class SystemUserViewSet(viewsets.ModelViewSet):
    queryset           = SystemUser.objects.select_related('user').all()
    serializer_class   = SystemUserSerializer
    permission_classes = [IsSystemAdmin]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['name', 'email', 'role']
    ordering_fields    = ['name', 'email', 'role', 'created_at']
    ordering           = ['created_at']

    def get_queryset(self):
        qs   = super().get_queryset()
        role = self.request.query_params.get('role')
        if role: qs = qs.filter(role=role)
        return qs

    def perform_create(self, serializer):
        user = serializer.save()
        log_action(
            self.request.user,
            "User Created",
            f"New user account created: {user.name} ({user.email}) with role {user.role}",
            self.request
        )

    def perform_update(self, serializer):
        user = serializer.save()
        log_action(
            self.request.user,
            "User Updated",
            f"User account updated: {user.name} ({user.email})",
            self.request
        )

    def destroy(self, request, *args, **kwargs):
        system_user  = self.get_object()
        django_user  = system_user.user

        if django_user and django_user == request.user:
            return Response({'error': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        system_user.delete()
        if django_user: django_user.delete()

        log_action(
            request.user,
            "User Deleted",
            f"User account deleted: {system_user.name} ({system_user.email})",
            request
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        system_user = self.get_object()
        new_password = request.data.get('password', '')
        if len(new_password) < 8: return Response({'error': 'Password must be at least 8 characters.'}, status=400)
        if not system_user.user: return Response({'error': 'This profile has no linked login account.'}, status=400)
        system_user.user.set_password(new_password)
        system_user.user.save()
        Token.objects.filter(user=system_user.user).delete()

        log_action(
            request.user,
            "Password Reset",
            f"Administrative password reset for user: {system_user.name} ({system_user.email})",
            request
        )
        return Response({'detail': f'Password for {system_user.name} has been reset.'})

    @action(detail=True, methods=['patch'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        system_user = self.get_object()
        if not system_user.user: return Response({'error': 'No linked login account.'}, status=400)
        if system_user.user == request.user: return Response({'error': 'You cannot deactivate your own account.'}, status=400)
        system_user.user.is_active = not system_user.user.is_active
        system_user.user.save()
        state = 'activated' if system_user.user.is_active else 'deactivated'

        log_action(
            request.user,
            "User Status Toggle",
            f"User account {state}: {system_user.name} ({system_user.email})",
            request
        )
        return Response({'detail': f'Account {state}.', 'is_active': system_user.user.is_active})

class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsSystemAdmin]

from rest_framework.pagination import PageNumberPagination

class AuditLogPagination(PageNumberPagination):
    page_size = 15

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user', 'user__system_profile').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsEventManagementOrAdmin]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['action', 'details', 'user__username', 'user__system_profile__name']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    pagination_class = AuditLogPagination

    def get_queryset(self):
        qs = super().get_queryset()
        date_from = self.request.query_params.get('date_from')
        date_to   = self.request.query_params.get('date_to')
        category  = self.request.query_params.get('category')

        # ── Date range ──────────────────────────────────────────────────────
        # Ethiopia is UTC+3. Timestamps are stored in UTC.
        # "2026-05-03" local = 2026-05-02 21:00 UTC (start) → 2026-05-03 20:59:59 UTC (end)
        from datetime import datetime, timedelta
        ETH_OFFSET = timedelta(hours=3)

        if date_from:
            try:
                dt = datetime.strptime(date_from, '%Y-%m-%d')
                # Start of that Ethiopian day in UTC
                qs = qs.filter(timestamp__gte=dt - ETH_OFFSET)
            except ValueError:
                pass
        if date_to:
            try:
                dt = datetime.strptime(date_to, '%Y-%m-%d')
                # End of that Ethiopian day in UTC (23:59:59 local = 20:59:59 UTC)
                qs = qs.filter(timestamp__lte=dt - ETH_OFFSET + timedelta(hours=23, minutes=59, seconds=59))
            except ValueError:
                pass

        # ── Category ────────────────────────────────────────────────────────
        if category and category != 'all':
            from django.db.models import Q
            if category == 'pricing':
                qs = qs.filter(Q(action__icontains='Price Adjustment'))
            elif category == 'override':
                qs = qs.filter(Q(action__icontains='Override'))
            elif category == 'booking':
                qs = qs.filter(Q(action__icontains='Booking'))
            elif category == 'user':
                qs = qs.filter(
                    Q(action__icontains='User') |
                    Q(action__icontains='Password')
                )
            elif category == 'system':
                qs = qs.filter(
                    Q(action__icontains='Venue Update') |
                    Q(action__icontains='Service') |
                    Q(action__icontains='System Settings')
                )

        return qs

class SystemSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        role = get_role(request.user)
        if role not in ['system_admin', 'event_management']:
            raise PermissionDenied("You do not have permission to modify system settings.")
        
        settings = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_action(request.user, "Updated System Settings", "Modified global business rules.", request)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)