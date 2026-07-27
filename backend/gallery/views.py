from rest_framework.response import Response
from rest_framework.views import APIView

from .models import GalleryPhoto
from .serializers import GalleryPhotoSerializer


class GalleryListView(APIView):
    """Return published gallery photos (max 6), ordered for the home section."""

    def get(self, request):
        photos = GalleryPhoto.objects.filter(is_published=True).order_by('order', 'id')[:6]
        return Response(GalleryPhotoSerializer(photos, many=True).data)
