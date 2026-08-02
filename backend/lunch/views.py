from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LunchWeek, monday_of
from .serializers import LunchWeekSerializer


def _iso_keys(d):
    monday = monday_of(d)
    iso = monday.isocalendar()
    return iso.year, iso.week, monday


class LunchWindowView(APIView):
    """Return published lunch menus for previous, current, and next ISO week."""

    def get(self, request):
        today = timezone.localdate()
        slots = {
            'previous': _iso_keys(today - timedelta(days=7)),
            'current': _iso_keys(today),
            'next': _iso_keys(today + timedelta(days=7)),
        }

        keys = [(y, w) for y, w, _ in slots.values()]
        q = Q()
        for y, w in keys:
            q |= Q(year=y, week_number=w)

        weeks = {
            (o.year, o.week_number): o
            for o in LunchWeek.objects.filter(is_published=True)
            .filter(q)
            .prefetch_related('dishes')
        }

        payload = {}
        for label, (year, week, monday) in slots.items():
            lunch_week = weeks.get((year, week))
            if lunch_week:
                payload[label] = LunchWeekSerializer(lunch_week).data
            else:
                payload[label] = {
                    'year': year,
                    'week_number': week,
                    'week_start': monday.isoformat(),
                    'intro_text': '',
                    'notes': '',
                    'dishes': [],
                    'empty': True,
                }

        return Response(payload)
