from django.contrib import admin

from .models import LunchDish, LunchImportRun, LunchWeek


class LunchDishInline(admin.TabularInline):
    model = LunchDish
    extra = 5
    fields = ['weekday', 'name', 'description', 'price', 'is_available', 'order']


@admin.register(LunchWeek)
class LunchWeekAdmin(admin.ModelAdmin):
    list_display = [
        'week_number',
        'year',
        'week_start',
        'is_published',
        'source_type',
        'skip_auto_sync',
        'last_import_status',
        'fetched_at',
        'dish_count',
    ]
    list_editable = ['is_published', 'skip_auto_sync']
    list_filter = ['is_published', 'skip_auto_sync', 'source_type', 'year', 'last_import_status']
    ordering = ['-year', '-week_number']
    readonly_fields = [
        'year',
        'week_number',
        'source_hash',
        'fetched_at',
        'published_at',
        'source_last_updated',
        'parser_version',
        'last_import_status',
    ]
    inlines = [LunchDishInline]
    fieldsets = (
        (
            None,
            {
                'fields': (
                    'week_start',
                    'year',
                    'week_number',
                    'intro_text',
                    'notes',
                    'lunch_hours_text',
                    'is_published',
                    'skip_auto_sync',
                ),
                'description': (
                    'Välj valfri dag i veckan — veckonummer och år fylls i automatiskt '
                    '(ISO-vecka). Mat och Mat är källa för automatisk dagsmeny om '
                    '“Hoppa över autosynk” (manuell override) inte är ikryssad.'
                ),
            },
        ),
        (
            'Mat och Mat-import',
            {
                'fields': (
                    'source_type',
                    'source_url',
                    'source_hash',
                    'fetched_at',
                    'published_at',
                    'source_last_updated',
                    'parser_version',
                    'last_import_status',
                ),
            },
        ),
    )

    @admin.display(description='Rätter')
    def dish_count(self, obj):
        return obj.dishes.count()


@admin.register(LunchImportRun)
class LunchImportRunAdmin(admin.ModelAdmin):
    list_display = [
        'started_at',
        'status',
        'service_date',
        'year',
        'week_number',
        'item_count',
        'changed',
        'parser_version',
        'short_hash',
    ]
    list_filter = ['status', 'changed', 'parser_version']
    readonly_fields = [
        'started_at',
        'finished_at',
        'status',
        'source_url',
        'source_hash',
        'parser_version',
        'service_date',
        'year',
        'week_number',
        'item_count',
        'changed',
        'message',
    ]
    ordering = ['-started_at']

    @admin.display(description='Hash')
    def short_hash(self, obj):
        return (obj.source_hash or '')[:12] or '—'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
