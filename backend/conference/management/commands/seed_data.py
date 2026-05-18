from django.core.management.base import BaseCommand
from conference.models import TechnicalService, SupportService, EmailTemplate

class Command(BaseCommand):
    help = 'Seeds technical services, support services, and official email templates'

    def handle(self, *args, **options):
        # 1. SEED TECHNICAL SERVICES
        self.stdout.write('Seeding technical services...')
        ts_prices = {
            'Internet Access': 100.00, 'HDMI Connection': 50.00, 'Wireless Sharing': 75.00,
            'LED Screen / Display': 500.00, 'Microphone': 150.00, 'Sound System': 300.00,
            'Video Conferencing': 400.00, 'Photography': 1000.00, 'Meeting Recording': 200.00,
            'Livestreaming': 800.00, 'Interpretation System': 1500.00, 'Voting System': 600.00
        }
        for name, price in ts_prices.items():
            TechnicalService.objects.update_or_create(
                name=name, defaults={'price': price}
            )

        # 2. SEED SUPPORT SERVICES
        self.stdout.write('Seeding support services...')
        ss_names = ['Stationery', 'Coffee Break', 'Lunch Catering', 'Water Service', 'Security Support']
        for name in ss_names:
            SupportService.objects.update_or_create(name=name, defaults={'price': 150.00})

        # 3. SEED ALL NEW EMAIL TEMPLATES
        self.stdout.write('Seeding professional email templates...')
        templates = [
            {'trigger': 'pending', 'subject': 'Request Received: {event}', 'body': 'Dear {name},\n\nWe have received your booking request for {event} at {venue} on {date}. Your reference ID is {ref}.\n\nYour request is currently pending administrative review. You will be notified once the status is updated.'},
            {'trigger': 'partial_paid', 'subject': '1st Round Payment Confirmed: {event}', 'body': 'Dear {name},\n\nWe have successfully received your 1st round payment for {event} (Ref: {ref}). Your booking is now conditionally secured.\n\nPlease ensure the remaining balance is settled prior to the event.'},
            {'trigger': 'paid', 'subject': 'Booking Confirmed (Fully Paid): {event}', 'body': 'Dear {name},\n\nThank you for your full payment. Your booking for {event} at {venue} on {date} is now officially confirmed. We look forward to hosting you.'},
            {'trigger': 'approved', 'subject': 'VIP Booking Approved: {event}', 'body': 'Dear {name},\n\nYour VIP priority booking request for {event} at {venue} on {date} has been approved. This time slot is securely reserved for your event.'},
            {'trigger': 'rejected', 'subject': 'Booking Request Rejected: {event}', 'body': 'Dear {name},\n\nWe regret to inform you that your booking request for {event} could not be accommodated. This time slot may have been overridden by a high-priority state event or there is a scheduling conflict.\n\nReason Provided: {reason}\n\nWe apologize for the inconvenience.'},
            {'trigger': 'cancelled', 'subject': 'Booking Cancelled: {event}', 'body': 'Dear {name},\n\nYour booking for {event} (Ref: {ref}) has been successfully cancelled as per the latest system update.'},
            {'trigger': 'completed', 'subject': 'Thank You: {event} Concluded', 'body': 'Dear {name},\n\nYour event "{event}" at {venue} has successfully concluded. Thank you for choosing the Ministry of Agriculture Conference Center.\n\nWe hope the facility and services met your highest expectations. We look forward to hosting you again.'},
            {'trigger': 'reminder_24h', 'subject': 'Reminder: Your Event Starts Tomorrow!', 'body': 'Dear {name},\n\nThis is a friendly reminder that your event "{event}" at {venue} is scheduled to begin tomorrow. Please ensure all preparations are in place.'},
            {'trigger': 'reminder_48h_pay', 'subject': 'Action Required: Pending Payment for {event}', 'body': 'Dear {name},\n\nYour booking for {event} (Ref: {ref}) is currently pending payment. Please note that unconfirmed bookings may be automatically released or overridden. Kindly complete your payment to secure the venue.'},
            {'trigger': 'last_day', 'subject': 'Event Conclusion: {event}', 'body': 'Dear {name},\n\nToday marks the conclusion of your scheduled event "{event}". We kindly remind you to ensure all personal belongings and external equipment are cleared from the venue. Thank you.'},
        ]

        for t in templates:
            EmailTemplate.objects.update_or_create(
                trigger=t['trigger'],
                defaults={'subject': t['subject'], 'body': t['body']}
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded Technical Services, Support Services, and Email Templates!'))