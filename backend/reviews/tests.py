from django.test import TestCase
from rest_framework.test import APIClient

from .models import CuratedReview


class ReviewsApiP1DTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        CuratedReview.objects.create(
            quote='Draft only',
            author_name='Hidden',
            source='Google',
            rating=5,
            is_published=False,
            order=1,
        )

    def test_empty_when_none_published(self):
        res = self.client.get('/api/reviews/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), [])

    def test_published_review_shape_without_inventing_rating(self):
        CuratedReview.objects.create(
            quote='Bra mat i Boden',
            author_name='Anna',
            source='Google',
            rating=None,
            is_published=True,
            order=0,
        )
        res = self.client.get('/api/reviews/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 1)
        item = data[0]
        self.assertEqual(item['quote'], 'Bra mat i Boden')
        self.assertEqual(item['author_name'], 'Anna')
        self.assertEqual(item['source'], 'Google')
        self.assertIsNone(item['rating'])
