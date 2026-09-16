from django.contrib import admin

from .models import FaqItem, LegalPage


@admin.register(FaqItem)
class FaqItemAdmin(admin.ModelAdmin):
    list_display = ('question', 'order', 'is_published', 'updated_at')
    list_editable = ('order', 'is_published')
    search_fields = ('question', 'answer')


@admin.register(LegalPage)
class LegalPageAdmin(admin.ModelAdmin):
    list_display = ('key', 'title', 'is_published', 'updated_at')
    list_editable = ('is_published',)
    readonly_fields = ('created_at', 'updated_at')
