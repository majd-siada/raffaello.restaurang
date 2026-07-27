from rest_framework import serializers

from .models import OfferDish, WeeklyOffer


class OfferDishSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferDish
        fields = ['id', 'name', 'description', 'price', 'is_available', 'order']


class WeeklyOfferSerializer(serializers.ModelSerializer):
    dishes = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyOffer
        fields = [
            'id',
            'year',
            'week_number',
            'week_start',
            'intro_text',
            'dishes',
        ]

    def get_dishes(self, obj):
        qs = obj.dishes.filter(is_available=True)
        return OfferDishSerializer(qs, many=True).data
