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
        user = self.context.get('request').user
        if not user.is_authenticated:
            return None
        # Optimization: prefetch memberships in view
        try:
            membership = obj.memberships.get(user=user)
            return membership.role
        except Membership.DoesNotExist:
            return None

class CreateOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ('name', 'slug')
