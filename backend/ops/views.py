from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from bookings.models import Booking
from content.models import FaqItem, LegalPage
from content.views import trust_content_source
from events.models import EventInquiry
from gallery.models import GalleryPhoto
from lunch.models import LunchImportRun, LunchWeek, monday_of
from lunch.services import import_status_payload, sync_from_matochmat
from menu.models import Category, MenuItem
from offers.models import OfferDish, WeeklyOffer
from raffaello.restaurant_data import (
    detect_hours_drift,
    opening_hours_source,
    public_restaurant_payload,
)
from reviews.models import CuratedReview

from .permissions import HasModelPerm, IsStaffUser
from .serializers import (
    OpsBookingSerializer,
    OpsCategorySerializer,
    OpsEventSerializer,
    OpsFaqSerializer,
    OpsGallerySerializer,
    OpsLegalSerializer,
    OpsLunchImportRunSerializer,
    OpsLunchWeekSerializer,
    OpsMenuItemSerializer,
    OpsOfferDishSerializer,
    OpsReviewSerializer,
    OpsWeeklyOfferSerializer,
)


class OpsSessionAuthentication(SessionAuthentication):
    """Enforce CSRF on unsafe methods (DRF default for SessionAuthentication)."""


class OpsPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class StaffAPIView(APIView):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser]


class OverviewView(StaffAPIView):
    def get(self, request):
        today = timezone.localdate()
        now = timezone.localtime()
        monday = monday_of(today)
        iso = monday.isocalendar()

        restaurant = public_restaurant_payload()
        # Opening status from schedule + weekday
        from raffaello.restaurant_data import opening_hours_by_weekday

        hours_map = opening_hours_by_weekday()
        todays = hours_map.get(today.weekday())
        open_now = False
        today_hours = None
        if todays:
            opens, closes = todays
            today_hours = {
                'opens': opens.strftime('%H:%M'),
                'closes': closes.strftime('%H:%M'),
            }
            t = now.time()
            open_now = opens <= t < closes

        lunch_week = (
            LunchWeek.objects.filter(year=iso.year, week_number=iso.week)
            .prefetch_related('dishes')
            .first()
        )
        lunch_dishes = 0
        today_lunch_dishes = 0
        if lunch_week:
            qs = lunch_week.dishes.filter(is_available=True)
            lunch_dishes = qs.count()
            today_lunch_dishes = qs.filter(
                Q(weekday=today.weekday()) | Q(weekday__isnull=True)
            ).count()

        offer = WeeklyOffer.objects.filter(
            year=iso.year, week_number=iso.week
        ).first()

        bookings_today_qs = Booking.objects.filter(date=today, is_test=False)
        bookings_today = bookings_today_qs.count()
        today_guests = (
            bookings_today_qs.aggregate(total=Sum('guests')).get('total') or 0
        )
        today_bookings = bookings_today_qs.order_by('time', 'id')
        upcoming_count = Booking.objects.filter(
            date__gt=today, is_test=False
        ).count()
        week_ago = now - timedelta(days=7)
        events_recent = EventInquiry.objects.filter(created_at__gte=week_ago).count()

        import_status = import_status_payload()

        attention = []
        last_run = import_status.get('last_run') or {}
        last_status = (last_run.get('status') or '').upper()
        if last_status in {'FETCH_FAILED', 'PARSE_FAILED'}:
            attention.append(
                {
                    'code': 'lunch_sync_failed',
                    'severity': 'high',
                    'message': 'Senaste Mat och Mat-synken misslyckades.',
                }
            )
        if not lunch_week or not lunch_week.is_published:
            attention.append(
                {
                    'code': 'lunch_not_published',
                    'severity': 'medium',
                    'message': 'Aktuell lunchvecka saknas eller är opublicerad.',
                }
            )
        if events_recent:
            attention.append(
                {
                    'code': 'event_inquiries',
                    'severity': 'medium',
                    'message': f'{events_recent} eventförfrågan/förfrågningar senaste 7 dagarna.',
                }
            )

        recent_bookings = Booking.objects.filter(is_test=False).order_by('-created_at')[:8]
        recent_events = EventInquiry.objects.order_by('-created_at')[:8]
        recent_imports = LunchImportRun.objects.order_by('-started_at')[:8]

        return Response(
            {
                'generated_at': now.isoformat(),
                'today': {
                    'date': today.isoformat(),
                    'open_now': open_now,
                    'hours': today_hours,
                    'lunch_published': bool(lunch_week and lunch_week.is_published),
                    'lunch_dish_count': lunch_dishes,
                    'lunch_today_dish_count': today_lunch_dishes,
                    'offer_published': bool(offer and offer.is_published),
                    'offer_empty': offer is None or (
                        not (offer.intro_text or '').strip()
                        and not offer.dishes.filter(is_available=True).exists()
                    ),
                    'bookings_count': bookings_today,
                    'guests_today': today_guests,
                    'upcoming_count': upcoming_count,
                    'event_inquiries_7d': events_recent,
                },
                'today_bookings': OpsBookingSerializer(today_bookings, many=True).data,
                'matochmat': import_status,
                'attention': attention,
                'recent': {
                    'bookings': OpsBookingSerializer(recent_bookings, many=True).data,
                    'events': OpsEventSerializer(recent_events, many=True).data,
                    'imports': OpsLunchImportRunSerializer(recent_imports, many=True).data,
                },
                'restaurant': restaurant,
            }
        )


class SystemView(StaffAPIView):
    def get(self, request):
        telegram_configured = bool(
            getattr(settings, 'TELEGRAM_BOT_TOKEN', '')
            and getattr(settings, 'TELEGRAM_CHAT_ID', '')
        )
        return Response(
            {
                'health': 'ok',
                'timezone': settings.TIME_ZONE,
                'matochmat_sync_enabled': bool(
                    getattr(settings, 'MATOCHMAT_SYNC_ENABLED', False)
                ),
                'telegram_configured': telegram_configured,
                'import_status': import_status_payload(),
                'counts': {
                    'menu_categories': Category.objects.count(),
                    'menu_items': MenuItem.objects.count(),
                    'bookings': Booking.objects.filter(is_test=False).count(),
                    'events': EventInquiry.objects.count(),
                    'gallery_published': GalleryPhoto.objects.filter(
                        is_published=True
                    ).count(),
                    'reviews_published': CuratedReview.objects.filter(
                        is_published=True
                    ).count(),
                },
                'hours_source': opening_hours_source(),
                'hours_source_detail': (
                    'db:restaurant.OpeningHoursDay'
                    if opening_hours_source() == 'db'
                    else 'backend/raffaello/data/opening_hours.json'
                ),
                'hours_drift': detect_hours_drift(),
                'faq_legal': {
                    'cms': True,
                    'source': trust_content_source(),
                    'faq_count': FaqItem.objects.count(),
                    'faq_published': FaqItem.objects.filter(is_published=True).count(),
                    'legal_pages': LegalPage.objects.count(),
                    'note': (
                        'TRUST_CONTENT_SOURCE=db aktiverar public API; '
                        'default frontend → trustContent.js.'
                    ),
                },
            }
        )


class RestaurantView(StaffAPIView):
    def get(self, request):
        src = opening_hours_source()
        return Response(
            {
                **public_restaurant_payload(),
                'source': src,
                'writable': src == 'db',
                'drift': detect_hours_drift(),
                'note': (
                    'DB är aktiv SoT (OPENING_HOURS_SOURCE=db). Redigera via Admin.'
                    if src == 'db'
                    else (
                        'JSON är aktiv SoT (OPENING_HOURS_SOURCE=json). '
                        'Admin kan redigera DB; public byter efter flagga. '
                        'JSON-filen raderas inte.'
                    )
                ),
            }
        )


class OpeningHoursAdminView(StaffAPIView):
    """GET/PUT weekly opening hours days — Admin primary write path."""

    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {
        'GET': 'restaurant.view_openinghoursday',
        'WRITE': 'restaurant.change_openinghoursday',
    }

    def get(self, request):
        from restaurant.models import OpeningHoursDay, OpeningHoursSettings, WEEKDAY_CHOICES

        settings_row = OpeningHoursSettings.objects.filter(pk=1).first()
        days = list(OpeningHoursDay.objects.all().order_by('weekday'))
        by_wd = {d.weekday: d for d in days}
        payload_days = []
        for wd, label in WEEKDAY_CHOICES:
            d = by_wd.get(wd)
            payload_days.append(
                {
                    'weekday': wd,
                    'label': label,
                    'opens': d.opens.strftime('%H:%M') if d and d.opens else '',
                    'closes': d.closes.strftime('%H:%M') if d and d.closes else '',
                    'is_closed': bool(d.is_closed) if d else True,
                }
            )
        return Response(
            {
                'source_flag': opening_hours_source(),
                'active_public_source': opening_hours_source(),
                'timezone': (
                    settings_row.timezone if settings_row else 'Europe/Stockholm'
                ),
                'max_guests_online': (
                    settings_row.max_guests_online if settings_row else None
                ),
                'slot_interval_minutes': (
                    settings_row.slot_interval_minutes if settings_row else None
                ),
                'days': payload_days,
                'drift': detect_hours_drift(),
                'public_preview': public_restaurant_payload(),
                'nap_note': (
                    'NAP (namn/adress/telefon) förblir siteConfig.js.'
                ),
            }
        )

    def put(self, request):
        return self._save(request)

    def patch(self, request):
        return self._save(request)

    def _save(self, request):
        from datetime import time as time_cls

        from django.core.exceptions import ValidationError
        from django.db import transaction

        from restaurant.models import OpeningHoursDay, OpeningHoursSettings

        body = request.data or {}
        days_in = body.get('days')
        if not isinstance(days_in, list) or len(days_in) == 0:
            return Response(
                {'detail': 'days[] krävs.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        parsed = []
        for row in days_in:
            try:
                wd = int(row.get('weekday'))
            except (TypeError, ValueError):
                return Response(
                    {'detail': 'Ogiltig weekday.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if wd < 0 or wd > 6:
                return Response(
                    {'detail': f'weekday måste vara 0–6 (fick {wd}).'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            is_closed = bool(row.get('is_closed'))
            opens_s = (row.get('opens') or '').strip()
            closes_s = (row.get('closes') or '').strip()
            opens = closes = None
            if not is_closed:
                if not opens_s or not closes_s:
                    return Response(
                        {
                            'detail': (
                                f'Dag {wd}: öppna dagar kräver opens och closes (HH:MM).'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                try:
                    opens = time_cls.fromisoformat(opens_s)
                    closes = time_cls.fromisoformat(closes_s)
                except ValueError:
                    return Response(
                        {'detail': f'Dag {wd}: ogiltigt tidsformat (använd HH:MM).'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            parsed.append(
                {
                    'weekday': wd,
                    'opens': opens,
                    'closes': closes,
                    'is_closed': is_closed,
                }
            )

        try:
            with transaction.atomic():
                if 'max_guests_online' in body or 'slot_interval_minutes' in body:
                    settings_row, _ = OpeningHoursSettings.objects.get_or_create(pk=1)
                    if 'max_guests_online' in body:
                        settings_row.max_guests_online = int(body['max_guests_online'])
                    if 'slot_interval_minutes' in body:
                        settings_row.slot_interval_minutes = int(
                            body['slot_interval_minutes']
                        )
                    settings_row.save()

                for row in parsed:
                    day = OpeningHoursDay.objects.filter(weekday=row['weekday']).first()
                    if day is None:
                        day = OpeningHoursDay(weekday=row['weekday'], is_closed=True)
                    day.opens = row['opens']
                    day.closes = row['closes']
                    day.is_closed = row['is_closed']
                    day.save()
        except ValidationError as exc:
            return Response(
                {'detail': exc.messages if hasattr(exc, 'messages') else str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return self.get(request)


class LunchSyncView(StaffAPIView):
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {'WRITE': 'lunch.change_lunchweek', 'GET': 'lunch.view_lunchweek'}

    def post(self, request):
        if not (
            request.user.is_superuser
            or request.user.has_perm('lunch.change_lunchweek')
        ):
            return Response(
                {'detail': 'Saknar behörighet att synka lunch.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        result = sync_from_matochmat()
        payload = {
            'status': result.status,
            'message': result.message,
            'changed': result.changed,
            'year': result.year,
            'week_number': result.week_number,
            'item_count': result.item_count,
            'source_hash': result.source_hash,
        }
        return Response({'ok': True, 'result': payload})


class LunchCurrentOpsView(StaffAPIView):
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {'GET': 'lunch.view_lunchweek', 'WRITE': 'lunch.change_lunchweek'}

    def get(self, request):
        today = timezone.localdate()
        monday = monday_of(today)
        iso = monday.isocalendar()
        week = (
            LunchWeek.objects.filter(year=iso.year, week_number=iso.week)
            .prefetch_related('dishes')
            .first()
        )
        if not week:
            return Response(
                {
                    'empty': True,
                    'year': iso.year,
                    'week_number': iso.week,
                    'week_start': monday.isoformat(),
                }
            )
        return Response(OpsLunchWeekSerializer(week).data)


class LunchImportRunViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {'GET': 'lunch.view_lunchweek'}
    serializer_class = OpsLunchImportRunSerializer
    pagination_class = OpsPagination
    queryset = LunchImportRun.objects.all().order_by('-started_at')


class LunchWeekViewSet(viewsets.ModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {
        'GET': 'lunch.view_lunchweek',
        'WRITE': 'lunch.change_lunchweek',
    }
    serializer_class = OpsLunchWeekSerializer
    http_method_names = ['get', 'patch', 'head', 'options']
    queryset = LunchWeek.objects.all().prefetch_related('dishes')


class CategoryViewSet(viewsets.ModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {'GET': 'menu.view_category', 'WRITE': 'menu.change_category'}
    serializer_class = OpsCategorySerializer
    pagination_class = OpsPagination
    queryset = Category.objects.all().order_by('order', 'id')


class MenuItemViewSet(viewsets.ModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {'GET': 'menu.view_menuitem', 'WRITE': 'menu.change_menuitem'}
    serializer_class = OpsMenuItemSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = OpsPagination
    queryset = MenuItem.objects.select_related('category').all().order_by(
        'category__order', 'order', 'id'
    )

    def get_queryset(self):
        qs = super().get_queryset()
        cat = self.request.query_params.get('category')
        if cat:
            qs = qs.filter(category_id=cat)
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q))
        return qs


class WeeklyOfferViewSet(viewsets.ModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {
        'GET': 'offers.view_weeklyoffer',
        'WRITE': 'offers.change_weeklyoffer',
    }
    serializer_class = OpsWeeklyOfferSerializer
    pagination_class = OpsPagination
    queryset = WeeklyOffer.objects.all().prefetch_related('dishes').order_by(
        '-year', '-week_number'
    )


class OfferDishViewSet(viewsets.ModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {
        'GET': 'offers.view_offerdish',
        'WRITE': 'offers.change_offerdish',
    }
    serializer_class = OpsOfferDishSerializer
    queryset = OfferDish.objects.select_related('offer').all()


class BookingViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {'GET': 'bookings.view_booking'}
    serializer_class = OpsBookingSerializer
    pagination_class = OpsPagination
    queryset = Booking.objects.all().order_by('-created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('include_tests') != '1':
            qs = qs.filter(is_test=False)
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
                | Q(email__icontains=q)
                | Q(phone__icontains=q)
            )
        return qs


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {'GET': 'events.view_eventinquiry'}
    serializer_class = OpsEventSerializer
    pagination_class = OpsPagination
    queryset = EventInquiry.objects.all().order_by('-created_at')

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
                | Q(email__icontains=q)
                | Q(occasion__icontains=q)
            )
        return qs


class GalleryViewSet(viewsets.ModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {
        'GET': 'gallery.view_galleryphoto',
        'WRITE': 'gallery.change_galleryphoto',
    }
    serializer_class = OpsGallerySerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    pagination_class = OpsPagination
    queryset = GalleryPhoto.objects.all().order_by('order', 'id')


class ReviewViewSet(viewsets.ModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {
        'GET': 'reviews.view_curatedreview',
        'WRITE': 'reviews.change_curatedreview',
    }
    serializer_class = OpsReviewSerializer
    pagination_class = OpsPagination
    queryset = CuratedReview.objects.all().order_by('order', '-id')


class FaqViewSet(viewsets.ModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {
        'GET': 'content.view_faqitem',
        'WRITE': 'content.change_faqitem',
    }
    serializer_class = OpsFaqSerializer
    pagination_class = OpsPagination
    queryset = FaqItem.objects.all().order_by('order', 'id')


class LegalViewSet(viewsets.ModelViewSet):
    authentication_classes = [OpsSessionAuthentication]
    permission_classes = [IsStaffUser, HasModelPerm]
    ops_perms = {
        'GET': 'content.view_legalpage',
        'WRITE': 'content.change_legalpage',
    }
    serializer_class = OpsLegalSerializer
    pagination_class = OpsPagination
    queryset = LegalPage.objects.all().order_by('key')
    lookup_field = 'key'
