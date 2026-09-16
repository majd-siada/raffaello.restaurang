from datetime import date, datetime, time

from rest_framework import serializers

from raffaello.restaurant_data import max_guests_online, opening_hours_by_weekday

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
        limit = max_guests_online()
        if value < 1 or value > limit:
            raise serializers.ValidationError(
                f'Onlinebokning gäller max {limit} personer. '
                'Ring oss för större sällskap.'
            )
        return value

    def validate(self, attrs):
        booking_date = attrs.get('date')
        booking_time = attrs.get('time')
        if booking_date and booking_time and isinstance(booking_time, time):
            hours = opening_hours_by_weekday()
            day_hours = hours.get(booking_date.weekday())
            if day_hours is None:
                raise serializers.ValidationError(
                    {'time': 'Restaurangen är stängd detta datum.'}
                )
            opens, closes = day_hours
            if booking_time < opens or booking_time > closes:
                raise serializers.ValidationError(
                    {
                        'time': (
                            f'Tiden måste vara inom öppettiderna '
                            f'({opens.strftime("%H:%M")}–{closes.strftime("%H:%M")}).'
                        )
                    }
                )
            if booking_date == date.today() and booking_time < datetime.now().time():
                raise serializers.ValidationError(
                    {'time': 'Tiden har redan passerat idag. Välj en senare tid.'}
                )
        return attrs
