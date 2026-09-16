from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True,
        related_name='subcategories',
    )
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name_plural = 'categories'

    def __str__(self):
        if self.parent:
            return f'{self.parent.name} → {self.name}'
        return self.name


class MenuItem(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    # P1-C richness — only render on FE when staff-filled (never invent)
    allergens = models.CharField(
        'allergener',
        max_length=255,
        blank=True,
        help_text='Kommaseparerat. Visa endast om ifyllt av personal.',
    )
    tags = models.CharField(
        'etiketter',
        max_length=255,
        blank=True,
        help_text='t.ex. Signature, Populär — kommaseparerat.',
    )
    image = models.ImageField(
        'bild',
        upload_to='menu/',
        blank=True,
        null=True,
        help_text='Valfri rättbild. Tom = ingen bild i UI.',
    )
    is_featured = models.BooleanField(
        'utvald (startsida)',
        default=False,
        help_text='Prioriteras i startsidans signaturrätter när markerad.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category__order', 'order']

    def __str__(self):
        return self.name
