from rest_framework import serializers

from .models import WEEKDAY_CHOICES, LunchDish, LunchWeek
from .matochmat import DEFAULT_URL


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
    source_attribution = serializers.SerializerMethodField()
    today_weekday = serializers.SerializerMethodField()
    today_has_dishes = serializers.SerializerMethodField()

    class Meta:
        model = LunchWeek
        fields = [
            'id',
            'year',
            'week_number',
            'week_start',
            'intro_text',
            'notes',
            'lunch_hours_text',
            'dishes',
            'source_type',
            'source_url',
            'fetched_at',
            'source_attribution',
            'today_weekday',
            'today_has_dishes',
        ]

    def get_dishes(self, obj):
        qs = obj.dishes.filter(is_available=True)
        return LunchDishSerializer(qs, many=True).data

    def get_source_attribution(self, obj):
        if obj.source_type != 'EXTERNAL_MATOCHMAT':
            return None
        return {
            'label': 'Källa: Mat och Mat',
            'url': obj.source_url or DEFAULT_URL,
        }

    def get_today_weekday(self, obj):
        from django.utils import timezone

        return timezone.localdate().weekday()

    def get_today_has_dishes(self, obj):
        from django.utils import timezone

        today = timezone.localdate().weekday()
        return obj.dishes.filter(is_available=True, weekday=today).exists()
