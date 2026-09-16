from django.contrib import admin
from .models import Category, MenuItem


class MenuItemInline(admin.TabularInline):
    model = MenuItem
    extra = 1
    fields = [
        'name',
        'description',
        'price',
        'is_available',
        'is_featured',
        'allergens',
        'tags',
        'image',
        'order',
    ]


class SubcategoryInline(admin.TabularInline):
    model = Category
    fk_name = 'parent'
    extra = 1
    fields = ['name', 'description', 'order']
    show_change_link = True
    verbose_name = 'subcategory'
    verbose_name_plural = 'subcategories'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'order']
    list_editable = ['order']
    list_filter = ['parent']
    ordering = ['order']
    inlines = [SubcategoryInline, MenuItemInline]


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'is_available', 'is_featured']
    list_filter = ['category', 'is_available', 'is_featured']
    list_editable = ['price', 'is_available', 'is_featured']
    search_fields = ['name', 'allergens', 'tags']
    fields = [
        'category',
        'name',
        'description',
        'price',
        'is_available',
        'is_featured',
        'allergens',
        'tags',
        'image',
        'order',
    ]
