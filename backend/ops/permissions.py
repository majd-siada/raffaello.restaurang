from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsStaffUser(BasePermission):
    """Authenticated Django staff (same bar as admin SPA login)."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff and user.is_active)


def user_perm_flags(user):
    """Booleans for ops nav — grounded in Django model permissions."""
    if not user or not user.is_authenticated:
        return {}
    if user.is_superuser:
        return {
            'is_superuser': True,
            'menu': True,
            'lunch': True,
            'offers': True,
            'gallery': True,
            'reviews': True,
            'bookings': True,
            'events': True,
            'lunch_sync': True,
            'opening_hours': True,
            'faq': True,
            'legal': True,
        }
    return {
        'is_superuser': False,
        'menu': user.has_perm('menu.view_menuitem') or user.has_perm('menu.change_menuitem'),
        'lunch': user.has_perm('lunch.view_lunchweek') or user.has_perm('lunch.change_lunchweek'),
        'offers': user.has_perm('offers.view_weeklyoffer') or user.has_perm('offers.change_weeklyoffer'),
        'gallery': user.has_perm('gallery.view_galleryphoto') or user.has_perm('gallery.change_galleryphoto'),
        'reviews': user.has_perm('reviews.view_curatedreview') or user.has_perm('reviews.change_curatedreview'),
        'bookings': user.has_perm('bookings.view_booking'),
        'events': user.has_perm('events.view_eventinquiry'),
        'lunch_sync': user.has_perm('lunch.change_lunchweek') or user.is_superuser,
        'opening_hours': (
            user.has_perm('restaurant.view_openinghoursday')
            or user.has_perm('restaurant.change_openinghoursday')
        ),
        'faq': user.has_perm('content.view_faqitem') or user.has_perm('content.change_faqitem'),
        'legal': user.has_perm('content.view_legalpage') or user.has_perm('content.change_legalpage'),
    }


class HasModelPerm(BasePermission):
    """
    Map view.ops_perms = {'GET': 'app.view_model', 'WRITE': 'app.change_model'}
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_staff):
            return False
        if user.is_superuser:
            return True
        mapping = getattr(view, 'ops_perms', None) or {}
        if request.method in SAFE_METHODS:
            codename = mapping.get('GET') or mapping.get('VIEW')
        else:
            codename = mapping.get('WRITE') or mapping.get('CHANGE')
        if not codename:
            return True
        return user.has_perm(codename)
