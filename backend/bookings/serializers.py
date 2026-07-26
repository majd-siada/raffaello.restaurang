from datetime import date, datetime, time

from rest_framework import serializers

from .models import Booking

# Mirrors frontend siteConfig hoursSchedule (weekday: 0=Mon … 6=Sun via date.weekday())
OPENING_HOURS = {
    0: (time(10, 45), time(21, 0)),  # Monday
    1: (time(10, 45), time(21, 0)),  # Tuesday
    2: (time(10, 45), time(21, 0)),  # Wednesday
    3: (time(10, 45), time(21, 0)),  # Thursday
    4: (time(10, 45), time(22, 0)),  # Friday
    5: (time(12, 0), time(22, 0)),   # Saturday
    6: (time(12, 0), time(21, 0)),   # Sunday
}


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
        if value < 1 or value > 6:
            raise serializers.ValidationError(
                'Onlinebokning gäller max 6 personer. Ring oss för större sällskap.'
            )
        return value

    def validate(self, attrs):
        booking_date = attrs.get('date')
        booking_time = attrs.get('time')
        if booking_date and booking_time and isinstance(booking_time, time):
            opens, closes = OPENING_HOURS[booking_date.weekday()]
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
