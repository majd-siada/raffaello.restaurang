"""SQLite test settings — used only for local `manage.py test` without Postgres."""

import os

os.environ.setdefault('SECRET_KEY', 'test-secret-key-for-unit-tests-only')
os.environ.setdefault('DEBUG', 'True')
os.environ.setdefault('DB_NAME', 'unused')
os.environ.setdefault('DB_USER', 'unused')
os.environ.setdefault('DB_PASSWORD', '')
os.environ.setdefault('TELEGRAM_BOT_TOKEN', 'test-token')
os.environ.setdefault('TELEGRAM_CHAT_ID', '12345')

from .settings import *  # noqa: E402,F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Avoid needing collectstatic / compressed manifest during tests
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
