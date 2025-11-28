from rest_framework import viewsets, status, permissions, decorators
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count, F
from django.utils import timezone
from .models import Organization, Membership, Invitation
from .serializers import (
    OrganizationSerializer, MembershipSerializer,
    InvitationSerializer, CreateInvitationSerializer
)
from apps.core.tasks import send_email_task
from django.conf import settings
import uuid


class OrganizationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing organizations."""

    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        """Get organizations where the current user is an active member.

        Returns:
            QuerySet: Filtered Organization queryset.
        """
        return Organization.objects.filter(
            memberships__user=self.request.user,
            memberships__is_active=True
        ).annotate(
            user_role=F('memberships__role'),
            member_count=Count('memberships')
        ).order_by('-created_at')

    def perform_create(self, serializer):
        """Create a new organization and assign the creator as owner.

        Args:
            serializer: The valid serializer instance.
        """
        org = serializer.save(slug=uuid.uuid4().hex[:12])  # Simple slug generation
        Membership.objects.create(
            user=self.request.user,
            organization=org,
            role=Membership.ROLE_OWNER
        )


class MemberViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for listing organization members."""

    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        """Get active members for the specified organization.

        Returns:
            QuerySet: Filtered Membership queryset.
        """
        org_slug = self.kwargs.get('organization_slug')
        return Membership.objects.filter(
            organization__slug=org_slug,
            is_active=True
        ).select_related('user')

    @decorators.action(detail=False, methods=['post'])
    def invite(self, request, organization_slug=None):
        """Invite a user to the organization.

        Args:
            request: The request object containing email and role.
            organization_slug: The slug of the organization.

        Returns:
            Response: Success or error message.
        """
        org = get_object_or_404(Organization, slug=organization_slug, memberships__user=request.user)

        # Check permissions (only admins/owners can invite)
        membership = org.memberships.get(user=request.user)
        if membership.role not in [Membership.ROLE_OWNER, Membership.ROLE_ADMIN]:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        role = serializer.validated_data['role']

        # Check if already a member
        if Membership.objects.filter(organization=org, user__email=email).exists():
            return Response({"detail": "User is already a member"}, status=status.HTTP_400_BAD_REQUEST)

        # Create invitation
        invitation = Invitation.objects.create(
            organization=org,
            email=email,
            role=role,
            invited_by=request.user,
            token=uuid.uuid4().hex,
            expires_at=timezone.now() + timezone.timedelta(days=7)
        )

        # Send email
        accept_url = f"{settings.FRONTEND_URL}/invitations/{invitation.token}"
        send_email_task.delay(
            subject=f"You've been invited to join {org.name}",
            recipient_list=[email],
            template_name="emails/invitation.html",
            context={
                "inviter_name": request.user.full_name,
                "organization_name": org.name,
                "accept_url": accept_url
            }
        )

        return Response({"detail": "Invitation sent"}, status=status.HTTP_201_CREATED)


class InvitationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for listing pending invitations."""

    serializer_class = InvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        """Get pending invitations for the specified organization.

        Returns:
            QuerySet: Filtered Invitation queryset.
        """
        org_slug = self.kwargs.get('organization_slug')
        return Invitation.objects.filter(
            organization__slug=org_slug,
            status=Invitation.STATUS_PENDING
        )
