from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from events.models import EventInquiry
from events.services import EVENT_NOTIFY_FAILED, create_event_inquiry_with_notify


def _payload(**overrides):
    data = {
        'first_name': 'Anna',
        'last_name': 'Andersson',
        'phone': '+46701234567',
        'email': 'anna@example.com',
        'preferred_date': '2026-10-01',
        'guests': 20,
        'occasion': 'Firmafest',
        'message': 'P1 test inquiry',
    }
    data.update(overrides)
    return data


class EventInquiryApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('events.services.notify_restaurant', return_value=True)
    def test_create_returns_id(self, _mock):
        res = self.client.post('/api/events/', _payload(), format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data['ok'])
        self.assertIn('id', res.data)
        self.assertTrue(EventInquiry.objects.filter(pk=res.data['id']).exists())

    @patch('events.services.notify_restaurant', return_value=False)
    def test_notify_fail_rolls_back(self, _mock):
        res = self.client.post('/api/events/', _payload(), format='json')
        self.assertEqual(res.status_code, 503)
        self.assertEqual(res.data['code'], EVENT_NOTIFY_FAILED)
        self.assertEqual(EventInquiry.objects.count(), 0)

    def test_past_date_rejected(self):
        res = self.client.post(
            '/api/events/',
            _payload(preferred_date='2020-01-01'),
            format='json',
        )
        self.assertEqual(res.status_code, 400)

    def test_phone_required(self):
        res = self.client.post('/api/events/', _payload(phone='12'), format='json')
        self.assertEqual(res.status_code, 400)

    @patch('events.services.notify_restaurant', return_value=True)
    def test_optional_fields_ok(self, _mock):
        res = self.client.post(
            '/api/events/',
            {
                'first_name': 'Bo',
                'last_name': 'Berg',
                'phone': '0701234567',
                'email': 'bo@example.com',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201)

    @patch('events.services.notify_restaurant', return_value=True)
    def test_service_marks_notify(self, _mock):
        inquiry, err = create_event_inquiry_with_notify(
            {
                'first_name': 'Cia',
                'last_name': 'Carlsson',
                'phone': '0701234567',
                'email': 'cia@example.com',
                'message': 'Hej',
            }
        )
        self.assertIsNone(err)
        self.assertTrue(inquiry.notify_sent)
