from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from conference.models import Booking
from conference.utils import send_automated_email

class Command(BaseCommand):
    help = 'Processes 24h reminders and 48h payment expirations'

    def handle(self, *args, **options):
        now = timezone.now()

        # 1. 24h EVENT REMINDER (Matches your PHP code)
        upcoming_limit = now + timedelta(hours=24)
        reminders = Booking.objects.filter(
            status='confirmed',
            reminder_sent=False,
            start_date__lte=upcoming_limit.date()
        )
        for b in reminders:
            if send_automated_email(b, 'reminder_24h'):
                b.reminder_sent = True
                b.save()
                self.stdout.write(f"Sent 24h reminder for {b.event_title}")

        # 2. 48h PAYMENT EXPIRATION
        # If status is approved (pending payment) and older than 48h -> Cancel
        expire_limit = now - timedelta(hours=48)
        expired = Booking.objects.filter(status='approved', created_at__lte=expire_limit)
        for b in expired:
            b.status = 'cancelled'
            b.admin_message = "Automatically cancelled due to non-payment within 48 hours."
            b.save()
            send_automated_email(b, 'reminder_48h_pay')
            self.stdout.write(f"Cancelled expired booking: {b.id}")