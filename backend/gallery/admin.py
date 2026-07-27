from django.contrib import admin
from django.utils.html import format_html

from .models import GalleryPhoto


@admin.register(GalleryPhoto)
class GalleryPhotoAdmin(admin.ModelAdmin):
    list_display = ['thumb', 'alt_text', 'order', 'is_published']
    list_editable = ['order', 'is_published']
    list_display_links = ['thumb', 'alt_text']
    ordering = ['order', 'id']
    search_fields = ['alt_text']
    list_filter = ['is_published']
    fields = ['image', 'alt_text', 'order', 'is_published']

    @admin.display(description='Bild')
    def thumb(self, obj):
        if not obj.image:
            return '—'
        return format_html(
            '<img src="{}" alt="" style="height:48px;width:auto;object-fit:cover;" />',
            obj.image.url,
        )
