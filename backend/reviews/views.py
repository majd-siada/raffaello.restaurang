from rest_framework import generics

from .models import CuratedReview
from .serializers import CuratedReviewSerializer


class ReviewListView(generics.ListAPIView):
    """Public read: published curated reviews only."""

    serializer_class = CuratedReviewSerializer

    def get_queryset(self):
        return CuratedReview.objects.filter(is_published=True)
