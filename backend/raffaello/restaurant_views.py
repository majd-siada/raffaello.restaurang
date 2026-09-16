"""Public restaurant config (canonical hours + booking rules)."""

from rest_framework.response import Response
from rest_framework.views import APIView

from .restaurant_data import public_restaurant_payload


class RestaurantConfigView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(public_restaurant_payload())
