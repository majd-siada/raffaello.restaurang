# Generated manually for Phase E — seed OpeningHours* from opening_hours.json

from django.db import migrations


def seed_forward(apps, schema_editor):
    from raffaello.restaurant_data import seed_days_from_json_config

    seed_days_from_json_config()


def seed_reverse(apps, schema_editor):
    OpeningHoursDay = apps.get_model('restaurant', 'OpeningHoursDay')
    OpeningHoursSettings = apps.get_model('restaurant', 'OpeningHoursSettings')
    OpeningHoursDay.objects.all().delete()
    OpeningHoursSettings.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ('restaurant', '0001_initial_opening_hours'),
    ]

    operations = [
        migrations.RunPython(seed_forward, seed_reverse),
    ]
