from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .serializers import EventInquirySerializer
from .services import (
    EVENT_NOTIFY_FAILED,
    TECHNICAL_ERROR_DETAIL,
    create_event_inquiry_with_notify,
)


class EventInquiryAnonThrottle(AnonRateThrottle):
    scope = 'events'


class EventInquiryCreateView(APIView):
    """Public endpoint: create private-events förfrågan and notify via Telegram."""

    authentication_classes = []
    permission_classes = []
    throttle_classes = [EventInquiryAnonThrottle]

    def post(self, request):
        serializer = EventInquirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inquiry, error_code = create_event_inquiry_with_notify(serializer.validated_data)
        if error_code:
            return Response(
                {
                    'ok': False,
                    'code': error_code or EVENT_NOTIFY_FAILED,
                    'detail': TECHNICAL_ERROR_DETAIL,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                'ok': True,
                'id': inquiry.pk,
                'notify_sent': inquiry.notify_sent,
            },
            status=status.HTTP_201_CREATED,
        )
