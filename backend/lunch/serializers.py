from rest_framework import serializers

from .models import WEEKDAY_CHOICES, LunchDish, LunchWeek


class LunchDishSerializer(serializers.ModelSerializer):
    weekday_label = serializers.SerializerMethodField()

    class Meta:
        model = LunchDish
        fields = [
            'id',
            'weekday',
            'weekday_label',
            'name',
            'description',
            'price',
            'is_available',
            'order',
        ]

    def get_weekday_label(self, obj):
        if obj.weekday is None:
            return None
        return dict(WEEKDAY_CHOICES).get(obj.weekday)


class LunchWeekSerializer(serializers.ModelSerializer):
    dishes = serializers.SerializerMethodField()

    class Meta:
        model = LunchWeek
        fields = [
            'id',
            'year',
            'week_number',
            'week_start',
            'intro_text',
            'notes',
            'dishes',
        ]

    def get_dishes(self, obj):
        qs = obj.dishes.filter(is_available=True)
        return LunchDishSerializer(qs, many=True).data
