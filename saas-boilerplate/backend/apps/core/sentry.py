"""Sentry Error Tracking Initialization.

Configures Sentry for error tracking, performance monitoring, and profiling
with privacy-first defaults and environment-aware configuration.
"""

import os
import logging
from typing import Optional, Dict, Any

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

logger = logging.getLogger(__name__)


def get_sentry_config() -> Dict[str, Any]:
    """Get Sentry configuration from environment variables.

    Returns:
        Dict[str, Any]: Dictionary with Sentry configuration.
    """
    dsn = os.environ.get('SENTRY_DSN', '')
    environment = os.environ.get('SENTRY_ENVIRONMENT', 'production')
    release = os.environ.get('RELEASE_VERSION', 'unknown')

    # Only enable if DSN is provided
    enabled = bool(dsn)

    # Higher sample rate in non-production for better debugging
    traces_sample_rate = 0.1 if environment == 'production' else 1.0
    profiles_sample_rate = 0.1 if environment == 'production' else 1.0

    return {
        'dsn': dsn,
        'environment': environment,
        'release': release,
        'enabled': enabled,
        'traces_sample_rate': traces_sample_rate,
        'profiles_sample_rate': profiles_sample_rate,
    }


def before_send(event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Filter and scrub sensitive data before sending to Sentry.

    Args:
        event: Sentry event dictionary.
        hint: Additional context.

    Returns:
        Optional[Dict[str, Any]]: Modified event or None to drop the event.
    """
    # Remove sensitive data from request
    if 'request' in event:
        request = event['request']

        # Remove cookies
        if 'cookies' in request:
            request['cookies'] = '[Filtered]'

        # Remove sensitive headers
        if 'headers' in request:
            sensitive_headers = [
                'Authorization',
                'Cookie',
                'X-CSRF-Token',
                'X-CSRFToken',
                'Session',
            ]
            for header in sensitive_headers:
                if header in request['headers']:
                    request['headers'][header] = '[Filtered]'

        # Scrub sensitive query parameters
        if 'query_string' in request:
            sensitive_params = ['token', 'key', 'secret', 'password', 'api_key']
            query = request['query_string']
            if isinstance(query, str):
                for param in sensitive_params:
                    import re
                    query = re.sub(
                        f'{param}=[^&]*',
                        f'{param}=REDACTED',
                        query,
                        flags=re.IGNORECASE
                    )
                request['query_string'] = query

    # Remove sensitive data from extra context
    if 'extra' in event:
        sensitive_keys = ['password', 'secret', 'token', 'api_key', 'private_key']
        for key in list(event['extra'].keys()):
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                event['extra'][key] = '[Filtered]'

    # Don't send events in DEBUG mode (unless explicitly enabled)
    from django.conf import settings
    if getattr(settings, 'DEBUG', False):
        debug_sentry = os.environ.get('SENTRY_DEBUG_MODE', 'false').lower() == 'true'
        if not debug_sentry:
            return None

    return event


def initialize_sentry() -> bool:
    """Initialize Sentry error tracking.

    Returns:
        bool: True if Sentry was initialized successfully.
    """
    config = get_sentry_config()

    # Skip initialization if disabled or no DSN
    if not config['enabled'] or not config['dsn']:
        logger.info('[Sentry] Skipped initialization (disabled or no DSN)')
        return False

    try:
        # Configure logging integration
        logging_integration = LoggingIntegration(
            level=logging.INFO,        # Capture info and above as breadcrumbs
            event_level=logging.ERROR  # Send errors as events
        )

        sentry_sdk.init(
            dsn=config['dsn'],
            environment=config['environment'],
            release=config['release'],

            # Integrations
            integrations=[
                DjangoIntegration(
                    # Capture SQL queries (only in non-production)
                    transaction_style='url',
                    middleware_spans=True,
                    signals_spans=True,
                    cache_spans=True,
                ),
                CeleryIntegration(
                    # Monitor Celery tasks
                    monitor_beat_tasks=True,
                    propagate_traces=True,
                ),
                RedisIntegration(),
                logging_integration,
            ],

            # Performance Monitoring
            traces_sample_rate=config['traces_sample_rate'],

            # Profiling (pairs with traces_sample_rate)
            profiles_sample_rate=config['profiles_sample_rate'],

            # Privacy & Data Scrubbing
            send_default_pii=False,
            before_send=before_send,

            # Additional settings
            attach_stacktrace=True,
            max_breadcrumbs=50,

            # Error sampling (send all errors by default)
            sample_rate=1.0,

            # Ignore common non-actionable errors
            ignore_errors=[
                # HTTP client errors
                'django.http.Http404',
                'django.core.exceptions.PermissionDenied',

                # Validation errors (usually user input issues)
                'django.core.exceptions.ValidationError',
                'rest_framework.exceptions.ValidationError',

                # Database connection issues (transient)
                'psycopg2.OperationalError',
                'redis.exceptions.ConnectionError',
            ],
        )

        logger.info(f'[Sentry] Initialized successfully ({config["environment"]})')
        return True

    except Exception as e:
        logger.error(f'[Sentry] Initialization failed: {e}')
        return False


def set_user_context(user_id: str, email: Optional[str] = None, **extra):
    """Set user context for error tracking.

    Args:
        user_id: User ID.
        email: User email (will be hashed for privacy).
        **extra: Additional user data (non-sensitive only).
    """
    context = {
        'id': user_id,
        **extra
    }

    # Hash email for privacy
    if email:
        context['email'] = _hash_email(email)

    sentry_sdk.set_user(context)


def set_organization_context(org_id: str, org_name: Optional[str] = None, **extra):
    """Set organization context for error tracking.

    Args:
        org_id: Organization ID.
        org_name: Organization name.
        **extra: Additional organization data.
    """
    sentry_sdk.set_context('organization', {
        'id': org_id,
        'name': org_name,
        **extra
    })


def set_custom_context(name: str, data: Dict[str, Any]):
    """Set custom context for error tracking.

    Args:
        name: Context name.
        data: Context data dictionary.
    """
    sentry_sdk.set_context(name, data)


def add_breadcrumb(message: str, category: str = 'custom', level: str = 'info', **data):
    """Add a breadcrumb to track user actions.

    Args:
        message: Breadcrumb message.
        category: Category (e.g., 'auth', 'db', 'http').
        level: Severity level (debug, info, warning, error, fatal).
        **data: Additional data.
    """
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data,
    )


def capture_exception(error: Exception, **context):
    """Manually capture an exception.

    Args:
        error: Exception to capture.
        **context: Additional context to include.
    """
    with sentry_sdk.push_scope() as scope:
        for key, value in context.items():
            scope.set_context(key, value)
        sentry_sdk.capture_exception(error)


def capture_message(message: str, level: str = 'info', **context):
    """Manually capture a message.

    Args:
        message: Message to capture.
        level: Severity level (debug, info, warning, error, fatal).
        **context: Additional context to include.
    """
    with sentry_sdk.push_scope() as scope:
        for key, value in context.items():
            scope.set_context(key, value)
        sentry_sdk.capture_message(message, level=level)


def start_transaction(name: str, op: str = 'custom') -> Any:
    """Start a new transaction for performance monitoring.

    Args:
        name: Transaction name.
        op: Operation type (e.g., 'http', 'db', 'task').

    Returns:
        Any: Transaction object.
    """
    return sentry_sdk.start_transaction(name=name, op=op)


def _hash_email(email: str) -> str:
    """Hash email for privacy (simple masking, not cryptographic).

    Args:
        email: Email address.

    Returns:
        str: Masked email address.
    """
    try:
        username, domain = email.split('@')
        if len(username) > 2:
            masked_username = username[:2] + '*' * (len(username) - 2)
        else:
            masked_username = username
        return f'{masked_username}@{domain}'
    except (ValueError, IndexError):
        return email


# Decorator for automatic error capture
def with_sentry_context(**context_kwargs):
    """Decorator to automatically add context to Sentry errors.

    Usage:
        @with_sentry_context(feature='payment_processing')
        def process_payment(amount):
            # ... code ...

    Args:
        **context_kwargs: Key-value pairs to add as tags.

    Returns:
        Callable: Decorated function.
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            with sentry_sdk.push_scope() as scope:
                for key, value in context_kwargs.items():
                    scope.set_tag(key, value)
                return func(*args, **kwargs)
        return wrapper
    return decorator


def is_sentry_active() -> bool:
    """Check if Sentry is initialized and active.

    Returns:
        bool: True if Sentry is active.
    """
    client = sentry_sdk.Hub.current.client
    return client is not None and client.options.get('dsn') is not None
