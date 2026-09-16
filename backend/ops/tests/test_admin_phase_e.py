"""Phase E: opening hours SoT — JSON vs DB feature flag, seed, Admin API."""

from datetime import time

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from raffaello.restaurant_data import (
    detect_hours_drift,
    normalize_public_payload,
    public_restaurant_payload,
    seed_days_from_json_config,
)
from restaurant.models import OpeningHoursDay, OpeningHoursSettings

User = get_user_model()
ADMIN = '/api/admin'


class OpeningHoursSoTTests(TestCase):
    def setUp(self):
        seed_days_from_json_config()

    @override_settings(OPENING_HOURS_SOURCE='json')
    def test_json_mode_public_payload(self):
        payload = public_restaurant_payload()
        self.assertEqual(payload['max_guests_online'], 6)
        self.assertEqual(len(payload['schedule']), 4)
        self.assertEqual(payload['schedule'][0]['label'], 'Mån–tors')
        self.assertEqual(payload['schedule'][0]['opens'], '10:45')

    @override_settings(OPENING_HOURS_SOURCE='db')
    def test_db_mode_matches_json_after_seed(self):
        with override_settings(OPENING_HOURS_SOURCE='json'):
            json_payload = normalize_public_payload(public_restaurant_payload())
        db_payload = normalize_public_payload(public_restaurant_payload())
        self.assertEqual(json_payload, db_payload)

    def test_drift_match_after_seed(self):
        result = detect_hours_drift()
        self.assertTrue(result['match'], result)
        self.assertEqual(result['status'], 'MATCH')

    @override_settings(OPENING_HOURS_SOURCE='db')
    def test_db_edit_changes_public_and_creates_drift(self):
        day = OpeningHoursDay.objects.get(weekday=0)
        day.opens = time(11, 0)
        day.save()
        drift = detect_hours_drift()
        self.assertFalse(drift['match'])
        self.assertEqual(drift['status'], 'DRIFT')
        payload = public_restaurant_payload()
        # Monday in Mån–tors group — opens becomes 11:00 for whole group only if all same;
        # we only changed Monday → group splits
        opens = {row['opens'] for row in payload['schedule']}
        self.assertIn('11:00', opens)


class OpeningHoursAdminApiTests(TestCase):
    def setUp(self):
        seed_days_from_json_config()
        self.client = APIClient(enforce_csrf_checks=False)
        self.staff = User.objects.create_user(
            'hoursadmin', password='test-pass-123', is_staff=True, is_superuser=True
        )
        self.viewer = User.objects.create_user(
            'hoursviewer', password='test-pass-123', is_staff=True
        )
        self.viewer.user_permissions.add(
            Permission.objects.get(codename='view_openinghoursday')
        )
        self.guest = User.objects.create_user(
            'hoursguest', password='test-pass-123', is_staff=False
        )

    def test_anonymous_denied(self):
        res = self.client.get(f'{ADMIN}/restaurant/hours/')
        self.assertIn(res.status_code, (401, 403))

    def test_viewer_cannot_write(self):
        self.client.force_authenticate(user=self.viewer)
        res = self.client.put(
            f'{ADMIN}/restaurant/hours/',
            {'days': [{'weekday': 0, 'opens': '10:00', 'closes': '20:00', 'is_closed': False}]},
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    def test_staff_read_and_write_validation(self):
        self.client.force_authenticate(user=self.staff)
        get_res = self.client.get(f'{ADMIN}/restaurant/hours/')
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(len(get_res.data['days']), 7)
        self.assertEqual(get_res.data['drift']['status'], 'MATCH')

        days = get_res.data['days']
        # Invalid: close before open
        bad = [
            {
                **{k: d[k] for k in ('weekday', 'opens', 'closes', 'is_closed')},
            }
            for d in days
        ]
        bad[0]['opens'] = '20:00'
        bad[0]['closes'] = '10:00'
        bad[0]['is_closed'] = False
        bad_res = self.client.put(
            f'{ADMIN}/restaurant/hours/',
            {'days': bad},
            format='json',
        )
        self.assertEqual(bad_res.status_code, 400)

        # Valid closed Sunday
        good = [
            {
                'weekday': d['weekday'],
                'opens': d['opens'],
                'closes': d['closes'],
                'is_closed': d['is_closed'],
            }
            for d in days
        ]
        good[6] = {
            'weekday': 6,
            'opens': '',
            'closes': '',
            'is_closed': True,
        }
        ok = self.client.put(
            f'{ADMIN}/restaurant/hours/',
            {'days': good},
            format='json',
        )
        self.assertEqual(ok.status_code, 200, ok.content)
        sun = OpeningHoursDay.objects.get(weekday=6)
        self.assertTrue(sun.is_closed)

        # Restore seed
        seed_days_from_json_config()
        self.assertFalse(OpeningHoursDay.objects.get(weekday=6).is_closed)

    @override_settings(OPENING_HOURS_SOURCE='json')
    def test_public_api_unchanged_shape(self):
        res = self.client.get('/api/restaurant/')
        self.assertEqual(res.status_code, 200)
        for key in ('timezone', 'max_guests_online', 'slot_interval_minutes', 'schedule'):
            self.assertIn(key, res.data)

    @override_settings(OPENING_HOURS_SOURCE='db')
    def test_public_api_db_mode_shape(self):
        res = self.client.get('/api/restaurant/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['schedule'][0]['opens'], '10:45')
