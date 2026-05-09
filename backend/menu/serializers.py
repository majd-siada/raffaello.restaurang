from rest_framework import serializers
from .models import Category, MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'description', 'price', 'is_available', 'order']


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'order', 'items', 'subcategories']

    def get_subcategories(self, obj):
        children = obj.subcategories.all()
        return CategorySerializer(children, many=True).data
