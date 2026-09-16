from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .serializers import BookingSerializer
from .services import (
    BOOKING_NOTIFY_FAILED,
    TECHNICAL_ERROR_DETAIL,
    create_booking_with_notify,
)


class BookingAnonThrottle(AnonRateThrottle):
    scope = 'bookings'


class BookingCreateView(APIView):
    """Public endpoint: create a booking and notify restaurant via Telegram."""

    authentication_classes = []
    permission_classes = []
    throttle_classes = [BookingAnonThrottle]

    def post(self, request):
        serializer = BookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking, error_code = create_booking_with_notify(
            serializer.validated_data,
            is_test=False,
        )
        if error_code:
            return Response(
                {
                    'ok': False,
                    'code': error_code or BOOKING_NOTIFY_FAILED,
                    'detail': TECHNICAL_ERROR_DETAIL,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                'ok': True,
                'id': booking.pk,
                'whatsapp_sent': booking.whatsapp_sent,
            },
            status=status.HTTP_201_CREATED,
        )
