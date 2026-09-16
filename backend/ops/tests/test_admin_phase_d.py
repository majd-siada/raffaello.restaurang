"""Phase D: Admin weekly offer CRUD via /api/admin/offers/ + offer-dishes/."""

from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from rest_framework.test import APIClient

from offers.models import OfferDish, WeeklyOffer, monday_of

User = get_user_model()
ADMIN = '/api/admin'


class AdminOffersPhaseDTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)
        self.staff = User.objects.create_user(
            'offeradmin', password='test-pass-123', is_staff=True, is_superuser=True
        )
        self.viewer = User.objects.create_user(
            'offerviewer', password='test-pass-123', is_staff=True
        )
        self.viewer.user_permissions.add(
            Permission.objects.get(codename='view_weeklyoffer')
        )
        self.guest = User.objects.create_user(
            'offerguest', password='test-pass-123', is_staff=False
        )

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def test_anonymous_list_denied(self):
        res = self.client.get(f'{ADMIN}/offers/')
        self.assertIn(res.status_code, (401, 403))

    def test_non_staff_denied(self):
        self._auth(self.guest)
        res = self.client.get(f'{ADMIN}/offers/')
        self.assertIn(res.status_code, (401, 403))

    def test_viewer_cannot_create(self):
        self._auth(self.viewer)
        res = self.client.post(
            f'{ADMIN}/offers/',
            {'week_start': '2026-09-14', 'intro_text': 'x', 'is_published': False},
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    def test_create_offer_dish_publish_public_and_cleanup(self):
        self._auth(self.staff)
        monday = monday_of(date(2026, 9, 16))  # → 2026-09-14, ISO week 38

        create = self.client.post(
            f'{ADMIN}/offers/',
            {
                'week_start': monday.isoformat(),
                'intro_text': 'Phase D QA intro',
                'is_published': False,
            },
            format='json',
        )
        self.assertEqual(create.status_code, 201, create.content)
        offer_id = create.data['id']
        self.assertEqual(create.data['week_start'], monday.isoformat())
        self.assertFalse(create.data['is_published'])
        obj = WeeklyOffer.objects.get(id=offer_id)
        self.assertEqual(obj.intro_text, 'Phase D QA intro')

        dish = self.client.post(
            f'{ADMIN}/offer-dishes/',
            {
                'offer': offer_id,
                'name': 'Phase D Stek',
                'description': 'qa',
                'price': '149.00',
                'is_available': True,
                'order': 0,
            },
            format='json',
        )
        self.assertEqual(dish.status_code, 201, dish.content)
        dish_id = dish.data['id']
        self.assertEqual(OfferDish.objects.get(id=dish_id).price, Decimal('149.00'))

        with patch('offers.views.timezone.localdate', return_value=monday):
            public_before = self.client.get('/api/offers/')
        self.assertEqual(public_before.status_code, 200)
        self.assertTrue(public_before.data['current'].get('empty'))

        pub = self.client.patch(
            f'{ADMIN}/offers/{offer_id}/',
            {'is_published': True},
            format='json',
        )
        self.assertEqual(pub.status_code, 200)
        obj.refresh_from_db()
        self.assertTrue(obj.is_published)

        with patch('offers.views.timezone.localdate', return_value=monday):
            public_after = self.client.get('/api/offers/')
        self.assertEqual(public_after.status_code, 200)
        current = public_after.data['current']
        self.assertFalse(current.get('empty'))
        self.assertIn('Phase D Stek', str(current))
        self.assertIn('Phase D QA intro', str(current))
        self.assertNotIn('is_published', current)

        hide = self.client.patch(
            f'{ADMIN}/offer-dishes/{dish_id}/',
            {'is_available': False},
            format='json',
        )
        self.assertEqual(hide.status_code, 200)
        with patch('offers.views.timezone.localdate', return_value=monday):
            public_hidden = self.client.get('/api/offers/')
        dish_names = [d['name'] for d in public_hidden.data['current'].get('dishes', [])]
        self.assertNotIn('Phase D Stek', dish_names)

        self.client.delete(f'{ADMIN}/offers/{offer_id}/')
        self.assertFalse(WeeklyOffer.objects.filter(id=offer_id).exists())
        self.assertFalse(OfferDish.objects.filter(id=dish_id).exists())

    def test_unique_year_week_conflict(self):
        from django.db import IntegrityError, transaction

        self._auth(self.staff)
        first = self.client.post(
            f'{ADMIN}/offers/',
            {'week_start': '2026-09-14', 'intro_text': '', 'is_published': True},
            format='json',
        )
        self.assertEqual(first.status_code, 201, first.content)
        # BACKEND GAP: serializer does not validate unique year/week before save;
        # duplicate POST raises IntegrityError (uncaught → 500 in production).
        with transaction.atomic():
            with self.assertRaises(IntegrityError):
                self.client.post(
                    f'{ADMIN}/offers/',
                    {
                        'week_start': '2026-09-16',
                        'intro_text': '',
                        'is_published': True,
                    },
                    format='json',
                )
        self.assertEqual(WeeklyOffer.objects.filter(year=2026, week_number=38).count(), 1)

    def test_csrf_on_offer_create(self):
        staff = User.objects.create_user(
            'offercsrf', password='test-pass-123', is_staff=True, is_superuser=True
        )
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(staff)
        res = client.post(
            f'{ADMIN}/offers/',
            {'week_start': '2026-09-14', 'intro_text': '', 'is_published': False},
            format='json',
        )
        self.assertEqual(res.status_code, 403)
