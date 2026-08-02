from datetime import timedelta

from django.db import models


def monday_of(d):
    """Return the Monday of the ISO week containing date d."""
    return d - timedelta(days=d.weekday())


WEEKDAY_CHOICES = [
    (0, 'Måndag'),
    (1, 'Tisdag'),
    (2, 'Onsdag'),
    (3, 'Torsdag'),
    (4, 'Fredag'),
    (5, 'Lördag'),
    (6, 'Söndag'),
]


class LunchWeek(models.Model):
    week_start = models.DateField(
        help_text='Valfri dag i veckan — sparas som måndagen i den ISO-veckan.',
    )
    year = models.PositiveIntegerField(editable=False)
    week_number = models.PositiveIntegerField(editable=False)
    intro_text = models.TextField(
        blank=True,
        help_text='Valfri introtext. Tom = webbplatsen använder standardtexten.',
    )
    notes = models.TextField(
        blank=True,
        help_text='T.ex. vad som ingår (sallad, bröd, kaffe) eller öppettider för lunch.',
    )
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ['-year', '-week_number']
        constraints = [
            models.UniqueConstraint(
                fields=['year', 'week_number'],
                name='unique_lunch_week_year_week',
            ),
        ]
        verbose_name = 'lunchvecka'
        verbose_name_plural = 'lunchveckor'

    def save(self, *args, **kwargs):
        monday = monday_of(self.week_start)
        self.week_start = monday
        iso = monday.isocalendar()
        self.year = iso.year
        self.week_number = iso.week
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Lunch v {self.week_number} ({self.year})'


class LunchDish(models.Model):
    lunch_week = models.ForeignKey(
        LunchWeek,
        on_delete=models.CASCADE,
        related_name='dishes',
    )
    weekday = models.PositiveSmallIntegerField(
        choices=WEEKDAY_CHOICES,
        null=True,
        blank=True,
        help_text='Tom = övrigt / gäller hela veckan (t.ex. soppa, sallad).',
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['weekday', 'order', 'id']
        verbose_name = 'lunchrätt'
        verbose_name_plural = 'lunchrätter'

    def __str__(self):
        if self.weekday is not None:
            day = dict(WEEKDAY_CHOICES).get(self.weekday, '')
            return f'{day}: {self.name}'
        return self.name
