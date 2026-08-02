from django.contrib import admin

from .models import LunchDish, LunchWeek


class LunchDishInline(admin.TabularInline):
    model = LunchDish
    extra = 5
    fields = ['weekday', 'name', 'description', 'price', 'is_available', 'order']


@admin.register(LunchWeek)
class LunchWeekAdmin(admin.ModelAdmin):
    list_display = ['week_number', 'year', 'week_start', 'is_published', 'dish_count']
    list_editable = ['is_published']
    list_filter = ['is_published', 'year']
    ordering = ['-year', '-week_number']
    readonly_fields = ['year', 'week_number']
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
                    'is_published',
                ),
                'description': (
                    'Välj valfri dag i veckan — veckonummer och år fylls i automatiskt '
                    '(ISO-vecka). Lägg till en rätt per vardag under Lunchrätter.'
                ),
            },
        ),
    )

    @admin.display(description='Rätter')
    def dish_count(self, obj):
        return obj.dishes.count()
