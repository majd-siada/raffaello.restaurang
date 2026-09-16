"""Phase H: FAQ + Legal CMS — permissions, publish, public flag, no invented content."""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from content.models import FaqItem, LegalPage

User = get_user_model()
ADMIN = '/api/admin'


class PhaseHFaqLegalTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)
        self.staff = User.objects.create_user(
            'hstaff', password='test-pass-123', is_staff=True, is_superuser=True
        )
        self.viewer = User.objects.create_user(
            'hviewer', password='test-pass-123', is_staff=True
        )
        self.viewer.user_permissions.add(
            Permission.objects.get(codename='view_faqitem')
        )
        self.viewer.user_permissions.add(
            Permission.objects.get(codename='view_legalpage')
        )
        self.menu_only = User.objects.create_user(
            'hmenu', password='test-pass-123', is_staff=True
        )
        self.menu_only.user_permissions.add(
            Permission.objects.get(
                codename='view_menuitem', content_type__app_label='menu'
            )
        )
        # Migration seeds unpublished legal shells
        self.assertTrue(LegalPage.objects.filter(key='bokningsvillkor').exists())
        self.assertTrue(LegalPage.objects.filter(key='integritet').exists())

    def tearDown(self):
        FaqItem.objects.all().delete()
        LegalPage.objects.filter(is_published=True).update(
            is_published=False, body=''
        )

    def test_anonymous_staff_api_denied(self):
        self.assertIn(self.client.get(f'{ADMIN}/faq/').status_code, (401, 403))
        self.assertIn(self.client.get(f'{ADMIN}/legal/').status_code, (401, 403))

    def test_menu_only_forbidden(self):
        self.client.force_authenticate(user=self.menu_only)
        self.assertEqual(self.client.get(f'{ADMIN}/faq/').status_code, 403)
        self.assertEqual(self.client.get(f'{ADMIN}/legal/').status_code, 403)

    def test_viewer_cannot_write(self):
        self.client.force_authenticate(user=self.viewer)
        res = self.client.post(
            f'{ADMIN}/faq/',
            {
                'question': 'Q?',
                'answer': 'A',
                'order': 0,
                'is_published': False,
            },
            format='json',
        )
        self.assertEqual(res.status_code, 403)

    @override_settings(TRUST_CONTENT_SOURCE='frontend')
    def test_published_faq_public_even_when_trust_frontend(self):
        """FAQ CMS is independent of TRUST_CONTENT_SOURCE (legal stays gated)."""
        self.client.force_authenticate(user=self.staff)
        self.client.post(
            f'{ADMIN}/faq/',
            {
                'question': 'Öppettider?',
                'answer': 'Se sajten.',
                'order': 0,
                'is_published': True,
            },
            format='json',
        )
        public = self.client.get('/api/faq/')
        self.assertEqual(public.status_code, 200)
        self.assertEqual(len(public.data), 1)
        self.assertEqual(public.data[0]['question'], 'Öppettider?')

    def test_faq_publish_unpublish(self):
        self.client.force_authenticate(user=self.staff)
        create = self.client.post(
            f'{ADMIN}/faq/',
            {
                'question': 'Kan man boka?',
                'answer': 'Ja via /boka.',
                'order': 1,
                'is_published': False,
            },
            format='json',
        )
        self.assertEqual(create.status_code, 201, create.content)
        fid = create.data['id']
        self.assertEqual(self.client.get('/api/faq/').data, [])

        pub = self.client.patch(
            f'{ADMIN}/faq/{fid}/',
            {'is_published': True},
            format='json',
        )
        self.assertEqual(pub.status_code, 200)
        public = self.client.get('/api/faq/')
        self.assertEqual(len(public.data), 1)
        self.assertEqual(public.data[0]['question'], 'Kan man boka?')

        self.client.patch(
            f'{ADMIN}/faq/{fid}/',
            {'is_published': False},
            format='json',
        )
        self.assertEqual(self.client.get('/api/faq/').data, [])

        delete = self.client.delete(f'{ADMIN}/faq/{fid}/')
        self.assertEqual(delete.status_code, 204)

    @override_settings(TRUST_CONTENT_SOURCE='db')
    def test_legal_cannot_publish_empty_body(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.patch(
            f'{ADMIN}/legal/bokningsvillkor/',
            {'is_published': True, 'body': ''},
            format='json',
        )
        self.assertEqual(res.status_code, 400)

    @override_settings(TRUST_CONTENT_SOURCE='db')
    def test_legal_publish_public_and_unpublish(self):
        self.client.force_authenticate(user=self.staff)
        ok = self.client.patch(
            f'{ADMIN}/legal/integritet/',
            {
                'title': 'Integritetspolicy',
                'body': 'Stycke ett.\n\nStycke två.',
                'is_published': True,
            },
            format='json',
        )
        self.assertEqual(ok.status_code, 200, ok.content)
        public = self.client.get('/api/legal/integritet/')
        self.assertEqual(public.status_code, 200)
        self.assertEqual(len(public.data['paragraphs']), 2)

        self.client.patch(
            f'{ADMIN}/legal/integritet/',
            {'is_published': False},
            format='json',
        )
        self.assertEqual(
            self.client.get('/api/legal/integritet/').status_code, 404
        )

    @override_settings(TRUST_CONTENT_SOURCE='frontend')
    def test_frontend_mode_legal_404(self):
        LegalPage.objects.filter(key='integritet').update(
            body='Hemlig text', is_published=True
        )
        self.assertEqual(
            self.client.get('/api/legal/integritet/').status_code, 404
        )

    def test_faq_requires_question_answer(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.post(
            f'{ADMIN}/faq/',
            {'question': '', 'answer': '', 'is_published': False},
            format='json',
        )
        self.assertEqual(res.status_code, 400)
