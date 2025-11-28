from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
import uuid
import secrets
import pyotp
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model using email as the unique identifier.

    Attributes:
        id: UUID primary key.
        email: Email address (unique).
        full_name: User's full name.
        avatar_url: URL to user's avatar.
        is_staff: Boolean indicating if user can access admin site.
        is_active: Boolean indicating if user account is active.
        date_joined: Datetime when user account was created.
        email_verified: Boolean indicating if email has been verified.
        totp_enabled: Boolean indicating if 2FA is enabled.
        last_login_at: Datetime of last login.
        last_login_ip: IP address of last login.
        preferences: JSON field for user preferences.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True, db_index=True)
    full_name = models.CharField(_('full name'), max_length=255, blank=True)
    avatar_url = models.URLField(blank=True, null=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    email_verified = models.BooleanField(default=False)
    totp_enabled = models.BooleanField(default=False)

    # Login tracking
    last_login_at = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    # JSONB field for user preferences
    preferences = models.JSONField(default=dict, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def __str__(self):
        """Return string representation of the user (email)."""
        return self.email

    def get_full_name(self):
        """Return the user's full name or email if name is not set."""
        return self.full_name or self.email

    def get_short_name(self):
        """Return the part of the email before the @ symbol."""
        return self.email.split('@')[0]


class TOTPDevice(models.Model):
    """TOTP device for two-factor authentication.

    Stores the secret key and device metadata.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='totp_device')
    secret = models.CharField(max_length=32, help_text=_('Base32 encoded secret'))
    name = models.CharField(max_length=64, default='Default', help_text=_('Device name'))
    confirmed = models.BooleanField(default=False, help_text=_('Whether the device has been confirmed'))
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _('TOTP device')
        verbose_name_plural = _('TOTP devices')

    def __str__(self):
        """Return string representation of the TOTP device."""
        return f"{self.user.email} - {self.name}"

    @classmethod
    def create_for_user(cls, user, name='Default'):
        """Create a new TOTP device for a user with a random secret.

        Args:
            user: The user to create the device for.
            name: Optional name for the device.

        Returns:
            TOTPDevice: The created TOTP device.
        """
        secret = pyotp.random_base32()
        return cls.objects.create(user=user, secret=secret, name=name)

    def get_totp(self):
        """Get the TOTP object for generating and verifying codes.

        Returns:
            pyotp.TOTP: The TOTP object initialized with the device's secret.
        """
        return pyotp.TOTP(self.secret)

    def verify_token(self, token):
        """Verify a TOTP token.

        Args:
            token: The 6-digit token to verify.

        Returns:
            bool: True if the token is valid, False otherwise.
        """
        totp = self.get_totp()
        is_valid = totp.verify(token, valid_window=1)  # Allow 1 step before/after
        if is_valid:
            self.last_used_at = timezone.now()
            self.save(update_fields=['last_used_at'])
        return is_valid

    def get_provisioning_uri(self):
        """Get the provisioning URI for QR code generation.

        Returns:
            str: The provisioning URI.
        """
        totp = self.get_totp()
        return totp.provisioning_uri(
            name=self.user.email,
            issuer_name='SaaS Platform'
        )


class BackupCode(models.Model):
    """Backup codes for account recovery when TOTP device is unavailable.

    Codes are hashed before storage for security.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='backup_codes')
    code_hash = models.CharField(max_length=255, help_text=_('Hashed backup code'))
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('backup code')
        verbose_name_plural = _('backup codes')

    def __str__(self):
        """Return string representation of the backup code."""
        return f"{self.user.email} - Backup code"

    @classmethod
    def generate_for_user(cls, user, count=10):
        """Generate backup codes for a user.

        Args:
            user: The user to generate codes for.
            count: Number of codes to generate (default 10).

        Returns:
            list[str]: The plaintext codes (format XXXX-XXXX).
        """
        # Remove old unused backup codes
        user.backup_codes.filter(used=False).delete()

        codes = []
        for _i in range(count):
            # Generate a random 8-character code
            code = ''.join(secrets.choice('0123456789ABCDEF') for _j in range(8))
            code_hash = make_password(code)
            cls.objects.create(user=user, code_hash=code_hash)
            # Format as XXXX-XXXX for readability
            codes.append(f"{code[:4]}-{code[4:]}")

        return codes

    def verify_code(self, code):
        """Verify a backup code and mark it as used.

        Args:
            code: The backup code to verify.

        Returns:
            bool: True if the code is valid and unused, False otherwise.
        """
        # Remove any hyphens from the input
        code = code.replace('-', '')

        if self.used:
            return False

        is_valid = check_password(code, self.code_hash)
        if is_valid:
            self.used = True
            self.used_at = timezone.now()
            self.save(update_fields=['used', 'used_at'])

        return is_valid
