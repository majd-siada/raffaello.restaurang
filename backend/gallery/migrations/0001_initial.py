import gallery.models
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='GalleryPhoto',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                (
                    'image',
                    models.ImageField(
                        help_text='Ladda upp från telefonen — bilden skalas och sparas som WebP.',
                        upload_to=gallery.models.gallery_upload_to,
                    ),
                ),
                (
                    'alt_text',
                    models.CharField(
                        blank=True,
                        help_text=(
                            'Kort beskrivning för tillgänglighet '
                            '(t.ex. "Matsal på Raffaello").'
                        ),
                        max_length=200,
                    ),
                ),
                (
                    'order',
                    models.PositiveIntegerField(
                        default=0,
                        help_text='Lägre nummer visas först.',
                    ),
                ),
                (
                    'is_published',
                    models.BooleanField(
                        default=True,
                        help_text='Avmarkera för att dölja fotot på webbplatsen.',
                    ),
                ),
            ],
            options={
                'verbose_name': 'galleri-foto',
                'verbose_name_plural': 'galleri-foton',
                'ordering': ['order', 'id'],
            },
        ),
    ]
