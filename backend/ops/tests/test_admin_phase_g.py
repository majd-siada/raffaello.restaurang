"""Phase G: Admin gallery + reviews — publish limits, public filter, permissions."""

import tempfile
from io import BytesIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from gallery.models import MAX_PUBLISHED, GalleryPhoto
from reviews.models import CuratedReview

User = get_user_model()
ADMIN = '/api/admin'
_MEDIA = tempfile.mkdtemp(prefix='raffaello_phase_g_')


def _tiny_png():
    buf = BytesIO()
    Image.new('RGB', (8, 8), color=(20, 40, 60)).save(buf, format='PNG')
    return SimpleUploadedFile('t.png', buf.getvalue(), content_type='image/png')


@override_settings(MEDIA_ROOT=_MEDIA)
class PhaseGGalleryReviewsAdminTests(TestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=False)
        self.staff = User.objects.create_user(
            'gstaff', password='test-pass-123', is_staff=True, is_superuser=True
        )
        self.viewer = User.objects.create_user(
            'gviewer', password='test-pass-123', is_staff=True
        )
        self.viewer.user_permissions.add(
            Permission.objects.get(codename='view_galleryphoto')
        )
        self.viewer.user_permissions.add(
            Permission.objects.get(codename='view_curatedreview')
        )
        self.menu_only = User.objects.create_user(
            'gmenu', password='test-pass-123', is_staff=True
        )
        self.menu_only.user_permissions.add(
            Permission.objects.get(
                codename='view_menuitem', content_type__app_label='menu'
            )
        )
        self.guest = User.objects.create_user(
            'gguest', password='test-pass-123', is_staff=False
        )

    def tearDown(self):
        for photo in GalleryPhoto.objects.all():
            if photo.image:
                photo.image.delete(save=False)
            photo.delete()
        CuratedReview.objects.all().delete()

    def test_anonymous_gallery_denied(self):
        res = self.client.get(f'{ADMIN}/gallery/')
        self.assertIn(res.status_code, (401, 403))

    def test_non_staff_denied(self):
        self.client.force_authenticate(user=self.guest)
        self.assertEqual(self.client.get(f'{ADMIN}/gallery/').status_code, 403)
        self.assertEqual(self.client.get(f'{ADMIN}/reviews/').status_code, 403)

    def test_staff_without_perm_forbidden(self):
        self.client.force_authenticate(user=self.menu_only)
        self.assertEqual(self.client.get(f'{ADMIN}/gallery/').status_code, 403)
        self.assertEqual(self.client.get(f'{ADMIN}/reviews/').status_code, 403)

    def test_gallery_upload_unpublished_not_public_then_publish(self):
        self.client.force_authenticate(user=self.staff)
        create = self.client.post(
            f'{ADMIN}/gallery/',
            {
                'image': _tiny_png(),
                'alt_text': 'Phase G test',
                'is_published': False,
                'order': 0,
            },
            format='multipart',
        )
        self.assertEqual(create.status_code, 201, create.content)
        photo_id = create.data['id']
        self.assertFalse(create.data['is_published'])
        self.assertTrue(GalleryPhoto.objects.filter(id=photo_id).exists())

        public = self.client.get('/api/gallery/')
        self.assertEqual(public.status_code, 200)
        self.assertFalse(any(row['id'] == photo_id for row in public.data))

        pub = self.client.patch(
            f'{ADMIN}/gallery/{photo_id}/',
            {'is_published': True},
            format='json',
        )
        self.assertEqual(pub.status_code, 200, pub.content)
        public2 = self.client.get('/api/gallery/')
        self.assertTrue(any(row['id'] == photo_id for row in public2.data))

        unpub = self.client.patch(
            f'{ADMIN}/gallery/{photo_id}/',
            {'is_published': False},
            format='json',
        )
        self.assertEqual(unpub.status_code, 200)
        public3 = self.client.get('/api/gallery/')
        self.assertFalse(any(row['id'] == photo_id for row in public3.data))

        delete = self.client.delete(f'{ADMIN}/gallery/{photo_id}/')
        self.assertEqual(delete.status_code, 204)

    def test_max_published_enforced_server_side(self):
        self.client.force_authenticate(user=self.staff)
        ids = []
        for i in range(MAX_PUBLISHED):
            res = self.client.post(
                f'{ADMIN}/gallery/',
                {
                    'image': _tiny_png(),
                    'alt_text': f'pub-{i}',
                    'is_published': True,
                    'order': i,
                },
                format='multipart',
            )
            self.assertEqual(res.status_code, 201, res.content)
            ids.append(res.data['id'])

        blocked = self.client.post(
            f'{ADMIN}/gallery/',
            {
                'image': _tiny_png(),
                'alt_text': 'overflow',
                'is_published': True,
                'order': 99,
            },
            format='multipart',
        )
        self.assertEqual(blocked.status_code, 400, blocked.content)

        extra = self.client.post(
            f'{ADMIN}/gallery/',
            {
                'image': _tiny_png(),
                'alt_text': 'unpublished-ok',
                'is_published': False,
                'order': 100,
            },
            format='multipart',
        )
        self.assertEqual(extra.status_code, 201, extra.content)
        fail_pub = self.client.patch(
            f'{ADMIN}/gallery/{extra.data["id"]}/',
            {'is_published': True},
            format='json',
        )
        self.assertEqual(fail_pub.status_code, 400)

    def test_viewer_cannot_write_gallery(self):
        self.client.force_authenticate(user=self.viewer)
        res = self.client.post(
            f'{ADMIN}/gallery/',
            {
                'image': _tiny_png(),
                'alt_text': 'nope',
                'is_published': False,
                'order': 0,
            },
            format='multipart',
        )
        self.assertEqual(res.status_code, 403)

    def test_review_create_unpublished_publish_unpublish_delete(self):
        self.client.force_authenticate(user=self.staff)
        create = self.client.post(
            f'{ADMIN}/reviews/',
            {
                'quote': 'Utmärkt pasta',
                'author_name': 'Test Gäst',
                'source': 'Google',
                'rating': 5,
                'is_published': False,
                'order': 0,
            },
            format='json',
        )
        self.assertEqual(create.status_code, 201, create.content)
        rid = create.data['id']

        public = self.client.get('/api/reviews/')
        self.assertFalse(any(row['id'] == rid for row in public.data))

        pub = self.client.patch(
            f'{ADMIN}/reviews/{rid}/',
            {'is_published': True},
            format='json',
        )
        self.assertEqual(pub.status_code, 200)
        public2 = self.client.get('/api/reviews/')
        self.assertTrue(any(row['id'] == rid for row in public2.data))

        unpub = self.client.patch(
            f'{ADMIN}/reviews/{rid}/',
            {'is_published': False},
            format='json',
        )
        self.assertEqual(unpub.status_code, 200)
        public3 = self.client.get('/api/reviews/')
        self.assertFalse(any(row['id'] == rid for row in public3.data))

        delete = self.client.delete(f'{ADMIN}/reviews/{rid}/')
        self.assertEqual(delete.status_code, 204)

    def test_review_requires_source(self):
        self.client.force_authenticate(user=self.staff)
        res = self.client.post(
            f'{ADMIN}/reviews/',
            {
                'quote': 'Hej',
                'author_name': 'A',
                'source': '',
                'is_published': False,
            },
            format='json',
        )
        self.assertEqual(res.status_code, 400)
