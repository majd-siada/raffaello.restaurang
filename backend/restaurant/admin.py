from django.contrib import admin

from .models import OpeningHoursDay, OpeningHoursSettings


@admin.register(OpeningHoursSettings)
class OpeningHoursSettingsAdmin(admin.ModelAdmin):
    list_display = ('timezone', 'max_guests_online', 'slot_interval_minutes')


@admin.register(OpeningHoursDay)
class OpeningHoursDayAdmin(admin.ModelAdmin):
    list_display = ('weekday', 'opens', 'closes', 'is_closed')
    list_editable = ('opens', 'closes', 'is_closed')
