from django.core.management.base import BaseCommand
from conference.models import Booking
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Cancels any "Awaiting Payment" or "Pending" bookings that are older than 48 hours.'

    def handle(self, *args, **options):
        # Calculate exactly 48 hours ago from RIGHT NOW
        cutoff_time = timezone.now() - timedelta(hours=48)
        
        # Find all bookings that are unpaid and too old
        expired_bookings = Booking.objects.filter(
            status__in=['reserved', 'approved'], 
            created_at__lt=cutoff_time
        )
        
        count = expired_bookings.count()
        
        if count > 0:
            # Change their status and add a reason so the user knows what happened
            expired_bookings.update(
                status='cancelled', 
                rejection_reason='Automatically cancelled: Payment was not received within the 48-hour window.'
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully cancelled {count} unpaid bookings.'))
        else:
            self.stdout.write(self.style.SUCCESS('No expired unpaid bookings found. The calendar is clean!'))