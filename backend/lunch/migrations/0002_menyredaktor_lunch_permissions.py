from django.db import migrations


GROUP_NAME = 'Menyredaktör'

LUNCH_PERMISSION_CODENAMES = (
    'add_lunchweek',
    'change_lunchweek',
    'delete_lunchweek',
    'view_lunchweek',
    'add_lunchdish',
    'change_lunchdish',
    'delete_lunchdish',
    'view_lunchdish',
)


def grant_lunch_permissions(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')

    group, _ = Group.objects.get_or_create(name=GROUP_NAME)
    perms = Permission.objects.filter(
        content_type__app_label='lunch',
        codename__in=LUNCH_PERMISSION_CODENAMES,
    )
    group.permissions.add(*perms)


def revoke_lunch_permissions(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')

    group = Group.objects.filter(name=GROUP_NAME).first()
    if not group:
        return
    perms = Permission.objects.filter(
        content_type__app_label='lunch',
        codename__in=LUNCH_PERMISSION_CODENAMES,
    )
    group.permissions.remove(*perms)


class Migration(migrations.Migration):

    dependencies = [
        ('lunch', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(grant_lunch_permissions, revoke_lunch_permissions),
    ]
