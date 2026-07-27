from datetime import timedelta

from django.db import models


def monday_of(d):
    """Return the Monday of the ISO week containing date d."""
    return d - timedelta(days=d.weekday())


class WeeklyOffer(models.Model):
    week_start = models.DateField(
        help_text='Valfri dag i veckan — sparas som måndagen i den ISO-veckan.',
    )
    year = models.PositiveIntegerField(editable=False)
    week_number = models.PositiveIntegerField(editable=False)
    intro_text = models.TextField(
        blank=True,
        help_text='Valfri introtext. Tom = webbplatsen använder standardtexten.',
    )
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['-year', '-week_number']
        constraints = [
            models.UniqueConstraint(
                fields=['year', 'week_number'],
                name='unique_weekly_offer_year_week',
            ),
        ]
        verbose_name = 'veckans erbjudande'
        verbose_name_plural = 'veckans erbjudanden'

    def save(self, *args, **kwargs):
        monday = monday_of(self.week_start)
        self.week_start = monday
        iso = monday.isocalendar()
        self.year = iso.year
        self.week_number = iso.week
        super().save(*args, **kwargs)

    def __str__(self):
        return f'v {self.week_number} ({self.year})'


class OfferDish(models.Model):
    offer = models.ForeignKey(
        WeeklyOffer,
        on_delete=models.CASCADE,
        related_name='dishes',
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'rätt'
        verbose_name_plural = 'rätter'

    def __str__(self):
        return self.name
