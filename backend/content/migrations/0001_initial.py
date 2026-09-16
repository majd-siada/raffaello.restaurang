from django.db import migrations, models


def seed_legal_shells(apps, schema_editor):
    """
    Deterministic shells from trustContent.js metadata only — empty body, unpublished.
    Does not invent legal text.
    """
    LegalPage = apps.get_model('content', 'LegalPage')
    shells = [
        {
            'key': 'bokningsvillkor',
            'title': 'Bokningsvillkor',
            'description': (
                'Villkor för bordsbokning på Raffaello. '
                'Text publiceras när den är godkänd.'
            ),
        },
        {
            'key': 'integritet',
            'title': 'Integritetspolicy',
            'description': (
                'Information om hur Raffaello hanterar personuppgifter. '
                'Text publiceras när den är godkänd.'
            ),
        },
    ]
    for row in shells:
        LegalPage.objects.update_or_create(
            key=row['key'],
            defaults={
                'title': row['title'],
                'description': row['description'],
                'body': '',
                'is_published': False,
            },
        )


def unseed_legal_shells(apps, schema_editor):
    LegalPage = apps.get_model('content', 'LegalPage')
    LegalPage.objects.filter(key__in=('bokningsvillkor', 'integritet')).delete()


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='FaqItem',
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
                ('question', models.CharField(max_length=300)),
                ('answer', models.TextField()),
                ('order', models.PositiveIntegerField(default=0)),
                ('is_published', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'FAQ-fråga',
                'verbose_name_plural': 'FAQ-frågor',
                'ordering': ['order', 'id'],
            },
        ),
        migrations.CreateModel(
            name='LegalPage',
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
                    'key',
                    models.CharField(
                        choices=[
                            ('bokningsvillkor', 'Bokningsvillkor'),
                            ('integritet', 'Integritetspolicy'),
                        ],
                        max_length=40,
                        unique=True,
                    ),
                ),
                ('title', models.CharField(max_length=200)),
                (
                    'description',
                    models.CharField(
                        blank=True,
                        help_text='Meta description for SEO.',
                        max_length=300,
                    ),
                ),
                (
                    'body',
                    models.TextField(
                        blank=True,
                        help_text=(
                            'Plain text. Tom rad mellan stycken. '
                            'Tom tills restaurangen godkänner.'
                        ),
                    ),
                ),
                ('is_published', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'juridisk sida',
                'verbose_name_plural': 'juridiska sidor',
                'ordering': ['key'],
            },
        ),
        migrations.RunPython(seed_legal_shells, unseed_legal_shells),
    ]
