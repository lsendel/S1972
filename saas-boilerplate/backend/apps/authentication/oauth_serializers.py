from rest_framework import serializers
from allauth.socialaccount.models import SocialAccount


class SocialAccountSerializer(serializers.ModelSerializer):
    """Serializer for connected social accounts."""

    provider_name = serializers.CharField(source='get_provider_display', read_only=True)

    class Meta:
        model = SocialAccount
        fields = ['id', 'provider', 'provider_name', 'uid', 'extra_data', 'date_joined', 'last_login']
        read_only_fields = ['id', 'provider', 'uid', 'extra_data', 'date_joined', 'last_login']

    def to_representation(self, instance):
        """Customize the representation to include user-friendly information.

        Args:
            instance: The SocialAccount instance.

        Returns:
            dict: The serialized data with additional provider-specific fields.
        """
        data = super().to_representation(instance)

        # Add provider-specific information
        extra_data = instance.extra_data
        if instance.provider == 'google':
            data['email'] = extra_data.get('email')
            data['name'] = extra_data.get('name')
            data['picture'] = extra_data.get('picture')
        elif instance.provider == 'github':
            data['email'] = extra_data.get('email')
            data['name'] = extra_data.get('name')
            data['login'] = extra_data.get('login')
            data['avatar_url'] = extra_data.get('avatar_url')

        # Remove sensitive extra_data from response
        del data['extra_data']

        return data


class OAuthProviderSerializer(serializers.Serializer):
    """Serializer for available OAuth providers."""

    provider = serializers.CharField()
    name = serializers.CharField()
    connected = serializers.BooleanField()
    authorization_url = serializers.URLField(required=False)
