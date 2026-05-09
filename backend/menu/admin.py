from django.contrib import admin
from .models import Category, MenuItem


class MenuItemInline(admin.TabularInline):
    model = MenuItem
    extra = 1


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
    list_display = ['name', 'category', 'price', 'is_available']
    list_filter = ['category', 'is_available']
    list_editable = ['price', 'is_available']
