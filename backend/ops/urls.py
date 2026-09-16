from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import auth_views, views

# Shared by /api/admin/ and /api/ops/ mounts (namespaced separately in project urls).
app_name = 'ops'

router = DefaultRouter()
router.register(r'menu/categories', views.CategoryViewSet, basename='ops-categories')
router.register(r'menu/items', views.MenuItemViewSet, basename='ops-items')
router.register(r'lunch/import-runs', views.LunchImportRunViewSet, basename='ops-import-runs')
router.register(r'lunch/weeks', views.LunchWeekViewSet, basename='ops-lunch-weeks')
router.register(r'offers', views.WeeklyOfferViewSet, basename='ops-offers')
router.register(r'offer-dishes', views.OfferDishViewSet, basename='ops-offer-dishes')
router.register(r'bookings', views.BookingViewSet, basename='ops-bookings')
router.register(r'events', views.EventViewSet, basename='ops-events')
router.register(r'gallery', views.GalleryViewSet, basename='ops-gallery')
router.register(r'reviews', views.ReviewViewSet, basename='ops-reviews')
router.register(r'faq', views.FaqViewSet, basename='ops-faq')
router.register(r'legal', views.LegalViewSet, basename='ops-legal')

urlpatterns = [
    path('auth/csrf/', auth_views.CsrfView.as_view(), name='ops-csrf'),
    path('auth/login/', auth_views.LoginView.as_view(), name='ops-login'),
    path('auth/logout/', auth_views.LogoutView.as_view(), name='ops-logout'),
    path('auth/me/', auth_views.MeView.as_view(), name='ops-me'),
    path('overview/', views.OverviewView.as_view(), name='ops-overview'),
    path('system/', views.SystemView.as_view(), name='ops-system'),
    path('restaurant/', views.RestaurantView.as_view(), name='ops-restaurant'),
    path(
        'restaurant/hours/',
        views.OpeningHoursAdminView.as_view(),
        name='ops-restaurant-hours',
    ),
    path('lunch/current/', views.LunchCurrentOpsView.as_view(), name='ops-lunch-current'),
    path('lunch/sync/', views.LunchSyncView.as_view(), name='ops-lunch-sync'),
    path('', include(router.urls)),
]
