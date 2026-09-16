from rest_framework import serializers
from .models import Category, MenuItem


def _split_csv(value):
    if not value or not str(value).strip():
        return []
    return [part.strip() for part in str(value).split(',') if part.strip()]


class MenuItemSerializer(serializers.ModelSerializer):
    allergens = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            'id',
            'name',
            'description',
            'price',
            'is_available',
            'order',
            'allergens',
            'tags',
            'image',
            'is_featured',
        ]

    def get_allergens(self, obj):
        return _split_csv(obj.allergens)

    def get_tags(self, obj):
        return _split_csv(obj.tags)

    def get_image(self, obj):
        if not obj.image:
            return None
        return obj.image.url


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'order', 'items', 'subcategories']

    def get_subcategories(self, obj):
        children = obj.subcategories.all()
        return CategorySerializer(children, many=True).data
