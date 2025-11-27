from .base import *

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Email (Console backend for dev)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# CORS
CORS_ALLOW_ALL_ORIGINS = True  # For dev convenience

# DRF Browsable API
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
]
