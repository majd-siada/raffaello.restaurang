"""Phase F: Admin bookings + events — read-only, PII, permissions, no fake status."""

from datetime import date, time, timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase
from rest_framework.test import APIClient

from bookings.models import Booking
from events.models import EventInquiry

User = get_user_model()
ADMIN = '/api/admin'


class PhaseFBookingsEventsAdminTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)
        self.booking = Booking.objects.create(
            first_name='Ada',
            last_name='Testsson',
            phone='0701234567',
            email='ada@example.com',
            date=date.today() + timedelta(days=3),
            time=time(18, 0),
            guests=2,
            message='Bord vid fönstret',
            whatsapp_sent=True,
            is_test=False,
        )
        self.test_booking = Booking.objects.create(
            first_name='Test',
            last_name='Rad',
            phone='0709999999',
            email='test@example.com',
            date=date.today() + timedelta(days=4),
            time=time(19, 0),
            guests=2,
            is_test=True,
        )
        self.inquiry = EventInquiry.objects.create(
            first_name='Bo',
            last_name='Event',
            phone='0701112233',
            email='bo@example.com',
            preferred_date=date.today() + timedelta(days=14),
            guests=40,
            occasion='Företag',
            message='Privat middag',
            notify_sent=True,
        )

        self.staff = User.objects.create_user(
            'fstaff', password='test-pass-123', is_staff=True, is_superuser=True
        )
        self.viewer = User.objects.create_user(
            'fviewer', password='test-pass-123', is_staff=True
        )
        self.viewer.user_permissions.add(
            Permission.objects.get(codename='view_booking')
        )
        self.viewer.user_permissions.add(
            Permission.objects.get(codename='view_eventinquiry')
        )
        self.menu_only = User.objects.create_user(
            'fmenu', password='test-pass-123', is_staff=True
        )
        self.menu_only.user_permissions.add(
            Permission.objects.get(
                codename='view_menuitem', content_type__app_label='menu'
            )
        )
        self.guest = User.objects.create_user(
            'fguest', password='test-pass-123', is_staff=False
        )

    def tearDown(self):
        Booking.objects.all().delete()
        EventInquiry.objects.all().delete()

    def test_anonymous_bookings_denied(self):
        res = self.client.get(f'{ADMIN}/bookings/')
        self.assertIn(res.status_code, (401, 403))

    def test_non_staff_bookings_denied(self):
        self.client.force_authenticate(user=self.guest)
        res = self.client.get(f'{ADMIN}/bookings/')
        self.assertEqual(res.status_code, 403)

    def test_staff_without_booking_perm_forbidden(self):
        self.client.force_authenticate(user=self.menu_only)
        res = self.client.get(f'{ADMIN}/bookings/')
        self.assertEqual(res.status_code, 403)
        res_ev = self.client.get(f'{ADMIN}/events/')
        self.assertEqual(res_ev.status_code, 403)

    def test_viewer_list_and_detail_includes_pii(self):
        self.client.force_authenticate(user=self.viewer)
        list_res = self.client.get(f'{ADMIN}/bookings/')
        self.assertEqual(list_res.status_code, 200)
        ids = [row['id'] for row in list_res.data['results']]
        self.assertIn(self.booking.id, ids)
        self.assertNotIn(self.test_booking.id, ids)

        detail = self.client.get(f'{ADMIN}/bookings/{self.booking.id}/')
        self.assertEqual(detail.status_code, 200)
        for key in (
            'first_name',
            'last_name',
            'phone',
            'email',
            'message',
            'date',
            'time',
            'guests',
            'whatsapp_sent',
            'is_test',
            'created_at',
        ):
            self.assertIn(key, detail.data)
        self.assertEqual(detail.data['email'], 'ada@example.com')
        self.assertNotIn('status', detail.data)

    def test_search_and_date_filter(self):
        self.client.force_authenticate(user=self.viewer)
        by_q = self.client.get(f'{ADMIN}/bookings/', {'q': 'Ada'})
        self.assertEqual(by_q.status_code, 200)
        self.assertEqual(len(by_q.data['results']), 1)
        by_date = self.client.get(
            f'{ADMIN}/bookings/', {'date': self.booking.date.isoformat()}
        )
        self.assertEqual(by_date.status_code, 200)
        self.assertTrue(
            all(r['date'] == self.booking.date.isoformat() for r in by_date.data['results'])
        )

    def test_include_tests_opt_in(self):
        self.client.force_authenticate(user=self.viewer)
        res = self.client.get(f'{ADMIN}/bookings/', {'include_tests': '1'})
        ids = [row['id'] for row in res.data['results']]
        self.assertIn(self.test_booking.id, ids)

    def test_staff_write_methods_not_allowed(self):
        self.client.force_authenticate(user=self.staff)
        for method in ('post', 'put', 'patch', 'delete'):
            call = getattr(self.client, method)
            res = call(
                f'{ADMIN}/bookings/{self.booking.id}/',
                {'first_name': 'Hacked'},
                format='json',
            )
            self.assertIn(res.status_code, (405, 403), method)

    def test_events_list_detail_search_no_status(self):
        self.client.force_authenticate(user=self.viewer)
        list_res = self.client.get(f'{ADMIN}/events/', {'q': 'Företag'})
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.data['results']), 1)
        detail = self.client.get(f'{ADMIN}/events/{self.inquiry.id}/')
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data['email'], 'bo@example.com')
        self.assertNotIn('status', detail.data)
        self.assertIn('notify_sent', detail.data)

    def test_events_write_not_allowed(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.patch(
            f'{ADMIN}/events/{self.inquiry.id}/',
            {'message': 'x'},
            format='json',
        )
        self.assertIn(res.status_code, (405, 403))

    def test_public_booking_get_not_list_pii(self):
        """Public contract remains POST-create; no staff list on public mount."""
        res = self.client.get('/api/bookings/')
        self.assertIn(res.status_code, (405, 404, 401, 403))

    def test_public_event_get_not_list_pii(self):
        res = self.client.get('/api/events/')
        self.assertIn(res.status_code, (405, 404, 401, 403))
