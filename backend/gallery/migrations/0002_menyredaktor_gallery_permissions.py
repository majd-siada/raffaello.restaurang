from django.db import migrations


GROUP_NAME = 'Menyredaktör'

GALLERY_PERMISSION_CODENAMES = (
    'add_galleryphoto',
    'change_galleryphoto',
    'delete_galleryphoto',
    'view_galleryphoto',
)


def grant_gallery_permissions(apps, schema_editor):
    from django.apps import apps as django_apps
    from django.contrib.auth.management import create_permissions

    # Permissions are normally created in post_migrate; ensure they exist
    # when this RunPython runs in the same migrate as 0001_initial.
    create_permissions(django_apps.get_app_config('gallery'), verbosity=0)

    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')

    group, _ = Group.objects.get_or_create(name=GROUP_NAME)
    perms = Permission.objects.filter(
        content_type__app_label='gallery',
        codename__in=GALLERY_PERMISSION_CODENAMES,
    )
    group.permissions.add(*perms)


def revoke_gallery_permissions(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')

    group = Group.objects.filter(name=GROUP_NAME).first()
    if not group:
        return
    perms = Permission.objects.filter(
        content_type__app_label='gallery',
        codename__in=GALLERY_PERMISSION_CODENAMES,
    )
    group.permissions.remove(*perms)


class Migration(migrations.Migration):

    dependencies = [
        ('gallery', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(grant_gallery_permissions, revoke_gallery_permissions),
    ]
