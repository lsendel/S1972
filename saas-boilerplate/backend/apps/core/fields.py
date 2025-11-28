"""
Custom model fields for encryption and security.
"""
from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet
import base64
import os


def get_encryption_key():
    """
    Get or generate encryption key for field-level encryption.

    In production, this should be stored in environment variables or a secrets manager.
    The key must be consistent across deployments to decrypt existing data.
    """
    key = getattr(settings, 'FIELD_ENCRYPTION_KEY', None) or os.environ.get('FIELD_ENCRYPTION_KEY')
    if not key:
        # In development, use SECRET_KEY as base (NOT RECOMMENDED FOR PRODUCTION)
        # In production, set FIELD_ENCRYPTION_KEY environment variable
        if settings.DEBUG:
            # Derive a Fernet key from SECRET_KEY (for development only)
            import hashlib
            key_material = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
            key = base64.urlsafe_b64encode(key_material).decode()
        else:
            raise ValueError(
                "FIELD_ENCRYPTION_KEY environment variable must be set in production. "
                "Generate one using: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
            )
    return key.encode() if isinstance(key, str) else key


class EncryptedCharField(models.CharField):
    """
    A CharField that encrypts data at rest using Fernet (AES-128).

    Usage:
        secret = EncryptedCharField(max_length=255)

    Note: The encrypted value will be longer than the original, so max_length
    should account for this. Rule of thumb: max_length = original_length * 2
    """

    description = "Encrypted CharField using Fernet"

    def __init__(self, *args, **kwargs):
        # Ensure max_length is set and reasonable for encrypted data
        if 'max_length' not in kwargs:
            kwargs['max_length'] = 255
        super().__init__(*args, **kwargs)
        self._cipher = None

    @property
    def cipher(self):
        """Lazy-load cipher to avoid issues during migrations."""
        if self._cipher is None:
            key = get_encryption_key()
            self._cipher = Fernet(key)
        return self._cipher

    def get_prep_value(self, value):
        """Encrypt the value before saving to database."""
        if value is None or value == '':
            return value

        # If already encrypted (starts with gAAAAA which is Fernet signature), return as-is
        if isinstance(value, str) and value.startswith('gAAAAA'):
            return value

        # Encrypt the value
        encrypted = self.cipher.encrypt(value.encode())
        return encrypted.decode()

    def from_db_value(self, value, expression, connection):
        """Decrypt the value when loading from database."""
        if value is None or value == '':
            return value

        try:
            # Decrypt the value
            decrypted = self.cipher.decrypt(value.encode())
            return decrypted.decode()
        except Exception:
            # If decryption fails, return the raw value (might be unencrypted legacy data)
            return value

    def to_python(self, value):
        """Convert the value to Python."""
        if isinstance(value, str) or value is None:
            return value
        return str(value)
