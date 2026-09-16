from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from .health import health
from .restaurant_views import RestaurantConfigView

admin.site.site_header = 'Raffaello'
admin.site.site_title = 'Raffaello Admin'
admin.site.index_title = 'Stekhus & Bar'

urlpatterns = [
    # Classic Django Admin — emergency surface only at /django-admin/ after React Admin cutover.
    # Do not mount at /admin/: that path is owned by the React Admin SPA (nginx → frontend).
    path('django-admin/', admin.site.urls),
    path('api/health/', health, name='health'),
    path('api/restaurant/', RestaurantConfigView.as_view(), name='restaurant-config'),
    path('api/menu/', include('menu.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/events/', include('events.urls')),
    path('api/offers/', include('offers.urls')),
    path('api/gallery/', include('gallery.urls')),
    path('api/lunch/', include('lunch.urls')),
    path('api/reviews/', include('reviews.urls')),
    path('api/', include('content.urls')),
    # Staff Admin/Ops API — ONE ops.urls module, two mounts (no handler duplication).
    # Primary: /api/admin/  · Compatibility: /api/ops/
    path('api/admin/', include(('ops.urls', 'ops'), namespace='api_admin')),
    path('api/ops/', include(('ops.urls', 'ops'), namespace='api_ops')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
