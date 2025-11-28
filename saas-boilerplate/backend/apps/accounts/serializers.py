from rest_framework import serializers
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from urllib.parse import urlparse
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'avatar_url', 'is_active', 'is_staff', 'email_verified', 'totp_enabled')
        read_only_fields = ('id', 'email', 'is_staff', 'email_verified', 'totp_enabled')


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    # Allowed domains for avatar URLs (whitelist approach)
    ALLOWED_AVATAR_DOMAINS = [
        's3.amazonaws.com',
        'cloudfront.net',
        'gravatar.com',
        'githubusercontent.com',
    ]

    class Meta:
        model = User
        fields = ('full_name', 'avatar_url')

    def validate_full_name(self, value):
        """Validate full name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Full name cannot be empty.")
        return value.strip()

    def validate_avatar_url(self, value):
        """
        Validate avatar URL to prevent XSS, SSRF, and data exfiltration attacks.

        Security checks:
        - Must be a valid URL
        - Must use HTTPS (not HTTP, javascript:, data:, file:)
        - Must be from whitelisted domains
        - Cannot be localhost, private IPs, or internal URLs
        """
        if not value:
            return value

        # Strip whitespace
        value = value.strip()

        # Validate URL format
        url_validator = URLValidator(schemes=['https'])
        try:
            url_validator(value)
        except DjangoValidationError:
            raise serializers.ValidationError(
                "Avatar URL must be a valid HTTPS URL. HTTP, javascript:, data:, and file: URLs are not allowed."
            )

        # Parse URL
        parsed = urlparse(value)

        # Block localhost and private IPs
        hostname = parsed.hostname
        if not hostname:
            raise serializers.ValidationError("Invalid URL: no hostname found.")

        # Block localhost
        if hostname in ['localhost', '127.0.0.1', '::1']:
            raise serializers.ValidationError("localhost URLs are not allowed for security reasons.")

        # Block private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)
        if hostname.startswith(('10.', '172.16.', '172.17.', '172.18.', '172.19.',
                                '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
                                '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
                                '172.30.', '172.31.', '192.168.', '169.254.')):
            raise serializers.ValidationError("Private IP addresses are not allowed for security reasons.")

        # Whitelist domain check
        domain_allowed = False
        for allowed_domain in self.ALLOWED_AVATAR_DOMAINS:
            if hostname == allowed_domain or hostname.endswith('.' + allowed_domain):
                domain_allowed = True
                break

        if not domain_allowed:
            allowed_list = ', '.join(self.ALLOWED_AVATAR_DOMAINS)
            raise serializers.ValidationError(
                f"Avatar URL must be from an allowed domain. Allowed domains: {allowed_list}"
            )

        # Max URL length check (prevent DoS)
        if len(value) > 2048:
            raise serializers.ValidationError("Avatar URL is too long (max 2048 characters).")

        return value
