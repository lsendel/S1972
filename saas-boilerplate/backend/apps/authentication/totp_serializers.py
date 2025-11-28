from rest_framework import serializers
from apps.accounts.models import TOTPDevice, BackupCode


class TOTPDeviceSerializer(serializers.ModelSerializer):
    """Serializer for TOTP device information."""

    provisioning_uri = serializers.SerializerMethodField()

    class Meta:
        model = TOTPDevice
        fields = ['id', 'name', 'confirmed', 'created_at', 'last_used_at', 'provisioning_uri']
        read_only_fields = ['id', 'confirmed', 'created_at', 'last_used_at']

    def get_provisioning_uri(self, obj):
        """Only return provisioning URI for unconfirmed devices.

        Args:
            obj: The TOTPDevice instance.

        Returns:
            str: The provisioning URI or None.
        """
        if not obj.confirmed:
            return obj.get_provisioning_uri()
        return None


class TOTPSetupSerializer(serializers.Serializer):
    """Serializer for initiating TOTP setup."""

    name = serializers.CharField(max_length=64, default='Default')


class TOTPVerifySerializer(serializers.Serializer):
    """Serializer for verifying TOTP token during setup or login."""

    token = serializers.CharField(min_length=6, max_length=6)

    def validate_token(self, value):
        """Ensure token is numeric.

        Args:
            value: The token string.

        Returns:
            str: The validated token.

        Raises:
            serializers.ValidationError: If token is not numeric.
        """
        if not value.isdigit():
            raise serializers.ValidationError("Token must be 6 digits")
        return value


class TOTPEnableSerializer(serializers.Serializer):
    """Serializer for enabling TOTP after verification."""

    token = serializers.CharField(min_length=6, max_length=6)


class BackupCodeSerializer(serializers.ModelSerializer):
    """Serializer for backup code information (without the actual code)."""

    class Meta:
        model = BackupCode
        fields = ['id', 'used', 'used_at', 'created_at']
        read_only_fields = ['id', 'used', 'used_at', 'created_at']


class BackupCodeVerifySerializer(serializers.Serializer):
    """Serializer for verifying a backup code."""

    code = serializers.CharField(min_length=8, max_length=9)  # XXXX-XXXX or XXXXXXXX

    def validate_code(self, value):
        """Ensure code is alphanumeric (with optional hyphen).

        Args:
            value: The backup code string.

        Returns:
            str: The validated code.

        Raises:
            serializers.ValidationError: If code format is invalid.
        """
        cleaned = value.replace('-', '')
        if not cleaned.isalnum():
            raise serializers.ValidationError("Invalid backup code format")
        if len(cleaned) != 8:
            raise serializers.ValidationError("Backup code must be 8 characters")
        return value
