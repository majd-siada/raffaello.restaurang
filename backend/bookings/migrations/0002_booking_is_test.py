from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='is_test',
            field=models.BooleanField(default=False, verbose_name='testbokning'),
        ),
    ]
