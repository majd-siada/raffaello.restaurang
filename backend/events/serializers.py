from datetime import date

from rest_framework import serializers

from .models import EventInquiry


class EventInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventInquiry
        fields = (
            'first_name',
            'last_name',
            'phone',
            'email',
            'preferred_date',
            'guests',
            'occasion',
            'message',
        )

    def validate_phone(self, value):
        cleaned = value.strip()
        digits = ''.join(c for c in cleaned if c.isdigit() or c == '+')
        if len(digits.replace('+', '')) < 8:
            raise serializers.ValidationError('Ange ett giltigt telefonnummer.')
        return cleaned

    def validate_preferred_date(self, value):
        if value is not None and value < date.today():
            raise serializers.ValidationError('Datumet kan inte vara i det förflutna.')
        return value

    def validate_guests(self, value):
        if value is None:
            return value
        if value < 1 or value > 500:
            raise serializers.ValidationError('Ange ett rimligt antal gäster.')
        return value
