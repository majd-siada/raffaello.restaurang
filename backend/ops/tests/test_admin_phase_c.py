"""Phase C: Admin lunch read / sync / override via /api/admin/lunch/*."""

from datetime import datetime
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from lunch.matochmat import FetchResult
from lunch.models import (
    IMPORT_STATUS_FETCH_FAILED,
    IMPORT_STATUS_PUBLISHED,
    IMPORT_STATUS_SKIPPED_OVERRIDE,
    IMPORT_STATUS_UNCHANGED,
    LunchDish,
    LunchWeek,
)
from lunch.services import sync_from_matochmat

User = get_user_model()

ADMIN = '/api/admin'
FIXTURES = Path(__file__).resolve().parents[2] / 'lunch' / 'fixtures'
MINIMAL_HTML = (FIXTURES / 'matochmat_page_minimal.html').read_text(encoding='utf-8')
STOCKHOLM_MON = datetime(2026, 9, 14, 12, 0, tzinfo=ZoneInfo('Europe/Stockholm'))
SOURCE_URL = 'https://www.matochmat.se/restauranger/boden/lunch/raffaello-stekhus-bar/'


@override_settings(MATOCHMAT_LUNCH_URL=SOURCE_URL)
class AdminLunchPhaseCTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)
        self.staff = User.objects.create_user(
            'lunchadmin', password='test-pass-123', is_staff=True, is_superuser=True
        )
        self.viewer = User.objects.create_user(
            'lunchviewer', password='test-pass-123', is_staff=True
        )
        view_perm = Permission.objects.get(codename='view_lunchweek')
        self.viewer.user_permissions.add(view_perm)
        self.guest = User.objects.create_user(
            'lunchguest', password='test-pass-123', is_staff=False
        )

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def test_anonymous_current_denied(self):
        res = self.client.get(f'{ADMIN}/lunch/current/')
        self.assertIn(res.status_code, (401, 403))

    def test_non_staff_current_denied(self):
        self._auth(self.guest)
        res = self.client.get(f'{ADMIN}/lunch/current/')
        self.assertIn(res.status_code, (401, 403))

    def test_staff_without_change_cannot_sync(self):
        self._auth(self.viewer)
        res = self.client.post(f'{ADMIN}/lunch/sync/')
        self.assertEqual(res.status_code, 403)

    def test_current_and_weeks_and_import_runs(self):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        self._auth(self.staff)
        with patch('django.utils.timezone.localdate', return_value=STOCKHOLM_MON.date()):
            cur = self.client.get(f'{ADMIN}/lunch/current/')
        self.assertEqual(cur.status_code, 200)
        self.assertFalse(cur.data.get('empty'))
        self.assertEqual(cur.data['week_number'], 38)
        self.assertIn('source_hash', cur.data)
        self.assertIn('skip_auto_sync', cur.data)
        self.assertIn('dishes', cur.data)
        self.assertTrue(len(cur.data['dishes']) > 0)

        weeks = self.client.get(f'{ADMIN}/lunch/weeks/')
        self.assertEqual(weeks.status_code, 200)
        results = weeks.data if isinstance(weeks.data, list) else weeks.data.get('results', [])
        self.assertTrue(len(results) >= 1)

        runs = self.client.get(f'{ADMIN}/lunch/import-runs/')
        self.assertEqual(runs.status_code, 200)
        run_rows = runs.data.get('results', runs.data)
        if not isinstance(run_rows, list):
            run_rows = []
        self.assertTrue(len(run_rows) >= 1)
        self.assertIn(run_rows[0]['status'], (
            IMPORT_STATUS_PUBLISHED,
            IMPORT_STATUS_UNCHANGED,
        ))

    def test_sync_published_then_unchanged(self):
        self._auth(self.staff)
        with patch('lunch.services.stockholm_today', return_value=STOCKHOLM_MON.date()):
            with patch('lunch.services.fetch_html') as mock_fetch:
                mock_fetch.return_value = FetchResult(
                    ok=True, html=MINIMAL_HTML, url=SOURCE_URL, status_code=200
                )
                first = self.client.post(f'{ADMIN}/lunch/sync/')
                second = self.client.post(f'{ADMIN}/lunch/sync/')
        self.assertEqual(first.status_code, 200)
        self.assertTrue(first.data.get('ok'))
        self.assertEqual(first.data['result']['status'], IMPORT_STATUS_PUBLISHED)
        self.assertEqual(second.data['result']['status'], IMPORT_STATUS_UNCHANGED)
        self.assertEqual(
            LunchWeek.objects.filter(year=2026, week_number=38).count(), 1
        )

    def test_sync_fetch_failure_preserves_week(self):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        count = LunchDish.objects.count()
        self._auth(self.staff)
        with patch('lunch.services.stockholm_today', return_value=STOCKHOLM_MON.date()):
            with patch('lunch.services.fetch_html') as mock_fetch:
                mock_fetch.return_value = FetchResult(
                    ok=False, error='Network error: timeout', url=SOURCE_URL
                )
                res = self.client.post(f'{ADMIN}/lunch/sync/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['result']['status'], IMPORT_STATUS_FETCH_FAILED)
        self.assertEqual(LunchDish.objects.count(), count)

    def test_manual_override_via_admin_patch_protects_sync(self):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        week = LunchWeek.objects.get(year=2026, week_number=38)
        self._auth(self.staff)

        patch_res = self.client.patch(
            f'{ADMIN}/lunch/weeks/{week.id}/',
            {
                'skip_auto_sync': True,
                'notes': 'Admin Phase C override note',
                'lunch_hours_text': '11:00–14:00',
            },
            format='json',
        )
        self.assertEqual(patch_res.status_code, 200, patch_res.content)
        week.refresh_from_db()
        self.assertTrue(week.skip_auto_sync)
        self.assertEqual(week.notes, 'Admin Phase C override note')

        LunchDish.objects.filter(lunch_week=week).update(name='MANUAL ONLY')

        with patch('lunch.services.stockholm_today', return_value=STOCKHOLM_MON.date()):
            with patch('lunch.services.fetch_html') as mock_fetch:
                mock_fetch.return_value = FetchResult(
                    ok=True, html=MINIMAL_HTML, url=SOURCE_URL, status_code=200
                )
                sync_res = self.client.post(f'{ADMIN}/lunch/sync/')
        self.assertEqual(sync_res.data['result']['status'], IMPORT_STATUS_SKIPPED_OVERRIDE)
        self.assertTrue(LunchDish.objects.filter(name='MANUAL ONLY').exists())
        self.assertFalse(LunchDish.objects.filter(name='Lövstek150g').exists())

        # Restore AUTO via Admin. Clearing override alone does not rewrite dishes when
        # MoM hash still matches (UNCHANGED). Force hash miss so MoM re-applies.
        clear = self.client.patch(
            f'{ADMIN}/lunch/weeks/{week.id}/',
            {'skip_auto_sync': False},
            format='json',
        )
        self.assertEqual(clear.status_code, 200)
        week.refresh_from_db()
        self.assertFalse(week.skip_auto_sync)
        week.source_hash = 'force-hash-miss'
        week.save(update_fields=['source_hash'])

        with patch('lunch.services.stockholm_today', return_value=STOCKHOLM_MON.date()):
            with patch('lunch.services.fetch_html') as mock_fetch:
                mock_fetch.return_value = FetchResult(
                    ok=True, html=MINIMAL_HTML, url=SOURCE_URL, status_code=200
                )
                resume = self.client.post(f'{ADMIN}/lunch/sync/')
        self.assertEqual(resume.data['result']['status'], IMPORT_STATUS_PUBLISHED)
        self.assertFalse(LunchDish.objects.filter(name='MANUAL ONLY').exists())
        self.assertTrue(LunchDish.objects.filter(name='Lövstek150g').exists())

    def test_public_lunch_contract_unchanged_shape(self):
        sync_from_matochmat(html=MINIMAL_HTML, now=STOCKHOLM_MON, notify=False)
        with patch('django.utils.timezone.localdate', return_value=STOCKHOLM_MON.date()):
            res = self.client.get('/api/lunch/')
        self.assertEqual(res.status_code, 200)
        for key in (
            'year',
            'week_number',
            'week_start',
            'dishes',
            'source_type',
            'source_url',
            'lunch_hours_text',
        ):
            self.assertIn(key, res.data)
        self.assertNotIn('skip_auto_sync', res.data)
        self.assertNotIn('source_hash', res.data)

    def test_csrf_required_on_sync_write(self):
        staff = User.objects.create_user(
            'lunchcsrf', password='test-pass-123', is_staff=True, is_superuser=True
        )
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(staff)
        res = client.post(f'{ADMIN}/lunch/sync/')
        self.assertEqual(res.status_code, 403)
