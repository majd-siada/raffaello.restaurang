from rest_framework import serializers

from .models import CuratedReview


class CuratedReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuratedReview
        fields = ['id', 'quote', 'author_name', 'source', 'rating', 'order']
