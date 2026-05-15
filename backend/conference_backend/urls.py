"""
Root URL configuration for conference_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('conference.urls')),
    path("api/health/", health)
    
]
def health(request):
    return JsonResponse({"status": "ok"})

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
