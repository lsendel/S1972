from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Organization, Membership, Invitation
from .serializers import (
    OrganizationSerializer, CreateOrganizationSerializer,
    MembershipSerializer, UpdateMembershipSerializer,
    InviteMemberSerializer, InvitationSerializer
)
from .permissions import IsOrgMember, IsOrgAdmin, IsOrgOwner
from .invitations import create_invitation, send_invitation_email, revoke_invitation

User = get_user_model()


class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action == 'create':
            permission_classes = [permissions.IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsOrgAdmin]
        elif self.action == 'destroy':
            permission_classes = [IsOrgOwner]
        elif self.action in ['members', 'invite_member', 'invitations']:
            permission_classes = [IsOrgMember]
        elif self.action in ['update_member', 'remove_member', 'revoke_invitation']:
            permission_classes = [IsOrgAdmin]
        else:
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
        Membership.objects.create(
            user=self.request.user,
            organization=org,
            role='owner'
        )

    @action(detail=True, methods=['get'], url_path='members')
    def members(self, request, slug=None):
        """List all members of the organization."""
        organization = self.get_object()
        memberships = Membership.objects.filter(
            organization=organization,
            is_active=True
        ).select_related('user', 'invited_by')

        serializer = MembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='members/invite')
    def invite_member(self, request, slug=None):
        """Invite a new member to the organization."""
        organization = self.get_object()
        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        role = serializer.validated_data['role']

        # Create invitation
        invitation = create_invitation(
            organization=organization,
            email=email,
            role=role,
            invited_by=request.user
        )

        if invitation is None:
            return Response(
                {"error": "User is already a member of this organization"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Send invitation email
        send_invitation_email(invitation, request)

        return Response(
            {
                "message": f"Invitation sent to {email}",
                "invitation": InvitationSerializer(invitation).data
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['patch'], url_path='members/(?P<member_id>[^/.]+)')
    def update_member(self, request, slug=None, member_id=None):
        """Update a member's role."""
        organization = self.get_object()
        membership = get_object_or_404(
            Membership,
            id=member_id,
            organization=organization,
            is_active=True
        )

        # Cannot change owner role
        if membership.role == 'owner':
            return Response(
                {"error": "Cannot change owner role"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cannot change own role
        if membership.user == request.user:
            return Response(
                {"error": "Cannot change your own role"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UpdateMembershipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        membership.role = serializer.validated_data['role']
        membership.save()

        return Response(MembershipSerializer(membership).data)

    @action(detail=True, methods=['delete'], url_path='members/(?P<member_id>[^/.]+)')
    def remove_member(self, request, slug=None, member_id=None):
        """Remove a member from the organization."""
        organization = self.get_object()
        membership = get_object_or_404(
            Membership,
            id=member_id,
            organization=organization,
            is_active=True
        )

        # Cannot remove owner
        if membership.role == 'owner':
            return Response(
                {"error": "Cannot remove organization owner"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cannot remove self
        if membership.user == request.user:
            return Response(
                {"error": "Cannot remove yourself. Use leave organization instead."},
                status=status.HTTP_400_BAD_REQUEST
            )

        membership.is_active = False
        membership.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='invitations')
    def invitations(self, request, slug=None):
        """List pending invitations for the organization."""
        organization = self.get_object()
        invitations = Invitation.objects.filter(
            organization=organization,
            status='pending'
        ).select_related('invited_by')

        serializer = InvitationSerializer(invitations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'], url_path='invitations/(?P<invitation_id>[^/.]+)')
    def revoke_invitation(self, request, slug=None, invitation_id=None):
        """Revoke a pending invitation."""
        organization = self.get_object()
        invitation = get_object_or_404(
            Invitation,
            id=invitation_id,
            organization=organization
        )

        if revoke_invitation(invitation):
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(
            {"error": "Invitation cannot be revoked"},
            status=status.HTTP_400_BAD_REQUEST
        )
