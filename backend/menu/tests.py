from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Category, MenuItem


class MenuApiP1CTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = Category.objects.create(name='Grill', order=1)
        self.plain = MenuItem.objects.create(
            category=self.cat,
            name='Entrecôte',
            description='Grillad',
            price='289.00',
            order=1,
        )
        self.rich = MenuItem.objects.create(
            category=self.cat,
            name='Oxfilé',
            description='Serveras med potatis',
            price='349.00',
            order=2,
            allergens='mjölk, gluten',
            tags='Signature, Populär',
            is_featured=True,
            image=SimpleUploadedFile(
                'oxfile.jpg',
                b'\xff\xd8\xff\xe0' + b'\x00' * 32,
                content_type='image/jpeg',
            ),
        )

    def test_menu_api_exposes_richness_fields_without_inventing(self):
        res = self.client.get('/api/menu/')
        self.assertEqual(res.status_code, 200)
        payload = res.json()
        self.assertEqual(len(payload), 1)
        items = {i['name']: i for i in payload[0]['items']}

        plain = items['Entrecôte']
        self.assertEqual(plain['allergens'], [])
        self.assertEqual(plain['tags'], [])
        self.assertIsNone(plain['image'])
        self.assertFalse(plain['is_featured'])
        self.assertEqual(plain['price'], '289.00')

        rich = items['Oxfilé']
        self.assertEqual(rich['allergens'], ['mjölk', 'gluten'])
        self.assertEqual(rich['tags'], ['Signature', 'Populär'])
        self.assertTrue(rich['is_featured'])
        self.assertTrue(rich['image'])
        self.assertIn('/media/', rich['image'])
