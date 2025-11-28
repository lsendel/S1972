from rest_framework import serializers
from .models import Organization, Membership, Invitation


class OrganizationSerializer(serializers.ModelSerializer):
    """Serializer for Organization model."""

    role = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'logo_url', 'role', 'member_count', 'created_at')
        read_only_fields = ('id', 'slug', 'role', 'member_count', 'created_at')

    def get_role(self, obj):
        """Get the current user's role in the organization.

        Args:
            obj: The Organization instance.

        Returns:
            str: The role or None.
        """
        # This requires the view to annotate the queryset or pass context
        if hasattr(obj, 'user_role'):
            return obj.user_role
        return None

    def get_member_count(self, obj):
        """Get the number of members in the organization.

        Args:
            obj: The Organization instance.

        Returns:
            int: The member count.
        """
        if hasattr(obj, 'member_count'):
            return obj.member_count
        return obj.memberships.count()


class MembershipSerializer(serializers.ModelSerializer):
    """Serializer for Membership model."""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.URLField(source='user.avatar_url', read_only=True)

    class Meta:
        model = Membership
        fields = ('id', 'user', 'user_email', 'user_full_name', 'user_avatar', 'role', 'is_active', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


class InvitationSerializer(serializers.ModelSerializer):
    """Serializer for Invitation model."""

    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model = Invitation
        fields = ('id', 'email', 'role', 'status', 'created_at', 'expires_at', 'invited_by_email')
        read_only_fields = ('id', 'status', 'created_at', 'expires_at', 'invited_by_email')


class CreateInvitationSerializer(serializers.Serializer):
    """Serializer for creating an invitation."""

    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Membership.ROLE_CHOICES, default=Membership.ROLE_MEMBER)
