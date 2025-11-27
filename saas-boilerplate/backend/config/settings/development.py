from .base import *

DEBUG = True

# Additional development apps
INSTALLED_APPS += [
    # 'debug_toolbar',
]

# Middleware for dev
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

# Internal IPs for debug toolbar
INTERNAL_IPS = [
    "127.0.0.1",
]

# Email backend for development (Mailpit)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
