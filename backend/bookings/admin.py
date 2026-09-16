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
        'is_test',
    )
    list_filter = ('whatsapp_sent', 'is_test', 'date')
    search_fields = ('first_name', 'last_name', 'phone', 'email')
    readonly_fields = ('created_at', 'whatsapp_sent', 'is_test')
    ordering = ('-created_at',)
