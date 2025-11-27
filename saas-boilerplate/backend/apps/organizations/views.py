from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Organization, Membership
from .serializers import OrganizationSerializer, CreateOrganizationSerializer

class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        return Organization.objects.filter(memberships__user=self.request.user)

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
