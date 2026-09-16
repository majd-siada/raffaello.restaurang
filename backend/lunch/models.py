from datetime import timedelta

from django.db import models
from django.utils import timezone


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

SOURCE_MANUAL = 'MANUAL'
SOURCE_EXTERNAL_MATOCHMAT = 'EXTERNAL_MATOCHMAT'
SOURCE_TYPE_CHOICES = [
    (SOURCE_MANUAL, 'Manuell'),
    (SOURCE_EXTERNAL_MATOCHMAT, 'Mat och Mat (extern)'),
]

IMPORT_STATUS_FETCHED = 'FETCHED'
IMPORT_STATUS_VALIDATED = 'VALIDATED'
IMPORT_STATUS_PUBLISHED = 'PUBLISHED'
IMPORT_STATUS_NOT_PUBLISHED = 'NOT_PUBLISHED'
IMPORT_STATUS_FETCH_FAILED = 'FETCH_FAILED'
IMPORT_STATUS_PARSE_FAILED = 'PARSE_FAILED'
IMPORT_STATUS_STALE = 'STALE'
IMPORT_STATUS_UNCHANGED = 'UNCHANGED'
IMPORT_STATUS_SKIPPED_OVERRIDE = 'SKIPPED_OVERRIDE'

IMPORT_STATUS_CHOICES = [
    (IMPORT_STATUS_FETCHED, 'Fetched'),
    (IMPORT_STATUS_VALIDATED, 'Validated'),
    (IMPORT_STATUS_PUBLISHED, 'Published'),
    (IMPORT_STATUS_NOT_PUBLISHED, 'Not published'),
    (IMPORT_STATUS_FETCH_FAILED, 'Fetch failed'),
    (IMPORT_STATUS_PARSE_FAILED, 'Parse failed'),
    (IMPORT_STATUS_STALE, 'Stale'),
    (IMPORT_STATUS_UNCHANGED, 'Unchanged'),
    (IMPORT_STATUS_SKIPPED_OVERRIDE, 'Skipped (manual override)'),
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
    lunch_hours_text = models.TextField(
        blank=True,
        help_text='Lunchöppettider från källan när de finns (oförändrad källtext/normaliserad sammanfattning).',
    )
    is_published = models.BooleanField(default=True)
    skip_auto_sync = models.BooleanField(
        default=False,
        help_text=(
            'Manuell override: om ikryssad får den dagliga Mat och Mat-synken '
            'INTE skriva över denna vecka.'
        ),
    )
    source_type = models.CharField(
        max_length=32,
        choices=SOURCE_TYPE_CHOICES,
        default=SOURCE_MANUAL,
        help_text='MANUAL = CMS; EXTERNAL_MATOCHMAT = importerad från Mat och Mat.',
    )
    source_url = models.URLField(blank=True)
    source_hash = models.CharField(
        max_length=64,
        blank=True,
        help_text='SHA-256 av normaliserad lunchrepresentation från senaste lyckade importen.',
    )
    fetched_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    source_last_updated = models.CharField(
        max_length=64,
        blank=True,
        help_text='Källans lastUpdated om den finns i Mat och Mat-payloaden.',
    )
    parser_version = models.CharField(max_length=16, blank=True)
    last_import_status = models.CharField(
        max_length=32,
        choices=IMPORT_STATUS_CHOICES,
        blank=True,
    )

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

    @property
    def manual_override(self) -> bool:
        """Alias for skip_auto_sync — staff manual override of auto-import."""
        return self.skip_auto_sync

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
    price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
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


class LunchImportRun(models.Model):
    """Observability log for Mat och Mat import runs (no secrets / PII)."""

    started_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=32, choices=IMPORT_STATUS_CHOICES)
    source_url = models.URLField(blank=True)
    source_hash = models.CharField(max_length=64, blank=True)
    parser_version = models.CharField(max_length=16, blank=True)
    service_date = models.DateField(null=True, blank=True)
    year = models.PositiveIntegerField(null=True, blank=True)
    week_number = models.PositiveIntegerField(null=True, blank=True)
    item_count = models.PositiveIntegerField(null=True, blank=True)
    changed = models.BooleanField(default=False)
    message = models.TextField(blank=True)

    class Meta:
        ordering = ['-started_at']
        verbose_name = 'lunchimport'
        verbose_name_plural = 'lunchimporter'

    def __str__(self):
        return f'{self.status} @ {self.started_at:%Y-%m-%d %H:%M}'
