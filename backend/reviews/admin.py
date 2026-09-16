from django.contrib import admin

from .models import CuratedReview


@admin.register(CuratedReview)
class CuratedReviewAdmin(admin.ModelAdmin):
    list_display = ['author_name', 'source', 'rating', 'is_published', 'order']
    list_editable = ['is_published', 'order']
    list_filter = ['is_published', 'source']
    search_fields = ['quote', 'author_name', 'source']
    fields = ['quote', 'author_name', 'source', 'rating', 'is_published', 'order']
