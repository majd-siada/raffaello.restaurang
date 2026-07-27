import uuid
from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile
from django.db import models
from PIL import Image

MAX_PUBLISHED = 6
MAX_EDGE = 1600
WEBP_QUALITY = 80


def gallery_upload_to(instance, filename):
    return f'gallery/{uuid.uuid4().hex}.webp'


class GalleryPhoto(models.Model):
    image = models.ImageField(
        upload_to=gallery_upload_to,
        help_text='Ladda upp från telefonen — bilden skalas och sparas som WebP.',
    )
    alt_text = models.CharField(
        max_length=200,
        blank=True,
        help_text='Kort beskrivning för tillgänglighet (t.ex. "Matsal på Raffaello").',
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Lägre nummer visas först.',
    )
    is_published = models.BooleanField(
        default=True,
        help_text='Avmarkera för att dölja fotot på webbplatsen.',
    )

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'galleri-foto'
        verbose_name_plural = 'galleri-foton'

    def __str__(self):
        return self.alt_text or f'Foto {self.pk or "(nytt)"}'

    def clean(self):
        super().clean()
        if not self.is_published:
            return
        qs = GalleryPhoto.objects.filter(is_published=True)
        if self.pk:
            qs = qs.exclude(pk=self.pk)
        if qs.count() >= MAX_PUBLISHED:
            raise ValidationError(
                {
                    'is_published': (
                        f'Max {MAX_PUBLISHED} publicerade foton. '
                        'Avpublicera eller ta bort ett annat foto först.'
                    ),
                }
            )

    def save(self, *args, **kwargs):
        if self._should_optimize():
            self._optimize_image()
        super().save(*args, **kwargs)

    def _should_optimize(self):
        if getattr(self, '_image_processed', False) or not self.image:
            return False
        if isinstance(self.image, UploadedFile):
            return True
        underlying = getattr(self.image, 'file', None)
        return isinstance(underlying, UploadedFile)

    def _optimize_image(self):
        """Resize long edge and store as WebP for phone-friendly uploads."""
        try:
            self.image.open('rb')
        except (FileNotFoundError, ValueError, OSError):
            return

        with Image.open(self.image) as img:
            img = img.convert('RGB')
            img.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
            buffer = BytesIO()
            img.save(buffer, format='WEBP', quality=WEBP_QUALITY, method=4)
            buffer.seek(0)

        name = f'{uuid.uuid4().hex}.webp'
        self.image = ContentFile(buffer.read(), name=name)
        self._image_processed = True
