from rest_framework import serializers
from .models import Organization, Membership, Invitation
from apps.accounts.serializers import UserSerializer

class OrganizationSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    slug = serializers.SlugField(required=False, allow_blank=True)

    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'logo_url', 'role', 'member_count', 'created_at')
        read_only_fields = ('id', 'role', 'member_count', 'created_at')

    def validate_slug(self, value):
        """Validate that slug is unique if provided."""
        if value and Organization.objects.filter(slug=value).exists():
            raise serializers.ValidationError("This slug is already taken.")
        return value

    def get_role(self, obj):
        # This requires the view to annotate the queryset or pass context
        if hasattr(obj, 'user_role'):
            return obj.user_role
        return None

    def get_member_count(self, obj):
        if hasattr(obj, 'member_count'):
            return obj.member_count
        return obj.memberships.count()

class MembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.URLField(source='user.avatar_url', read_only=True)

    class Meta:
        model = Membership
        fields = ('id', 'user', 'user_email', 'user_full_name', 'user_avatar', 'role', 'is_active', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

class InvitationSerializer(serializers.ModelSerializer):
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model = Invitation
        fields = ('id', 'email', 'role', 'status', 'created_at', 'expires_at', 'invited_by_email')
        read_only_fields = ('id', 'status', 'created_at', 'expires_at', 'invited_by_email')

class CreateInvitationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Membership.ROLE_CHOICES, default=Membership.ROLE_MEMBER)
