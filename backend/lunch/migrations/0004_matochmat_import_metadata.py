# Generated manually for Mat och Mat import metadata + LunchImportRun.

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('lunch', '0003_skip_auto_sync_nullable_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='lunchweek',
            name='fetched_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='lunchweek',
            name='last_import_status',
            field=models.CharField(
                blank=True,
                choices=[
                    ('FETCHED', 'Fetched'),
                    ('VALIDATED', 'Validated'),
                    ('PUBLISHED', 'Published'),
                    ('NOT_PUBLISHED', 'Not published'),
                    ('FETCH_FAILED', 'Fetch failed'),
                    ('PARSE_FAILED', 'Parse failed'),
                    ('STALE', 'Stale'),
                    ('UNCHANGED', 'Unchanged'),
                    ('SKIPPED_OVERRIDE', 'Skipped (manual override)'),
                ],
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name='lunchweek',
            name='lunch_hours_text',
            field=models.TextField(
                blank=True,
                help_text='Lunchöppettider från källan när de finns (oförändrad källtext/normaliserad sammanfattning).',
            ),
        ),
        migrations.AddField(
            model_name='lunchweek',
            name='parser_version',
            field=models.CharField(blank=True, max_length=16),
        ),
        migrations.AddField(
            model_name='lunchweek',
            name='published_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='lunchweek',
            name='source_hash',
            field=models.CharField(
                blank=True,
                help_text='SHA-256 av normaliserad lunchrepresentation från senaste lyckade importen.',
                max_length=64,
            ),
        ),
        migrations.AddField(
            model_name='lunchweek',
            name='source_last_updated',
            field=models.CharField(
                blank=True,
                help_text='Källans lastUpdated om den finns i Mat och Mat-payloaden.',
                max_length=64,
            ),
        ),
        migrations.AddField(
            model_name='lunchweek',
            name='source_type',
            field=models.CharField(
                choices=[
                    ('MANUAL', 'Manuell'),
                    ('EXTERNAL_MATOCHMAT', 'Mat och Mat (extern)'),
                ],
                default='MANUAL',
                help_text='MANUAL = CMS; EXTERNAL_MATOCHMAT = importerad från Mat och Mat.',
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name='lunchweek',
            name='source_url',
            field=models.URLField(blank=True),
        ),
        migrations.AlterField(
            model_name='lunchweek',
            name='skip_auto_sync',
            field=models.BooleanField(
                default=False,
                help_text='Manuell override: om ikryssad får den dagliga Mat och Mat-synken INTE skriva över denna vecka.',
            ),
        ),
        migrations.CreateModel(
            name='LunchImportRun',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('started_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                (
                    'status',
                    models.CharField(
                        choices=[
                            ('FETCHED', 'Fetched'),
                            ('VALIDATED', 'Validated'),
                            ('PUBLISHED', 'Published'),
                            ('NOT_PUBLISHED', 'Not published'),
                            ('FETCH_FAILED', 'Fetch failed'),
                            ('PARSE_FAILED', 'Parse failed'),
                            ('STALE', 'Stale'),
                            ('UNCHANGED', 'Unchanged'),
                            ('SKIPPED_OVERRIDE', 'Skipped (manual override)'),
                        ],
                        max_length=32,
                    ),
                ),
                ('source_url', models.URLField(blank=True)),
                ('source_hash', models.CharField(blank=True, max_length=64)),
                ('parser_version', models.CharField(blank=True, max_length=16)),
                ('service_date', models.DateField(blank=True, null=True)),
                ('year', models.PositiveIntegerField(blank=True, null=True)),
                ('week_number', models.PositiveIntegerField(blank=True, null=True)),
                ('item_count', models.PositiveIntegerField(blank=True, null=True)),
                ('changed', models.BooleanField(default=False)),
                ('message', models.TextField(blank=True)),
            ],
            options={
                'verbose_name': 'lunchimport',
                'verbose_name_plural': 'lunchimporter',
                'ordering': ['-started_at'],
            },
        ),
    ]
