from rest_framework import generics
from .models import Category
from .serializers import CategorySerializer


class MenuListView(generics.ListAPIView):
    queryset = Category.objects.filter(parent__isnull=True).prefetch_related(
        'items', 'subcategories', 'subcategories__items',
    )
    serializer_class = CategorySerializer
