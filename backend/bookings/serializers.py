from datetime import date, datetime, time

from rest_framework import serializers

from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = (
            'first_name',
            'last_name',
            'phone',
            'email',
            'date',
            'time',
            'guests',
            'message',
        )

    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError('Datumet kan inte vara i det förflutna.')
        return value

    def validate_phone(self, value):
        cleaned = value.strip()
        digits = ''.join(c for c in cleaned if c.isdigit() or c == '+')
        if len(digits.replace('+', '')) < 8:
            raise serializers.ValidationError('Ange ett giltigt telefonnummer.')
        return cleaned

    def validate_guests(self, value):
        if value < 1 or value > 40:
            raise serializers.ValidationError('Antal gäster måste vara mellan 1 och 40.')
        return value

    def validate(self, attrs):
        booking_date = attrs.get('date')
        booking_time = attrs.get('time')
        if booking_date == date.today() and booking_time:
            now = datetime.now().time()
            # Allow a small grace; block clearly past times today
            if isinstance(booking_time, time) and booking_time < now:
                raise serializers.ValidationError(
                    {'time': 'Tiden har redan passerat idag. Välj en senare tid.'}
                )
        return attrs
