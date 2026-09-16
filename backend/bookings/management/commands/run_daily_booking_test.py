"""Daily end-to-end booking test: same create+Telegram path as real customers."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand, CommandError

from bookings.serializers import BookingSerializer
from bookings.services import create_booking_with_notify
from bookings.whatsapp import send_telegram_text
from raffaello.restaurant_data import opening_hours_by_weekday

STOCKHOLM = ZoneInfo('Europe/Stockholm')

# Distinct test identity — never used as a fake success bypass.
TEST_FIRST_NAME = 'Raffaello'
TEST_LAST_NAME = 'Restaurant'
TEST_MESSAGE = 'test 123'
TEST_PHONE = '+46700000000'
TEST_EMAIL = 'booking-test@raffaello.se'
TEST_GUESTS = 2


def _next_valid_slot(now: datetime | None = None) -> tuple[date, time]:
    """Pick the next opening-hours slot at least a few minutes in the future."""
    now = now or datetime.now(STOCKHOLM)
    # Prefer evening dinner slot when available; otherwise first open slot of a day.
    preferred = time(18, 0)
    hours_map = opening_hours_by_weekday()

    for day_offset in range(0, 14):
        day = (now + timedelta(days=day_offset)).date()
        day_hours = hours_map.get(day.weekday())
        if day_hours is None:
            continue
        opens, closes = day_hours
        candidates = []
        if opens <= preferred <= closes:
            candidates.append(preferred)
        # 30-minute steps from opens (mirrors frontend slots)
        t = datetime.combine(day, opens)
        end = datetime.combine(day, closes)
        while t <= end:
            candidates.append(t.time())
            t += timedelta(minutes=30)

        for slot in candidates:
            slot_dt = datetime.combine(day, slot, tzinfo=STOCKHOLM)
            if slot_dt > now + timedelta(minutes=5):
                return day, slot

    # Fallback: tomorrow at preferred dinner time (validation still enforces hours)
    tomorrow = now.date() + timedelta(days=1)
    return tomorrow, time(18, 0)

class Command(BaseCommand):
    help = (
        'Create a test booking via the same notify path as customers, '
        'verify Telegram, report PASS/FAIL, then delete the test row.'
    )

    def handle(self, *args, **options):
        booking_date, booking_time = _next_valid_slot()
        payload = {
            'first_name': TEST_FIRST_NAME,
            'last_name': TEST_LAST_NAME,
            'phone': TEST_PHONE,
            'email': TEST_EMAIL,
            'date': booking_date.isoformat(),
            'time': booking_time.strftime('%H:%M'),
            'guests': TEST_GUESTS,
            'message': TEST_MESSAGE,
        }

        serializer = BookingSerializer(data=payload)
        if not serializer.is_valid():
            reason = f'validation failed: {serializer.errors}'
            self._fail(reason)
            return

        booking, error_code = create_booking_with_notify(
            serializer.validated_data,
            is_test=True,
        )
        if error_code or booking is None:
            self._fail(f'notify failed ({error_code or "unknown"})')
            return

        booking_id = booking.pk
        whatsapp_sent = booking.whatsapp_sent
        # Remove test data so production admin stays clean.
        booking.delete()

        if not whatsapp_sent:
            self._fail(f'booking {booking_id} created but whatsapp_sent was False')
            return

        self._pass(
            f'booking {booking_id} notified for {booking_date} {booking_time.strftime("%H:%M")}'
        )

    def _pass(self, detail: str) -> None:
        msg = f'Daily booking test: PASS — {detail}'
        self.stdout.write(self.style.SUCCESS(msg))
        send_telegram_text(msg)

    def _fail(self, reason: str) -> None:
        msg = f'Daily booking test: FAIL — {reason}'
        self.stderr.write(self.style.ERROR(msg))
        send_telegram_text(msg)
        raise CommandError(msg)
