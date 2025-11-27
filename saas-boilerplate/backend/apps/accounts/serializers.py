from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'avatar_url', 'is_active', 'is_staff', 'email_verified', 'totp_enabled')
        read_only_fields = ('id', 'email', 'is_staff', 'email_verified', 'totp_enabled')
