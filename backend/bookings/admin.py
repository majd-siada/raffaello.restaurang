from django.contrib import admin

from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'first_name',
        'last_name',
        'phone',
        'email',
        'date',
        'time',
        'guests',
        'whatsapp_sent',
    )
    list_filter = ('whatsapp_sent', 'date')
    search_fields = ('first_name', 'last_name', 'phone', 'email')
    readonly_fields = ('created_at', 'whatsapp_sent')
    ordering = ('-created_at',)
