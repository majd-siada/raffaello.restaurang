from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class OpsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)
        self.staff = User.objects.create_user(
            'opsstaff', password='test-pass-123', is_staff=True
        )
        self.guest = User.objects.create_user(
            'opsguest', password='test-pass-123', is_staff=False
        )

    def test_csrf_sets_cookie(self):
        res = self.client.get('/api/ops/auth/csrf/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('csrftoken', res.cookies)

    def test_login_staff_ok(self):
        res = self.client.post(
            '/api/ops/auth/login/',
            {'username': 'opsstaff', 'password': 'test-pass-123'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['authenticated'])

    def test_login_rejects_non_staff(self):
        res = self.client.post(
            '/api/ops/auth/login/',
            {'username': 'opsguest', 'password': 'test-pass-123'},
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    def test_overview_requires_auth(self):
        res = self.client.get('/api/ops/overview/')
        self.assertIn(res.status_code, (401, 403))

    def test_overview_staff_ok(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.get('/api/ops/overview/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('today', res.data)
        self.assertIn('attention', res.data)
        self.assertIn('matochmat', res.data)

    def test_me_anonymous(self):
        res = self.client.get('/api/ops/auth/me/')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data['authenticated'])


class OpsMenuPermTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.editor = User.objects.create_user(
            'menueditor', password='test-pass-123', is_staff=True
        )
        # Grant view menu only
        for codename in ('view_menuitem', 'view_category'):
            perm = Permission.objects.get(codename=codename, content_type__app_label='menu')
            self.editor.user_permissions.add(perm)

    def test_menu_list_with_view_perm(self):
        self.client.force_authenticate(user=self.editor)
        res = self.client.get('/api/ops/menu/items/')
        self.assertEqual(res.status_code, 200)

    def test_bookings_denied_without_perm(self):
        self.client.force_authenticate(user=self.editor)
        res = self.client.get('/api/ops/bookings/')
        self.assertEqual(res.status_code, 403)
