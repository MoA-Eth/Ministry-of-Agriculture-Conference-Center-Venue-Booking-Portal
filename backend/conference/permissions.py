"""
Custom permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


def get_role(user):
    """Safely resolve the role of an authenticated user."""
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return 'system_admin'
    try:
        return user.system_profile.role
    except Exception:
        # Fallback for users created via django-admin without a SystemUser profile
        return 'system_admin' if user.is_staff else 'organizer'


class IsSystemAdmin(BasePermission):
    """Only system administrators can access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and get_role(request.user) == 'system_admin'


class IsEventManagementOrAdmin(BasePermission):
    """Event management team, finance admin, and system admins."""
    ALLOWED = {'event_management', 'system_admin', 'admin_finance', 'leadership'}

    def has_permission(self, request, view):
        return request.user.is_authenticated and get_role(request.user) in self.ALLOWED


class IsOrganizerOrAdmin(BasePermission):
    """Event organizers and system admins."""
    ALLOWED = {'organizer', 'system_admin', 'leadership'}

    def has_permission(self, request, view):
        return request.user.is_authenticated and get_role(request.user) in self.ALLOWED


class IsICTOrAdmin(BasePermission):
    """ICT admins and system admins."""
    ALLOWED = {'ict_admin', 'system_admin'}

    def has_permission(self, request, view):
        return request.user.is_authenticated and get_role(request.user) in self.ALLOWED


class IsCateringOrAdmin(BasePermission):
    """Catering support and system admins."""
    ALLOWED = {'catering_support', 'system_admin'}

    def has_permission(self, request, view):
        return request.user.is_authenticated and get_role(request.user) in self.ALLOWED


class IsAuthenticatedOrPublicRead(BasePermission):
    """
    Allow unauthenticated access only to ?public=true reads.
    All other access requires authentication.
    """
    def has_permission(self, request, view):
        is_public = request.query_params.get('public', 'false').lower() == 'true'
        if request.method in SAFE_METHODS and is_public:
            return True
        return request.user and request.user.is_authenticated


class IsLeadership(BasePermission):
    """Only leadership can access. System admins are excluded."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and get_role(request.user) == 'leadership'
