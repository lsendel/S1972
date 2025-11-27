from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, Membership, Invitation

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'logo_url', 'role', 'member_count', 'created_at')
        read_only_fields = ('id', 'slug', 'role', 'created_at')

    def get_role(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated:
            return None
        try:
            membership = obj.memberships.get(user=user)
            return membership.role
        except Membership.DoesNotExist:
            return None

    def get_member_count(self, obj):
        return obj.memberships.filter(is_active=True).count()


class CreateOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ('name', 'slug')


class MembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model = Membership
        fields = (
            'id', 'user', 'user_email', 'user_full_name',
            'role', 'is_active', 'created_at',
            'invited_by', 'invited_by_email'
        )
        read_only_fields = ('id', 'user', 'created_at', 'invited_by')


class UpdateMembershipSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['admin', 'member'])


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=['admin', 'member'], default='member')

    def validate_email(self, value):
        """Validate email format and domain."""
        return value.lower()


class InvitationSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model = Invitation
        fields = (
            'id', 'email', 'organization', 'organization_name',
            'role', 'status', 'created_at', 'expires_at',
            'invited_by', 'invited_by_email'
        )
        read_only_fields = (
            'id', 'organization', 'status', 'token',
            'created_at', 'expires_at', 'invited_by'
        )
