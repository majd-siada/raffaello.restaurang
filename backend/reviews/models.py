from django.core.exceptions import ValidationError
from django.db import models


class CuratedReview(models.Model):
    """
    Staff-curated guest quotes only. Never invent for the frontend.
    Empty published set → homepage trust section omitted.
    """

    quote = models.TextField('citat')
    author_name = models.CharField('namn', max_length=120)
    source = models.CharField(
        'källa',
        max_length=80,
        help_text='t.ex. Google, gästbok — måste vara verklig källa.',
    )
    rating = models.PositiveSmallIntegerField(
        'betyg (1–5)',
        null=True,
        blank=True,
        help_text='Lämna tomt om inget betyg finns från källan.',
    )
    is_published = models.BooleanField('publicerad', default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-id']
        verbose_name = 'omdöme'
        verbose_name_plural = 'omdömen'

    def __str__(self):
        return f'{self.author_name} ({self.source})'

    def clean(self):
        super().clean()
        if self.rating is not None and not (1 <= self.rating <= 5):
            raise ValidationError({'rating': 'Betyg måste vara 1–5 eller tomt.'})
        if not (self.quote or '').strip():
            raise ValidationError({'quote': 'Citat krävs.'})
        if not (self.author_name or '').strip():
            raise ValidationError({'author_name': 'Namn krävs.'})
        if not (self.source or '').strip():
            raise ValidationError({'source': 'Källa krävs.'})
