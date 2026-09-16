from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class EventInquiry(models.Model):
    """Private-events lead — förfrågan, not a confirmed booking."""

    first_name = models.CharField('förnamn', max_length=80)
    last_name = models.CharField('efternamn', max_length=80)
    phone = models.CharField('telefon', max_length=40)
    email = models.EmailField('e-post')
    preferred_date = models.DateField('önskat datum', null=True, blank=True)
    guests = models.PositiveSmallIntegerField(
        'ungefärligt antal gäster',
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(500)],
    )
    occasion = models.CharField(
        'typ av tillställning',
        max_length=120,
        blank=True,
        help_text='Fritext — inventera inte paketlistor i UI utan bekräftat innehåll.',
    )
    message = models.TextField('meddelande', blank=True)
    notify_sent = models.BooleanField('notifiering skickad', default=False)
    created_at = models.DateTimeField('skapad', auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'eventförfrågan'
        verbose_name_plural = 'eventförfrågningar'

    def __str__(self):
        when = self.preferred_date.isoformat() if self.preferred_date else 'datum saknas'
        return f'{self.first_name} {self.last_name} — {when}'
