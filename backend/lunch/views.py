from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LunchWeek, monday_of
from .serializers import LunchWeekSerializer


class LunchCurrentView(APIView):
    """Return the published lunch menu for the current ISO week only."""

    def get(self, request):
        today = timezone.localdate()
        monday = monday_of(today)
        iso = monday.isocalendar()
        year, week = iso.year, iso.week

        lunch_week = (
            LunchWeek.objects.filter(
                is_published=True,
                year=year,
                week_number=week,
            )
            .prefetch_related('dishes')
            .first()
        )

        if lunch_week:
            return Response(LunchWeekSerializer(lunch_week).data)

        return Response(
            {
                'year': year,
                'week_number': week,
                'week_start': monday.isoformat(),
                'intro_text': '',
                'notes': '',
                'dishes': [],
                'empty': True,
            }
        )
