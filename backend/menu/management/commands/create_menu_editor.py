from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError

GROUP_NAME = 'Menyredaktör'

User = get_user_model()


class Command(BaseCommand):
    help = (
        'Create a staff user who may only manage menu categories and items '
        f'(group "{GROUP_NAME}"). Run migrations first so the group exists.'
    )

    def add_arguments(self, parser):
        parser.add_argument('username', help='Login name for admin')
        parser.add_argument('--email', default='', help='Optional email')
        parser.add_argument('--password', required=True, help='Password for the new user')

    def handle(self, *args, **options):
        username = options['username'].strip()
        email = (options['email'] or '').strip()
        password = options['password']

        if not username:
            raise CommandError('username must not be empty')

        try:
            group = Group.objects.get(name=GROUP_NAME)
        except Group.DoesNotExist as exc:
            raise CommandError(
                f'Group "{GROUP_NAME}" not found. Apply migrations: '
                'python manage.py migrate'
            ) from exc

        if User.objects.filter(username=username).exists():
            raise CommandError(f'User "{username}" already exists')

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=True,
            is_superuser=False,
        )
        user.groups.add(group)
        self.stdout.write(
            self.style.SUCCESS(
                f'Created staff user "{username}" in group "{GROUP_NAME}". '
                'Log in at /admin/ — only Kategorier and Menyobjekt are available.'
            )
        )
