from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'venues', views.VenueViewSet)
router.register(r'technical-services', views.TechnicalServiceViewSet)
router.register(r'support-services', views.SupportServiceViewSet)
router.register(r'bookings', views.BookingViewSet)

# Register BOTH names so the frontend never gets lost!
router.register(r'system-users', views.SystemUserViewSet, basename='system-user')
router.register(r'users', views.SystemUserViewSet, basename='user')

router.register(r'email-templates', views.EmailTemplateViewSet)
router.register(r'audit-logs', views.AuditLogViewSet)
router.register(r'notifications', views.NotificationViewSet, basename='notification')
# Notice: We completely removed Task Allocations and Maintenance Updates from here!

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/me/', views.MeView.as_view(), name='me'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('settings/', views.SystemSettingsView.as_view(), name='settings'),
]