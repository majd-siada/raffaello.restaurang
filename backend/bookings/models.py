from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Booking(models.Model):
    first_name = models.CharField('förnamn', max_length=80)
    last_name = models.CharField('efternamn', max_length=80)
    phone = models.CharField('telefon', max_length=40)
    email = models.EmailField('e-post')
    date = models.DateField('datum')
    time = models.TimeField('tid')
    guests = models.PositiveSmallIntegerField(
        'antal gäster',
        validators=[MinValueValidator(1), MaxValueValidator(6)],
    )
    message = models.TextField('meddelande', blank=True)
    whatsapp_sent = models.BooleanField('notifiering skickad', default=False)
    created_at = models.DateTimeField('skapad', auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'bokning'
        verbose_name_plural = 'bokningar'

    def __str__(self):
        return (
            f'{self.first_name} {self.last_name} — '
            f'{self.date} {self.time} ({self.guests} pers)'
        )
