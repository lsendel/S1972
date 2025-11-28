from rest_framework import viewsets, status, permissions, decorators, mixins
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Count, F, Value, CharField
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
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        return Organization.objects.filter(
            memberships__user=self.request.user,
            memberships__is_active=True
        ).annotate(
            user_role=F('memberships__role'),
            member_count=Count('memberships')
        ).order_by('-created_at')

    def perform_create(self, serializer):
        # Use provided slug if available, otherwise generate one
        slug = serializer.validated_data.get('slug')
        if not slug:
            slug = uuid.uuid4().hex[:12]
        org = serializer.save(slug=slug)
        Membership.objects.create(
            user=self.request.user,
            organization=org,
            role=Membership.ROLE_OWNER
        )

class MemberViewSet(mixins.RetrieveModelMixin,
                    mixins.UpdateModelMixin,
                    mixins.DestroyModelMixin,
                    mixins.ListModelMixin,
                    viewsets.GenericViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        org_slug = self.kwargs.get('organization_slug')
        return Membership.objects.filter(
            organization__slug=org_slug,
            is_active=True
        ).select_related('user')

    def check_admin_permissions(self, organization):
        membership = organization.memberships.filter(user=self.request.user).first()
        if not membership or membership.role not in [Membership.ROLE_OWNER, Membership.ROLE_ADMIN]:
            self.permission_denied(self.request, message="Only admins and owners can manage members.")

    def update(self, request, *args, **kwargs):
        # Custom update to check permissions
        instance = self.get_object()
        self.check_admin_permissions(instance.organization)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.check_admin_permissions(instance.organization)
        
        # Prevent removing the last owner
        if instance.role == Membership.ROLE_OWNER:
            owner_count = Membership.objects.filter(
                organization=instance.organization, 
                role=Membership.ROLE_OWNER,
                is_active=True
            ).count()
            if owner_count <= 1:
                return Response(
                    {"detail": "Cannot remove the last owner of the organization."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().destroy(request, *args, **kwargs)

    @decorators.action(detail=False, methods=['post'])
    def invite(self, request, organization_slug=None):
        org = get_object_or_404(Organization, slug=organization_slug, memberships__user=request.user)
        self.check_admin_permissions(org)

        serializer = CreateInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        role = serializer.validated_data['role']

        # Check if already a member
        if Membership.objects.filter(organization=org, user__email=email).exists():
            return Response({"detail": "User is already a member"}, status=status.HTTP_400_BAD_REQUEST)

        # Create invitation
        invitation, token = Invitation.create_invitation(
            organization=org,
            email=email,
            role=role,
            invited_by=request.user,
            expires_at=timezone.now() + timezone.timedelta(days=7)
        )

        # Send email
        accept_url = f"{settings.FRONTEND_URL}/invitations/{token}"
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

class InvitationViewSet(mixins.RetrieveModelMixin,
                        mixins.DestroyModelMixin,
                        mixins.ListModelMixin,
                        viewsets.GenericViewSet):
    serializer_class = InvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        org_slug = self.kwargs.get('organization_slug')
        return Invitation.objects.filter(
            organization__slug=org_slug,
            status=Invitation.STATUS_PENDING
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Check permissions
        membership = instance.organization.memberships.filter(user=request.user).first()
        if not membership or membership.role not in [Membership.ROLE_OWNER, Membership.ROLE_ADMIN]:
             return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        instance.status = Invitation.STATUS_REVOKED
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
