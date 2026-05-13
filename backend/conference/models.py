"""
Models for the Conference Management System.
"""
from django.db import models
from django.contrib.auth.models import User

# ---------------------------------------------------------------------------
# System User (for User Management)
# ---------------------------------------------------------------------------

class UserRoleChoices(models.TextChoices):
    ORGANIZER = 'organizer', 'Event Organizer'
    EVENT_MANAGEMENT = 'event_management', 'Event Management'
    ICT_ADMIN = 'ict_admin', 'ICT / Sys Admin'
    CATERING_SUPPORT = 'catering_support', 'Catering & Support'
    ADMIN_FINANCE = 'admin_finance', 'Admin & Finance'
    LEADERSHIP = 'leadership', 'Ministry Leadership'
    SYSTEM_ADMIN = 'system_admin', 'System Administrator'


class SystemUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='system_profile', null=True, blank=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=30, choices=UserRoleChoices.choices, default=UserRoleChoices.ORGANIZER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


# ---------------------------------------------------------------------------
# Venue
# ---------------------------------------------------------------------------

class VenueType(models.TextChoices):
    CINEMA = 'Cinema', 'Cinema'
    THEATRE_AUDITORIUM = 'Theatre/Auditorium', 'Theatre / Auditorium'
    MEETING = 'Meeting', 'Meeting'
    BOARDROOM = 'Boardroom', 'Boardroom'
    LOUNGE = 'Lounge', 'Lounge'
    REFRESHMENT = 'Refreshment', 'Refreshment'


class Venue(models.Model):
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=30, choices=VenueType.choices)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    best_for = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    image = models.ImageField(upload_to='venue_images/', null=True, blank=True)
    status = models.CharField(
        max_length=20, 
        choices=[('vacant', 'Vacant'), ('out_of_order', 'Out of Order')], 
        default='vacant'
    )
    
    cleaning_start = models.TimeField(default="06:00")
    cleaning_end = models.TimeField(default="08:00")
    
    included_services = models.JSONField(default=list, blank=True, null=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name} ({self.type})"


# ---------------------------------------------------------------------------
# Technical & Support Services
# ---------------------------------------------------------------------------

class TechnicalService(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name


class SupportService(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Booking
# ---------------------------------------------------------------------------

class BookingStatus(models.TextChoices):
    PENDING = 'pending', 'Pending / Awaiting Action'
    PARTIAL_PAID = 'partial_paid', '1st Round Paid'
    PAID = 'paid', 'Fully Paid'
    APPROVED = 'approved', 'VIP Approved'
    REJECTED = 'rejected', 'Rejected (e.g. VIP Override)'
    CANCELLED = 'cancelled', 'Cancelled by User/Admin'
    COMPLETED = 'completed', 'Completed'

class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='user_bookings')
    venue = models.ForeignKey(Venue, on_delete=models.PROTECT, related_name='bookings')
    event_title = models.CharField(max_length=200)
    event_description = models.TextField(blank=True, default='')
    organizer_name = models.CharField(max_length=200)
    organizer_email = models.EmailField()
    organizer_phone = models.CharField(max_length=30, blank=True, default='')
    organization = models.CharField(max_length=255, blank=True, null=True)
    
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    daily_schedules = models.JSONField(default=list, blank=True)
    participant_count = models.PositiveIntegerField()
    
    status = models.CharField(
        max_length=20,
        choices=BookingStatus.choices,
        default=BookingStatus.PENDING,
    )
    
    technical_services = models.ManyToManyField(
        TechnicalService,
        blank=True,
        related_name='bookings',
    )
    support_services = models.ManyToManyField(
        SupportService,
        blank=True,
        related_name='bookings',
    )
    unavailable_technical_services = models.ManyToManyField(
        TechnicalService,
        blank=True,
        related_name='unavailable_for_bookings',
    )
    unavailable_support_services = models.ManyToManyField(
        SupportService,
        blank=True,
        related_name='unavailable_support_for_bookings',
    )
    
    letter_attachment = models.FileField(
        upload_to='booking_letters/',
        null=True,
        blank=True,
    )
    
    ict_acknowledged = models.BooleanField(default=False)
    ict_rejected = models.BooleanField(default=False)
    ict_rejection_reason = models.TextField(blank=True, default='')

    catering_acknowledged = models.BooleanField(default=False)
    catering_rejected = models.BooleanField(default=False)
    catering_rejection_reason = models.TextField(blank=True, default='')

    rejection_reason = models.TextField(blank=True, default='')
    
    venue_daily_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    service_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Automated Notification Tracking
    reminder_sent = models.BooleanField(default=False)
    expiration_reminder_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def get_adjusted_total_price(self):
        """Calculates the final price after deducting unavailable services."""
        deduction = 0
        
        # Deduct unavailable technical services if ICT has acknowledged/reviewed
        if self.ict_acknowledged:
            for service in self.unavailable_technical_services.all():
                deduction += service.price or 0
                
        # Deduct unavailable support services if Catering has acknowledged/reviewed
        if self.catering_acknowledged:
            for service in self.unavailable_support_services.all():
                deduction += service.price or 0
                
        return max(0, self.total_price - deduction)

    def save(self, *args, **kwargs):
        # We don't automatically recalculate the BASE total_price here to avoid 
        # destroying the original quote, but we ensure the field reflects the reality 
        # if needed. Actually, let's keep total_price as the "original quote" 
        # and use a property for the display.
        # But wait, the user wants the "Dashboard" (which likely sums total_price) to update.
        # So we SHOULD update a field.
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.event_title} @ {self.venue.name} ({self.status})"


# ---------------------------------------------------------------------------
# Task & Maintenance Tables
# ---------------------------------------------------------------------------

class TaskAllocation(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='allocations')
    date = models.DateField()
    staff = models.ForeignKey(SystemUser, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('booking', 'date')

class MaintenanceUpdate(models.Model):
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='maintenance_updates')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        unique_together = ('venue', 'date')

# ---------------------------------------------------------------------------
# Email Templates
# ---------------------------------------------------------------------------

class EmailTemplate(models.Model):
    TRIGGER_CHOICES = [
        ('pending', 'Booking Received (Pending)'),
        ('partial_paid', '1st Round Payment Confirmed'),
        ('paid', 'Full Payment Confirmed'),
        ('approved', 'VIP Override Approved'),
        ('rejected', 'Booking Rejected / Overridden'),
        ('cancelled', 'Booking Cancelled'),
        ('completed', 'Event Completed'),
        ('reminder_24h', '24h Event Reminder'),
        ('reminder_48h_pay', '48h Payment Expiration'),
        ('last_day', 'Meeting Conclusion'),
    ]
    trigger = models.CharField(max_length=50, choices=TRIGGER_CHOICES, unique=True)
    subject = models.CharField(max_length=255)
    body = models.TextField()

    def __str__(self):
        return self.get_trigger_display()


# ---------------------------------------------------------------------------
# Audit Logging
# ---------------------------------------------------------------------------

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=255)
    details = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"

    def __str__(self):
        user_name = self.user.username if self.user else "System"
        return f"{self.timestamp} - {user_name} - {self.action}"

    def delete(self, *args, **kwargs):
        # Prevent deletion of audit logs for compliance
        pass


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    role_target = models.CharField(max_length=50, null=True, blank=True, help_text="Target specific roles (e.g. event_management)")
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=[('info', 'Info'), ('success', 'Success'), ('warning', 'Warning'), ('error', 'Error')], default='info')
    link = models.CharField(max_length=255, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.recipient.username if self.recipient else 'All ' + str(self.role_target)}"


# ---------------------------------------------------------------------------
# System Settings (Business Rules)
# ---------------------------------------------------------------------------

class SystemSettings(models.Model):
    # Singleton pattern
    waiting_period_hours = models.IntegerField(default=48, help_text="Minimum hours required to book in advance.")
    buffer_time_minutes = models.IntegerField(default=60, help_text="Buffer time between events in the same venue.")
    cancellation_policy = models.CharField(
        max_length=20,
        choices=[
            ('flexible', 'Flexible'),
            ('moderate', 'Moderate'),
            ('strict', 'Strict')
        ],
        default='strict',
        help_text="Policy for event cancellations."
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"

    def __str__(self):
        return "Global System Settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super(SystemSettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj