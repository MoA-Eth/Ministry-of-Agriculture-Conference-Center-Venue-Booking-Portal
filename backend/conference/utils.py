from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from .models import EmailTemplate


def send_automated_email(booking, trigger_type):
    """
    Sends a professional HTML email based on stored templates.
    Triggers: pending, partial_paid, paid, approved, rejected, cancelled, completed
    """
    try:
        # 1. Get the template from the database
        # CRITICAL: trigger_type must exist in EmailTemplate table!
        template = EmailTemplate.objects.get(trigger=trigger_type)

        # 2. Map placeholders to actual data
        placeholders = {
            '{name}': booking.organizer_name,
            '{event}': booking.event_title,
            '{venue}': booking.venue.name,
            '{date}': booking.start_date.strftime('%B %d, %Y'),
            '{ref}': f"MOA-BKG-{booking.id}",
            '{status}': booking.get_status_display(),
            '{reason}': booking.rejection_reason or 'No specific reason provided.',
        }

        # 3. Swap placeholders in subject and body
        subject = template.subject
        body_text = template.body
        for key, value in placeholders.items():
            subject = subject.replace(key, str(value))
            body_text = body_text.replace(key, str(value))

        # 4. Build a professional HTML version 
        body_html = _build_html_email(subject, body_text, booking, trigger_type)

        # 5. Send using EmailMultiAlternatives (plain + HTML)
        msg = EmailMultiAlternatives(
            subject=subject,
            body=body_text,  # Plain-text fallback
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[booking.organizer_email],
            reply_to=[settings.EMAIL_HOST_USER],
        )
        msg.attach_alternative(body_html, "text/html")
        msg.send(fail_silently=False)

        print(f"[EMAIL OK] '{trigger_type}' sent to {booking.organizer_email}")
        return True

    except EmailTemplate.DoesNotExist:
        # This is where your error is happening!
        print(f"[EMAIL ERROR] No database template found for trigger: '{trigger_type}'")
        return False
    except Exception as e:
        print(f"[SMTP ERROR] {e}")
        return False


def _build_html_email(subject, body_text, booking, trigger_type):
    """
    Wraps the body in a branded HTML template.
    """

    # Updated Color Palette for new statuses
    colors = {
        'pending': '#f59e0b',               # Amber
        'management_approved': '#0d9488',   # Teal
        'management_rejected': '#b45309',   # Amber-Red (Dark Amber)
        'partial_paid': '#3b82f6',          # Blue
        'paid': '#10b981',                  # Emerald
        'approved': '#8b5cf6',              # Purple
        'rejected': '#ef4444',              # Red
        'cancelled': '#64748b',             # Slate
        'completed': '#1e293b',             # Dark Slate
        'event_mgmt_notification': '#0d9488', # Teal
    }
    accent = colors.get(trigger_type, '#268053')

    # Updated Status Labels
    labels = {
        'pending': 'Request Received',
        'management_approved': 'Ministry Approved',
        'management_rejected': 'Ministry Rejected',
        'partial_paid': 'First Payment Confirmed',
        'paid': 'Fully Confirmed',
        'approved': 'VIP Priority Approved',
        'rejected': 'Booking Not Possible',
        'cancelled': 'Booking Cancelled',
        'completed': 'Event Concluded',
        'event_mgmt_notification': 'Ministry Approved',
    }
    status_label = labels.get(trigger_type, trigger_type.replace('_', ' ').title())

    # Convert line breaks to HTML
    body_paragraphs = ''.join(
        f'<p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#374151;">{line}</p>'
        for line in body_text.split('\n') if line.strip()
    )

    return f"""
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{subject}</title>
    <style>
        @media screen and (max-width: 600px) {{
            .email-container {{ width: 100% !important; }}
            .mobile-padding {{ padding: 25px 20px !important; }}
            .stat-cell {{ display: block !important; width: 100% !important; text-align: left !important; padding-bottom: 15px; }}
        }}
    </style>
</head>
<body style="margin: 0; padding: 0 !important; background-color: #f4f7f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <center style="width: 100%; background-color: #f4f7f5; padding: 40px 0;">
        <!--[if mso | IE]>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center">
        <tr><td>
        <![endif]-->
        
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.04);" class="email-container">
            
            <!-- Branded Header -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="background-color: #1b4332; padding: 40px; text-align: center;" class="mobile-padding">
                        <div style="font-size: 10px; font-weight: 800; color: #8cbaa2; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 12px;">Ministry of Agriculture &bull; Ethiopia</div>
                        <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">MoA Conference Center</h1>
                    </td>
                </tr>
            </table>

            <!-- Status & Intro -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center;" class="mobile-padding">
                        <div style="display: inline-block; background-color: {accent}15; color: {accent}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 10px 24px; border-radius: 100px; margin-bottom: 30px;">
                            {status_label}
                        </div>
                        <div style="font-size: 16px; line-height: 1.6; color: #374151; text-align: left;">
                            {body_paragraphs}
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Booking Summary Card -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="padding: 20px 40px 40px 40px;" class="mobile-padding">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 20px; border: 1px solid #edf2f7;">
                            <tr>
                                <td style="padding: 30px;">
                                    <h3 style="margin: 0 0 20px 0; font-size: 14px; font-weight: 800; color: #1a202c; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid {accent}30; display: inline-block; padding-bottom: 4px;">Booking Summary</h3>
                                    
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7;">
                                                <div style="font-size: 12px; color: #718096; margin-bottom: 4px; font-weight: 600;">Reference Number</div>
                                                <div style="font-size: 14px; color: #1a202c; font-weight: 800;">MOA-BKG-{booking.id}</div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0; border-bottom: 1px solid #edf2f7;">
                                                <div style="font-size: 12px; color: #718096; margin-bottom: 4px; font-weight: 600;">Event Name</div>
                                                <div style="font-size: 14px; color: #1a202c; font-weight: 800;">{booking.event_title}</div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 12px 0;">
                                                <div style="font-size: 12px; color: #718096; margin-bottom: 4px; font-weight: 600;">Venue</div>
                                                <div style="font-size: 14px; color: #1a202c; font-weight: 800;">{booking.venue.name}</div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>

            <!-- Next Steps -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="padding: 0 40px 40px 40px; text-align: left;" class="mobile-padding">
                        <div style="font-size: 13px; color: #718096; line-height: 1.6; border-left: 4px solid #cbd5e0; padding-left: 20px;">
                            <strong>Need help?</strong> If you have questions regarding your booking or need to provide additional documents, please contact the ICT/Event Management team at the Ministry of Agriculture.
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Footer -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                    <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #edf2f7;">
                        <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 600;">Ministry of Agriculture &bull; Addis Ababa, Ethiopia</p>
                        <p style="margin: 6px 0 0 0; font-size: 11px; color: #cbd5e1;">&copy; 2026 MoA Conference Management System</p>
                    </td>
                </tr>
            </table>

        </div>

        <!--[if mso | IE]>
        </td></tr>
        </table>
        <![endif]-->
    </center>
</body>
</html>
"""


def log_action(user, action, details, request=None):
    """
    Records an administrative action in the AuditLog.
    """
    from .models import AuditLog
    ip_address = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
    
    AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action=action,
        details=details,
        ip_address=ip_address
    )


def send_event_management_approval_email(booking, approved_by=None):
    """
    Sends an email notification to the Event Management team whenever a
    Ministry officer approves an incoming booking.
    Subject and body are pulled from the EmailTemplate with trigger='event_mgmt_notification'
    so they can be edited from the Message Center.
    """
    try:
        from .models import SystemUser, EmailTemplate
        from django.contrib.auth.models import User
        from django.utils import timezone

        # 1. Gather all Event Management team emails
        event_mgmt_emails = list(
            SystemUser.objects.filter(role='event_management')
            .exclude(email='')
            .values_list('email', flat=True)
        )
        if not event_mgmt_emails:
            event_mgmt_emails = list(
                User.objects.filter(system_profile__role='event_management')
                .exclude(email='')
                .values_list('email', flat=True)
            )
        if not event_mgmt_emails:
            default_fallback = getattr(settings, 'EVENT_MANAGEMENT_EMAIL', 'eventmanagement@moa.gov.et')
            event_mgmt_emails = [default_fallback]

        # Deduplicate
        seen = set()
        to_emails = [e.strip() for e in event_mgmt_emails if e and not (e.lower() in seen or seen.add(e.lower()))]

        if not to_emails:
            print("[EVENT MGMT EMAIL] No valid Event Management email addresses found.")
            return False

        # 2. Approver details
        officer = approved_by or booking.management_approved_by
        officer_name = 'Ministry Leadership'
        if officer:
            try:
                officer_name = officer.system_profile.name
            except Exception:
                officer_name = officer.get_full_name() or officer.username

        approval_time = (booking.management_approved_at or timezone.now()).strftime('%B %d, %Y at %I:%M %p UTC')

        # 3. Format event metadata
        date_str = (
            booking.start_date.strftime('%B %d, %Y')
            if booking.start_date == booking.end_date
            else f"{booking.start_date.strftime('%B %d, %Y')} to {booking.end_date.strftime('%B %d, %Y')}"
        )
        tech_list = ", ".join([s.name for s in booking.technical_services.all()]) or "None"
        supp_list = ", ".join([s.name for s in booking.support_services.all()]) or "None"

        # 4. Load subject/body from DB template (editable in Message Center)
        default_subject = "Ministry Approved Booking: {event} (Ref: MOA-BKG-{ref})"
        default_body = (
            "Dear Event Management Team,\n\n"
            "The booking request for \"{event}\" has been reviewed and approved by Ministry Leadership ({officer}).\n\n"
            "The request is now ready for Event Management review, scheduling verification, service coordination, and payment processing. Please log in to the portal to manage this booking."
        )

        try:
            tmpl = EmailTemplate.objects.get(trigger='event_mgmt_notification')
            raw_subject = tmpl.subject
            raw_body = tmpl.body
        except EmailTemplate.DoesNotExist:
            raw_subject = default_subject
            raw_body = default_body

        # 5. Substitute placeholders
        placeholders = {
            '{name}': booking.organizer_name,
            '{event}': booking.event_title,
            '{venue}': booking.venue.name,
            '{date}': date_str,
            '{ref}': str(booking.id),
            '{status}': 'Approved by MoA Management',
            '{reason}': '',
            '{officer}': officer_name,
            '{approval_time}': approval_time,
            '{org}': booking.organization or 'N/A',
            '{tech}': tech_list,
            '{support}': supp_list,
            '{attendees}': str(booking.participant_count),
        }
        subject = raw_subject
        body_text = raw_body
        for key, value in placeholders.items():
            subject = subject.replace(key, str(value))
            body_text = body_text.replace(key, str(value))

        # 6. HTML version using the standard branded email template design
        body_html = _build_html_email(subject, body_text, booking, 'event_mgmt_notification')

        msg = EmailMultiAlternatives(
            subject=subject,
            body=body_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_emails,
            reply_to=[settings.EMAIL_HOST_USER] if getattr(settings, 'EMAIL_HOST_USER', None) else None,
        )
        msg.attach_alternative(body_html, "text/html")
        msg.send(fail_silently=False)

        print(f"[EVENT MGMT EMAIL OK] Sent to {to_emails} for MOA-BKG-{booking.id}")
        return True

    except Exception as e:
        print(f"[EVENT MGMT EMAIL ERROR] Failed to send to Event Management: {e}")
        return False