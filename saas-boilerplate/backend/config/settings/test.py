"""
Test settings for running tests locally.

Uses SQLite for speed and no external dependencies.
"""
from .base import *

# Use in-memory SQLite for tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable password hashing for speed
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable logging during tests
LOGGING = {}

# Use faster email backend
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Don't use Celery during tests - use eager mode with memory broker
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache+memory://'

# Disable Redis cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Disable Sentry during tests
SENTRY_DSN = None

# Frontend URL for tests
FRONTEND_URL = "http://localhost:5173"
