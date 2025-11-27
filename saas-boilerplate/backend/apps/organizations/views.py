from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Organization, Membership
from .serializers import OrganizationSerializer, CreateOrganizationSerializer
from .permissions import IsOrgMember, IsOrgAdmin, IsOrgOwner

class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action == 'create':
            # Anyone authenticated can create an organization
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            # Only admins can update
            permission_classes = [IsOrgAdmin]
        elif self.action == 'destroy':
            # Only owners can delete
            permission_classes = [IsOrgOwner]
        else:
            # List and retrieve require membership
            permission_classes = [IsOrgMember]

        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Return organizations where user is a member."""
        return Organization.objects.filter(
            memberships__user=self.request.user,
            memberships__is_active=True
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrganizationSerializer
        return OrganizationSerializer

    def perform_create(self, serializer):
        org = serializer.save()
        # Create owner membership
        Membership.objects.create(
            user=self.request.user,
            organization=org,
            role='owner'
        )
