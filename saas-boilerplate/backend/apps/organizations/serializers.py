from rest_framework import serializers
from .models import Organization, Membership, Invitation

class OrganizationSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'logo_url', 'role', 'created_at')
        read_only_fields = ('id', 'slug', 'role', 'created_at')

    def get_role(self, obj):
        # We need to pass user context to get role
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        # Optimization: prefetch memberships in view
        try:
            membership = obj.memberships.get(user=request.user)
            return membership.role
        except Membership.DoesNotExist:
            return None

class CreateOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ('name', 'slug')

class InvitationSerializer(serializers.ModelSerializer):
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model = Invitation
        fields = ('id', 'email', 'role', 'status', 'created_at', 'expires_at', 'invited_by_email')
        read_only_fields = ('id', 'status', 'created_at', 'expires_at', 'invited_by_email')

class CreateInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invitation
        fields = ('email', 'role')

class AcceptInvitationSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    password = serializers.CharField(required=False, write_only=True)
    full_name = serializers.CharField(required=False, write_only=True)
