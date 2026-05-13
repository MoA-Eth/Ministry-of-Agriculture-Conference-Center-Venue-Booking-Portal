"""
Django Admin registration for the Conference Management System.
"""
from django.contrib import admin
from .models import Venue, TechnicalService, SupportService, Booking, SystemUser


@admin.register(SystemUser)
class SystemUserAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'role', 'created_at']
    list_filter  = ['role']
    search_fields = ['name', 'email']
    ordering = ['-created_at']


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'capacity', 'best_for']
    list_filter = ['type']
    search_fields = ['name', 'best_for']
    ordering = ['id']


@admin.register(TechnicalService)
class TechnicalServiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']
    ordering = ['id']


@admin.register(SupportService)
class SupportServiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']
    ordering = ['id']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    # Added all the important fields so you can see them directly on the list page!
    list_display = [
        'event_title',
        'venue',
        'organizer_name',
        'organization',
        'start_date',
        'total_price',
        'status',
        'created_at',
    ]
    list_filter = ['status', 'venue', 'start_date']
    search_fields = ['event_title', 'organizer_name', 'organizer_email', 'organization']
    autocomplete_fields = ['venue']
    filter_horizontal = ['technical_services', 'support_services']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    date_hierarchy = 'start_date'
    
    # REMOVED fieldsets to force Django to show EVERYTHING on the detail page