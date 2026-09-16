from django.core.exceptions import ValidationError
from django.db import models


LEGAL_PAGE_KEYS = (
    ('bokningsvillkor', 'Bokningsvillkor'),
    ('integritet', 'Integritetspolicy'),
)

LEGAL_CANONICAL = {
    'bokningsvillkor': 'https://raffaello.se/bokningsvillkor',
    'integritet': 'https://raffaello.se/integritet',
}


class FaqItem(models.Model):
    """Staff-curated FAQ — never invent answers in code or Admin prompts."""

    question = models.CharField(max_length=300)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'FAQ-fråga'
        verbose_name_plural = 'FAQ-frågor'

    def __str__(self):
        return (self.question or '')[:60]

    def clean(self):
        super().clean()
        if not (self.question or '').strip():
            raise ValidationError({'question': 'Fråga krävs.'})
        if not (self.answer or '').strip():
            raise ValidationError({'answer': 'Svar krävs.'})
        if self.is_published and (
            not (self.question or '').strip() or not (self.answer or '').strip()
        ):
            raise ValidationError('Publicerad FAQ måste ha fråga och svar.')


class LegalPage(models.Model):
    """
    Legal/trust pages for existing public routes only.
    Body is plain text; blank lines separate paragraphs.
    Do not invent policy text.
    """

    key = models.CharField(max_length=40, unique=True, choices=LEGAL_PAGE_KEYS)
    title = models.CharField(max_length=200)
    description = models.CharField(
        max_length=300,
        blank=True,
        help_text='Meta description for SEO.',
    )
    body = models.TextField(
        blank=True,
        help_text='Plain text. Tom rad mellan stycken. Tom tills restaurangen godkänner.',
    )
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['key']
        verbose_name = 'juridisk sida'
        verbose_name_plural = 'juridiska sidor'

    def __str__(self):
        return f'{self.key}: {self.title}'

    @property
    def canonical(self):
        return LEGAL_CANONICAL.get(self.key, f'https://raffaello.se/{self.key}')

    def paragraphs(self):
        raw = (self.body or '').replace('\r\n', '\n').strip()
        if not raw:
            return []
        parts = [p.strip() for p in raw.split('\n\n')]
        return [p for p in parts if p]

    def clean(self):
        super().clean()
        if not (self.title or '').strip():
            raise ValidationError({'title': 'Titel krävs.'})
        if self.is_published and not self.paragraphs():
            raise ValidationError(
                {
                    'body': 'Publicerad juridisk sida måste ha innehåll.',
                    'is_published': 'Kan inte publicera tom sida.',
                }
            )
