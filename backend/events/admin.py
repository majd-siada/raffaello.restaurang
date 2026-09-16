from django.contrib import admin

from .models import EventInquiry


@admin.register(EventInquiry)
class EventInquiryAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'first_name',
        'last_name',
        'phone',
        'email',
        'preferred_date',
        'guests',
        'occasion',
        'notify_sent',
    )
    list_filter = ('notify_sent', 'preferred_date')
    search_fields = ('first_name', 'last_name', 'phone', 'email', 'occasion')
    readonly_fields = ('created_at', 'notify_sent')
    ordering = ('-created_at',)
