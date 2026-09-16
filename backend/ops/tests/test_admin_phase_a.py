from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()

ADMIN_BASE = '/api/admin'
OPS_BASE = '/api/ops'


class AdminApiDualMountTests(TestCase):
    """Phase A: /api/admin and /api/ops share the same handlers."""

    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)
        self.staff = User.objects.create_user(
            'adminstaff', password='test-pass-123', is_staff=True
        )
        self.guest = User.objects.create_user(
            'adminguest', password='test-pass-123', is_staff=False
        )

    def test_admin_csrf_sets_cookie(self):
        res = self.client.get(f'{ADMIN_BASE}/auth/csrf/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('csrftoken', res.cookies)

    def test_admin_login_staff_ok(self):
        res = self.client.post(
            f'{ADMIN_BASE}/auth/login/',
            {'username': 'adminstaff', 'password': 'test-pass-123'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['authenticated'])

    def test_admin_login_rejects_non_staff(self):
        res = self.client.post(
            f'{ADMIN_BASE}/auth/login/',
            {'username': 'adminguest', 'password': 'test-pass-123'},
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_overview_anonymous_denied(self):
        res = self.client.get(f'{ADMIN_BASE}/overview/')
        self.assertIn(res.status_code, (401, 403))

    def test_admin_overview_staff_ok(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.get(f'{ADMIN_BASE}/overview/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('today', res.data)
        self.assertIn('today_bookings', res.data)
        self.assertIn('guests_today', res.data['today'])
        self.assertIn('upcoming_count', res.data['today'])
        self.assertIn('attention', res.data)
        # Empty current offer must not appear as an attention alarm
        codes = {a.get('code') for a in res.data.get('attention') or []}
        self.assertNotIn('offer_empty', codes)

    def test_admin_and_ops_overview_equivalent(self):
        self.client.force_authenticate(user=self.staff)
        admin_res = self.client.get(f'{ADMIN_BASE}/overview/')
        ops_res = self.client.get(f'{OPS_BASE}/overview/')
        self.assertEqual(admin_res.status_code, 200)
        self.assertEqual(ops_res.status_code, 200)
        self.assertEqual(admin_res.data.keys(), ops_res.data.keys())

    def test_admin_me_anonymous(self):
        res = self.client.get(f'{ADMIN_BASE}/auth/me/')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data['authenticated'])


class AdminApiCsrfTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            'admincsrf', password='test-pass-123', is_staff=True
        )

    def test_admin_login_without_csrf_forbidden(self):
        client = APIClient(enforce_csrf_checks=True)
        res = client.post(
            f'{ADMIN_BASE}/auth/login/',
            {'username': 'admincsrf', 'password': 'test-pass-123'},
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_login_with_csrf_ok(self):
        client = APIClient(enforce_csrf_checks=True)
        client.get(f'{ADMIN_BASE}/auth/csrf/')
        token = client.cookies.get('csrftoken').value
        res = client.post(
            f'{ADMIN_BASE}/auth/login/',
            {'username': 'admincsrf', 'password': 'test-pass-123'},
            format='json',
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertTrue(res.data['authenticated'])


class AdminApiPermTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.editor = User.objects.create_user(
            'admineditor', password='test-pass-123', is_staff=True
        )
        for codename in ('view_menuitem', 'view_category'):
            perm = Permission.objects.get(
                codename=codename, content_type__app_label='menu'
            )
            self.editor.user_permissions.add(perm)

    def test_admin_menu_list_with_view_perm(self):
        self.client.force_authenticate(user=self.editor)
        res = self.client.get(f'{ADMIN_BASE}/menu/items/')
        self.assertEqual(res.status_code, 200)

    def test_admin_bookings_denied_without_perm(self):
        self.client.force_authenticate(user=self.editor)
        res = self.client.get(f'{ADMIN_BASE}/bookings/')
        self.assertEqual(res.status_code, 403)


class DjangoAdminPathPreparedTests(TestCase):
    def test_django_admin_login_reachable(self):
        res = self.client.get('/django-admin/login/')
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'id_username', res.content)
        self.assertIn(b'login-form', res.content)
        # Served by Django, not React Admin SPA
        self.assertIn(b'/static/admin/', res.content)

    def test_django_no_longer_serves_react_admin_path(self):
        """After cutover, Django mounts classic Admin only at /django-admin/."""
        res = self.client.get('/admin/login/')
        self.assertEqual(res.status_code, 404)
