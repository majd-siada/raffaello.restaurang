"""Tests for booking create + Telegram gate (mocked notify)."""

from datetime import date, time, timedelta
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from bookings.models import Booking
from bookings.services import BOOKING_NOTIFY_FAILED, create_booking_with_notify


def _future_payload(**overrides):
    day = date.today() + timedelta(days=1)
    # Weekdays Mon–Thu open 10:45–21:00; 18:00 is always inside for Mon–Sun dinner-ish.
    # Saturday opens 12:00 — 18:00 still fine.
    data = {
        'first_name': 'Anna',
        'last_name': 'Andersson',
        'phone': '+46701234567',
        'email': 'anna@example.com',
        'date': day.isoformat(),
        'time': '18:00',
        'guests': 2,
        'message': 'Fönsterbord',
    }
    data.update(overrides)
    return data


@override_settings(
    TELEGRAM_BOT_TOKEN='test-token',
    TELEGRAM_CHAT_ID='12345',
)
class BookingCreateNotifyTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('bookings.services.send_booking_telegram', return_value=True)
    def test_api_success_when_telegram_ok(self, _mock_tg):
        res = self.client.post('/api/bookings/', _future_payload(), format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data['ok'])
        self.assertTrue(res.data['whatsapp_sent'])
        self.assertIn('id', res.data)
        self.assertEqual(Booking.objects.count(), 1)
        booking = Booking.objects.get()
        self.assertEqual(res.data['id'], booking.pk)
        self.assertFalse(booking.is_test)
        self.assertTrue(booking.whatsapp_sent)

    @patch('bookings.services.send_booking_telegram', return_value=True)
    def test_api_returns_persistent_reference_id(self, _mock_tg):
        res = self.client.post('/api/bookings/', _future_payload(), format='json')
        self.assertEqual(res.status_code, 201)
        ref = res.data['id']
        self.assertIsInstance(ref, int)
        self.assertGreater(ref, 0)
        self.assertTrue(Booking.objects.filter(pk=ref).exists())

    @patch('bookings.services.send_booking_telegram', return_value=False)
    def test_api_rolls_back_when_telegram_fails(self, _mock_tg):
        res = self.client.post('/api/bookings/', _future_payload(), format='json')
        self.assertEqual(res.status_code, 503)
        self.assertFalse(res.data['ok'])
        self.assertEqual(res.data['code'], BOOKING_NOTIFY_FAILED)
        self.assertIn('tekniskt problem', res.data['detail'])
        self.assertIn('Ring restaurangen', res.data['detail'])
        self.assertEqual(Booking.objects.count(), 0)

    @patch('bookings.services.send_booking_telegram', return_value=True)
    def test_service_marks_test_bookings(self, _mock_tg):
        day = date.today() + timedelta(days=1)
        booking, err = create_booking_with_notify(
            {
                'first_name': 'Raffaello',
                'last_name': 'Restaurant',
                'phone': '+46700000000',
                'email': 'booking-test@raffaello.se',
                'date': day,
                'time': time(18, 0),
                'guests': 2,
                'message': 'test 123',
            },
            is_test=True,
        )
        self.assertIsNone(err)
        self.assertTrue(booking.is_test)
        self.assertTrue(booking.whatsapp_sent)


from bookings.management.commands import run_daily_booking_test as _run_daily_booking_test  # noqa: F401


@override_settings(
    TELEGRAM_BOT_TOKEN='test-token',
    TELEGRAM_CHAT_ID='12345',
)
class DailyBookingTestCommandTests(TestCase):
    @patch('bookings.management.commands.run_daily_booking_test.send_telegram_text')
    @patch('bookings.services.send_booking_telegram', return_value=True)
    def test_daily_command_pass_deletes_test_row(self, _mock_tg, mock_status):
        call_command('run_daily_booking_test')
        self.assertEqual(Booking.objects.count(), 0)
        mock_status.assert_called()
        status_text = mock_status.call_args[0][0]
        self.assertIn('PASS', status_text)

    @patch('bookings.management.commands.run_daily_booking_test.send_telegram_text')
    @patch('bookings.services.send_booking_telegram', return_value=False)
    def test_daily_command_fail_on_notify(self, _mock_tg, mock_status):
        with self.assertRaises(CommandError):
            call_command('run_daily_booking_test')
        self.assertEqual(Booking.objects.count(), 0)
        status_text = mock_status.call_args[0][0]
        self.assertIn('FAIL', status_text)
