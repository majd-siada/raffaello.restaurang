from django.contrib import admin

from .models import OfferDish, WeeklyOffer


class OfferDishInline(admin.TabularInline):
    model = OfferDish
    extra = 1
    fields = ['name', 'description', 'price', 'is_available', 'order']


@admin.register(WeeklyOffer)
class WeeklyOfferAdmin(admin.ModelAdmin):
    list_display = ['week_number', 'year', 'week_start', 'is_published', 'dish_count']
    list_editable = ['is_published']
    list_filter = ['is_published', 'year']
    ordering = ['-year', '-week_number']
    readonly_fields = ['year', 'week_number']
    inlines = [OfferDishInline]
    fieldsets = (
        (
            None,
            {
                'fields': ('week_start', 'year', 'week_number', 'intro_text', 'is_published'),
                'description': (
                    'Välj valfri dag i veckan — veckonummer och år fylls i automatiskt '
                    '(ISO-vecka).'
                ),
            },
        ),
    )

    @admin.display(description='Rätter')
    def dish_count(self, obj):
        return obj.dishes.count()
