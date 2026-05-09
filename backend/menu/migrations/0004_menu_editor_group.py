from django.db import migrations


GROUP_NAME = 'Menyredaktör'

# All CRUD + view on Category and MenuItem only (no other apps).
MENU_PERMISSION_CODENAMES = (
    'add_category',
    'change_category',
    'delete_category',
    'view_category',
    'add_menuitem',
    'change_menuitem',
    'delete_menuitem',
    'view_menuitem',
)


def create_menu_editor_group(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')

    group, _ = Group.objects.get_or_create(name=GROUP_NAME)
    perms = Permission.objects.filter(
        content_type__app_label='menu',
        codename__in=MENU_PERMISSION_CODENAMES,
    )
    group.permissions.set(perms)


def remove_menu_editor_group(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.filter(name=GROUP_NAME).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0003_category_parent'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(create_menu_editor_group, remove_menu_editor_group),
    ]
