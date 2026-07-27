from django.db import migrations


GROUP_NAME = 'Menyredaktör'

OFFER_PERMISSION_CODENAMES = (
    'add_weeklyoffer',
    'change_weeklyoffer',
    'delete_weeklyoffer',
    'view_weeklyoffer',
    'add_offerdish',
    'change_offerdish',
    'delete_offerdish',
    'view_offerdish',
)


def grant_offer_permissions(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')

    group, _ = Group.objects.get_or_create(name=GROUP_NAME)
    perms = Permission.objects.filter(
        content_type__app_label='offers',
        codename__in=OFFER_PERMISSION_CODENAMES,
    )
    group.permissions.add(*perms)


def revoke_offer_permissions(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')

    group = Group.objects.filter(name=GROUP_NAME).first()
    if not group:
        return
    perms = Permission.objects.filter(
        content_type__app_label='offers',
        codename__in=OFFER_PERMISSION_CODENAMES,
    )
    group.permissions.remove(*perms)


class Migration(migrations.Migration):

    dependencies = [
        ('offers', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(grant_offer_permissions, revoke_offer_permissions),
    ]
