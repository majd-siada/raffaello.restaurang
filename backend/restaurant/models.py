"""Opening hours models — DB candidate SoT (feature-flagged vs JSON)."""

from django.core.exceptions import ValidationError
from django.db import models

WEEKDAY_CHOICES = [
    (0, 'Måndag'),
    (1, 'Tisdag'),
    (2, 'Onsdag'),
    (3, 'Torsdag'),
    (4, 'Fredag'),
    (5, 'Lördag'),
    (6, 'Söndag'),
]


class OpeningHoursSettings(models.Model):
    """Singleton booking/hours metadata (pk=1). NAP remains siteConfig — not here."""

    timezone = models.CharField(max_length=64, default='Europe/Stockholm')
    max_guests_online = models.PositiveIntegerField(default=6)
    slot_interval_minutes = models.PositiveIntegerField(default=30)

    class Meta:
        verbose_name = 'öppettider-inställningar'
        verbose_name_plural = 'öppettider-inställningar'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f'OpeningHoursSettings ({self.timezone})'


class OpeningHoursDay(models.Model):
    """One row per Python weekday (0=Mon … 6=Sun). Times are local Europe/Stockholm wall clock."""

    weekday = models.PositiveSmallIntegerField(unique=True, choices=WEEKDAY_CHOICES)
    opens = models.TimeField(null=True, blank=True)
    closes = models.TimeField(null=True, blank=True)
    is_closed = models.BooleanField(
        default=False,
        help_text='Om True är dagen stängd (opens/closes ignoreras).',
    )

    class Meta:
        ordering = ['weekday']
        verbose_name = 'öppettidsdag'
        verbose_name_plural = 'öppettidsdagar'

    def clean(self):
        if self.is_closed:
            return
        if self.opens is None or self.closes is None:
            raise ValidationError('Öppna dagar kräver både öppning och stängning.')
        # Current business data never spans midnight; forbid close <= open.
        if self.closes <= self.opens:
            raise ValidationError('Stängning måste vara efter öppning (inga dygnsövergångar i nuvarande data).')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        label = dict(WEEKDAY_CHOICES).get(self.weekday, self.weekday)
        if self.is_closed:
            return f'{label}: Stängt'
        return f'{label}: {self.opens}–{self.closes}'
