from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import User


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        """Validate email and password.

        Args:
            attrs: Dictionary of attributes to validate.

        Returns:
            dict: Validated attributes with user object.

        Raises:
            serializers.ValidationError: If credentials are invalid.
        """
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)

            if not user:
                msg = _('Unable to log in with provided credentials.')
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = _('Must include "email" and "password".')
            raise serializers.ValidationError(msg, code='authorization')

        attrs['user'] = user
        return attrs


class SignupSerializer(serializers.ModelSerializer):
    """Serializer for user signup."""

    password = serializers.CharField(write_only=True, min_length=10)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'full_name')

    def create(self, validated_data):
        """Create a new user.

        Args:
            validated_data: Validated data.

        Returns:
            User: Created user instance.
        """
        return User.objects.create_user(**validated_data)


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset request."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""

    new_password = serializers.CharField(write_only=True, min_length=10)
    token = serializers.CharField()
    uid = serializers.CharField()
