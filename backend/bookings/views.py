from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import Booking
from .serializers import BookingSerializer
from .whatsapp import send_booking_whatsapp


class BookingAnonThrottle(AnonRateThrottle):
    scope = 'bookings'


class BookingCreateView(APIView):
    """Public endpoint: create a booking and notify owner on WhatsApp."""

    authentication_classes = []
    permission_classes = []
    throttle_classes = [BookingAnonThrottle]

    def post(self, request):
        serializer = BookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = Booking.objects.create(**serializer.validated_data)
        sent = send_booking_whatsapp(booking)
        if sent:
            booking.whatsapp_sent = True
            booking.save(update_fields=['whatsapp_sent'])
        return Response(
            {
                'ok': True,
                'id': booking.pk,
                'whatsapp_sent': booking.whatsapp_sent,
            },
            status=status.HTTP_201_CREATED,
        )
