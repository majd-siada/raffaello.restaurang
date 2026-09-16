"""Tests for canonical restaurant hours / public config API."""

import json
from datetime import time
from pathlib import Path

from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework.test import APIClient

from raffaello.restaurant_data import (
    load_opening_hours_config,
    max_guests_online,
    opening_hours_by_weekday,
    public_restaurant_payload,
)


@override_settings(OPENING_HOURS_SOURCE='json')
class CanonicalHoursTests(SimpleTestCase):
    """JSON-source shape checks; must not hit DB (SimpleTestCase)."""

    def test_weekday_map_covers_full_week(self):
        hours = opening_hours_by_weekday()
        self.assertEqual(set(hours.keys()), set(range(7)))
        self.assertEqual(hours[0], (time(10, 45), time(21, 0)))  # Monday
        self.assertEqual(hours[4], (time(10, 45), time(22, 0)))  # Friday
        self.assertEqual(hours[5], (time(12, 0), time(22, 0)))  # Saturday
        self.assertEqual(hours[6], (time(12, 0), time(21, 0)))  # Sunday

    def test_max_guests(self):
        self.assertEqual(max_guests_online(), 6)

    def test_frontend_json_matches_backend_when_present(self):
        """Keep FE/BE hour files identical in the monorepo checkout."""
        be = Path(__file__).resolve().parent / 'data' / 'opening_hours.json'
        fe = (
            Path(__file__).resolve().parents[2]
            / 'frontend'
            / 'src'
            / 'data'
            / 'openingHours.json'
        )
        self.assertTrue(be.is_file())
        if not fe.is_file():
            self.skipTest('frontend openingHours.json not in this image/checkout')
        with be.open(encoding='utf-8') as a, fe.open(encoding='utf-8') as b:
            self.assertEqual(json.load(a), json.load(b))

    def test_public_payload_shape(self):
        payload = public_restaurant_payload()
        self.assertEqual(payload['max_guests_online'], 6)
        self.assertEqual(len(payload['schedule']), 4)
        self.assertIn('opens', payload['schedule'][0])



class RestaurantConfigAPITests(TestCase):
    def test_get_restaurant_config(self):
        client = APIClient()
        res = client.get('/api/restaurant/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['max_guests_online'], 6)
        self.assertEqual(len(res.data['schedule']), len(load_opening_hours_config()['schedule']))
