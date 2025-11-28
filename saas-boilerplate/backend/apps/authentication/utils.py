"""Authentication utility functions for email verification, password reset, etc."""
import secrets
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache

User = get_user_model()


def get_client_ip(request):
    """Extract client IP address from request, handling proxies.

    Args:
        request: The request object.

    Returns:
        str: The client IP address.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def generate_token():
    """Generate a secure random token for email verification and password reset.

    Returns:
        str: The generated token.
    """
    return secrets.token_urlsafe(32)


def create_verification_token(user):
    """Create and store an email verification token for a user.

    Args:
        user: User instance.

    Returns:
        str: Verification token.
    """
    token = generate_token()
    cache_key = f'email_verify:{token}'
    # Store user ID with token, expires in 24 hours
    cache.set(cache_key, str(user.id), timeout=86400)
    return token


def verify_email_token(token):
    """Verify an email verification token and return the user.

    Args:
        token: Verification token.

    Returns:
        User: User instance if valid, None otherwise.
    """
    cache_key = f'email_verify:{token}'
    user_id = cache.get(cache_key)

    if not user_id:
        return None

    try:
        user = User.objects.get(id=user_id)
        # Mark email as verified
        user.email_verified = True
        user.save(update_fields=['email_verified'])
        # Delete token after use
        cache.delete(cache_key)
        return user
    except User.DoesNotExist:
        return None


def create_password_reset_token(user):
    """Create and store a password reset token for a user.

    Args:
        user: User instance.

    Returns:
        str: Reset token.
    """
    token = generate_token()
    cache_key = f'password_reset:{token}'
    # Store user ID with token, expires in 1 hour
    cache.set(cache_key, str(user.id), timeout=3600)
    return token


def verify_password_reset_token(token):
    """Verify a password reset token and return the user.

    Args:
        token: Reset token.

    Returns:
        User: User instance if valid, None otherwise.
    """
    cache_key = f'password_reset:{token}'
    user_id = cache.get(cache_key)

    if not user_id:
        return None

    try:
        user = User.objects.get(id=user_id, is_active=True)
        return user
    except User.DoesNotExist:
        return None


def invalidate_password_reset_token(token):
    """Invalidate a password reset token after use.

    Args:
        token: Reset token.
    """
    cache_key = f'password_reset:{token}'
    cache.delete(cache_key)


def send_verification_email(user, request):
    """Send email verification email to user.

    Args:
        user: User instance.
        request: HTTP request for building absolute URL.
    """
    token = create_verification_token(user)

    # Build verification URL
    verification_url = request.build_absolute_uri(
        f'/verify-email/{token}'
    )

    # Render email
    context = {
        'user': user,
        'verification_url': verification_url,
    }

    html_message = render_to_string('emails/verify_email.html', context)
    plain_message = render_to_string('emails/verify_email.txt', context)

    send_mail(
        subject='Verify your email address',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_password_reset_email(user, request):
    """Send password reset email to user.

    Args:
        user: User instance.
        request: HTTP request for building absolute URL.
    """
    token = create_password_reset_token(user)

    # Build reset URL
    reset_url = request.build_absolute_uri(
        f'/reset-password/{token}'
    )

    # Render email
    context = {
        'user': user,
        'reset_url': reset_url,
    }

    html_message = render_to_string('emails/password_reset.html', context)
    plain_message = render_to_string('emails/password_reset.txt', context)

    send_mail(
        subject='Reset your password',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def check_password_reset_rate_limit(email):
    """Check if password reset requests are rate limited for an email.

    Limit: 3 requests per hour.

    Args:
        email: Email address.

    Returns:
        bool: True if rate limit exceeded, False otherwise.
    """
    cache_key = f'password_reset_limit:{email}'
    attempts = cache.get(cache_key, 0)

    if attempts >= 3:
        return True

    # Increment counter
    cache.set(cache_key, attempts + 1, timeout=3600)
    return False


def invalidate_all_sessions(user):
    """Invalidate all sessions for a user (e.g., after password change).

    This is a placeholder - actual implementation depends on session backend.

    For Redis session backend, you would need to:
    1. Get all session keys
    2. Check which belong to this user
    3. Delete them

    For now, we'll rely on Django's session framework update.

    Args:
        user: User instance.
    """
    # Update password_changed_at timestamp to invalidate sessions
    user.updated_at = timezone.now()
    user.save(update_fields=['updated_at'])
