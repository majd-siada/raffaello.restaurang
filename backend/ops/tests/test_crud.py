from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from rest_framework.test import APIClient

from menu.models import Category, MenuItem
from reviews.models import CuratedReview

User = get_user_model()


class OpsCrudPersistenceTests(TestCase):
    """Prove ops PATCH persists to DB and surfaces on public menu API."""

    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create_user(
            'crudstaff', password='test-pass-123', is_staff=True, is_superuser=True
        )
        self.client.force_authenticate(user=self.staff)
        self.category = Category.objects.create(name='Ops QA Cat', order=999)
        self.item = MenuItem.objects.create(
            category=self.category,
            name='Ops QA Item Original',
            description='before',
            price=Decimal('100.00'),
            is_available=True,
            is_featured=False,
            allergens='gluten',
            tags='test',
            order=999,
        )

    def tearDown(self):
        MenuItem.objects.filter(id=self.item.id).delete()
        Category.objects.filter(id=self.category.id).delete()

    def test_menu_patch_persists_and_public_api_reflects(self):
        res = self.client.patch(
            f'/api/ops/menu/items/{self.item.id}/',
            {
                'name': 'Ops QA Item Updated',
                'description': 'after-persist',
                'price': '123.50',
                'is_featured': True,
                'allergens': 'mjolk,gluten',
                'tags': 'ops,qa',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.item.refresh_from_db()
        self.assertEqual(self.item.name, 'Ops QA Item Updated')
        self.assertEqual(self.item.description, 'after-persist')
        self.assertEqual(self.item.price, Decimal('123.50'))
        self.assertTrue(self.item.is_featured)

        public = self.client.get('/api/menu/')
        self.assertEqual(public.status_code, 200)
        blob = str(public.data)
        self.assertIn('Ops QA Item Updated', blob)
        self.assertIn('after-persist', blob)

    def test_admin_menu_create_and_availability_via_admin_mount(self):
        """Phase B: /api/admin menu create + is_available persists; public FE filters unavailable."""
        res = self.client.post(
            '/api/admin/menu/items/',
            {
                'category': self.category.id,
                'name': 'Admin Phase B Item',
                'description': 'phase-b',
                'price': '139.00',
                'is_available': False,
                'is_featured': False,
                'allergens': '',
                'tags': 'admin,qa',
                'order': 50,
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.content)
        item_id = res.data['id']
        obj = MenuItem.objects.get(id=item_id)
        self.assertEqual(obj.price, Decimal('139.00'))
        self.assertFalse(obj.is_available)

        # Public API still returns the row (contract); FE hides via is_available.
        public = self.client.get('/api/menu/')
        self.assertEqual(public.status_code, 200)
        blob = str(public.data)
        self.assertIn('Admin Phase B Item', blob)

        # Restore path: make available then delete test row
        patch = self.client.patch(
            f'/api/admin/menu/items/{item_id}/',
            {'is_available': True, 'price': '139.00'},
            format='json',
        )
        self.assertEqual(patch.status_code, 200, patch.content)
        obj.refresh_from_db()
        self.assertTrue(obj.is_available)
        MenuItem.objects.filter(id=item_id).delete()

    def test_review_create_unpublished_not_on_public_list(self):
        res = self.client.post(
            '/api/ops/reviews/',
            {
                'quote': 'Ops QA citat — ej publicerat',
                'author_name': 'QA',
                'source': 'Test',
                'is_published': False,
                'order': 999,
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201, res.content)
        rid = res.data['id']
        public = self.client.get('/api/reviews/')
        self.assertEqual(public.status_code, 200)
        quotes = [r.get('quote') for r in public.data]
        self.assertNotIn('Ops QA citat — ej publicerat', quotes)
        CuratedReview.objects.filter(id=rid).delete()


class OpsLunchCurrentTests(TestCase):
    """Regression: lunch/current must serialize dishes (field lunch_week, not week)."""

    def setUp(self):
        from datetime import date
        from lunch.models import LunchDish, LunchWeek, monday_of

        self.client = APIClient()
        self.staff = User.objects.create_user(
            'lunchstaff', password='test-pass-123', is_staff=True, is_superuser=True
        )
        self.client.force_authenticate(user=self.staff)
        monday = monday_of(date.today())
        self.week = LunchWeek.objects.create(week_start=monday, intro_text='ops')
        LunchDish.objects.create(
            lunch_week=self.week,
            name='Ops Lunch Dish',
            description='d',
            price=None,
            order=1,
        )

    def test_lunch_current_serializes_with_dishes(self):
        res = self.client.get('/api/ops/lunch/current/')
        self.assertEqual(res.status_code, 200, res.content)
        self.assertFalse(res.data.get('empty'))
        self.assertGreaterEqual(len(res.data.get('dishes') or []), 1)
        dish = res.data['dishes'][0]
        self.assertEqual(dish['name'], 'Ops Lunch Dish')
        self.assertEqual(dish['lunch_week'], self.week.id)


class OpsCsrfTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            'csrfstaff', password='test-pass-123', is_staff=True
        )

    def test_login_without_csrf_forbidden_when_enforced(self):
        client = APIClient(enforce_csrf_checks=True)
        res = client.post(
            '/api/ops/auth/login/',
            {'username': 'csrfstaff', 'password': 'test-pass-123'},
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    def test_login_with_csrf_ok(self):
        client = APIClient(enforce_csrf_checks=True)
        client.get('/api/ops/auth/csrf/')
        token = client.cookies.get('csrftoken').value
        res = client.post(
            '/api/ops/auth/login/',
            {'username': 'csrfstaff', 'password': 'test-pass-123'},
            format='json',
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertTrue(res.data['authenticated'])


class OpsSystemSecretsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create_user(
            'sysstaff', password='test-pass-123', is_staff=True
        )
        self.client.force_authenticate(user=self.staff)

    def test_system_payload_has_no_secret_keys(self):
        res = self.client.get('/api/ops/system/')
        self.assertEqual(res.status_code, 200)
        raw = str(res.data).lower()
        for banned in (
            'bot_token',
            'password',
            'secret_key',
            'telegram_bot_token',
            'mailjet_api',
            'api_secret',
        ):
            self.assertNotIn(banned, raw)
        self.assertIn('telegram_configured', res.data)
        self.assertIn('email_configured', res.data)
