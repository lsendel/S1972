from rest_framework import serializers
from .models import Invitation
from apps.organizations.models import Membership

class InvitationSerializer(serializers.ModelSerializer):
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model = Invitation
        fields = ('id', 'email', 'role', 'status', 'created_at', 'expires_at', 'invited_by_email')
        read_only_fields = ('id', 'status', 'created_at', 'expires_at', 'invited_by_email')

class CreateInvitationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Membership.ROLE_CHOICES, default=Membership.ROLE_MEMBER)
