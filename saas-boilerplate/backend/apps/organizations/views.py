from rest_framework import viewsets, permissions, status, generics, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction
from .models import Organization, Membership, Invitation
from .serializers import (
    OrganizationSerializer,
    CreateOrganizationSerializer,
    InvitationSerializer,
    CreateInvitationSerializer,
    AcceptInvitationSerializer
)
from apps.core.tasks import send_email_task
import secrets
from datetime import timedelta
from drf_spectacular.utils import extend_schema
from django.conf import settings

User = get_user_model()

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

    @extend_schema(responses={200: InvitationSerializer(many=True)})
    @action(detail=True, methods=['get'])
    def invitations(self, request, slug=None):
        org = self.get_object()
        invitations = Invitation.objects.filter(organization=org, status='pending')
        serializer = InvitationSerializer(invitations, many=True)
        return Response(serializer.data)

    @extend_schema(request=CreateInvitationSerializer, responses={201: InvitationSerializer})
    @action(detail=True, methods=['post'], url_path='invitations/create')
    def create_invitation(self, request, slug=None):
        org = self.get_object()

        # Check permissions - only admins/owners can invite
        membership = Membership.objects.get(user=request.user, organization=org)
        if membership.role not in ['owner', 'admin']:
             return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        role = serializer.validated_data['role']

        # Check if already member
        if Membership.objects.filter(organization=org, user__email=email).exists():
             return Response({"detail": "User is already a member"}, status=status.HTTP_400_BAD_REQUEST)

        # Create invitation
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(days=7)

        invitation = Invitation.objects.create(
            email=email,
            organization=org,
            role=role,
            token=token,
            expires_at=expires_at,
            invited_by=request.user,
            status='pending'
        )

        # Send email
        invite_link = f"{settings.FRONTEND_URL}/invitation/{token}"

        # In a real app, render_to_string with an HTML template would be used here.
        # For now, we provide a clean text message.
        message = (
            f"Hello,\n\n"
            f"You have been invited to join the organization '{org.name}' on our platform.\n"
            f"Please click the link below to accept the invitation:\n\n"
            f"{invite_link}\n\n"
            f"This link will expire in 7 days.\n\n"
            f"Best regards,\nThe Team"
        )

        send_email_task.delay(
            subject=f"Invitation to join {org.name}",
            message=message,
            recipient_list=[email]
        )

        return Response(InvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='invitations/(?P<invitation_id>[^/.]+)/revoke')
    def revoke_invitation(self, request, slug=None, invitation_id=None):
        org = self.get_object()
        membership = Membership.objects.get(user=request.user, organization=org)
        if membership.role not in ['owner', 'admin']:
             return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        invitation = get_object_or_404(Invitation, id=invitation_id, organization=org)
        invitation.status = 'revoked'
        invitation.save()
        return Response(status=status.HTTP_200_OK)


class AcceptInvitationView(views.APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=AcceptInvitationSerializer, responses={200: None})
    def post(self, request, token):
        invitation = get_object_or_404(Invitation, token=token, status='pending')

        if invitation.expires_at < timezone.now():
            invitation.status = 'expired'
            invitation.save()
            return Response({"detail": "Invitation expired"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AcceptInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Logic:
        # 1. If user is logged in, link user to invite.
        # 2. If user exists but not logged in, require login (or handle gracefully).
        # 3. If user does not exist, require password/fullname to create account.

        user = None
        if request.user.is_authenticated:
            if request.user.email != invitation.email:
                 return Response({"detail": "Email mismatch"}, status=status.HTTP_400_BAD_REQUEST)
            user = request.user
        else:
             try:
                 user = User.objects.get(email=invitation.email)
                 # User exists but not logged in.
                 # For simplicity, we can error out and tell them to login first then click link again?
                 # Or we assume the frontend handles this flow: check invite -> if user exists -> login -> accept.
                 # Let's assume for now if user exists we need authentication.
                 return Response({"detail": "User exists, please login first", "code": "login_required"}, status=status.HTTP_400_BAD_REQUEST)
             except User.DoesNotExist:
                 # Create user
                 password = serializer.validated_data.get('password')
                 full_name = serializer.validated_data.get('full_name')
                 if not password:
                     return Response({"detail": "Password required for new user"}, status=status.HTTP_400_BAD_REQUEST)

                 user = User.objects.create_user(
                     email=invitation.email,
                     password=password,
                     full_name=full_name or ""
                 )

        with transaction.atomic():
            Membership.objects.create(
                user=user,
                organization=invitation.organization,
                role=invitation.role
            )
            invitation.status = 'accepted'
            invitation.accepted_at = timezone.now()
            invitation.accepted_by = user
            invitation.save()

        return Response({"detail": "Invitation accepted"}, status=status.HTTP_200_OK)

    @extend_schema(responses={200: InvitationSerializer})
    def get(self, request, token):
        """
        Check invitation validity and return details (e.g. org name, email)
        """
        invitation = get_object_or_404(Invitation, token=token)
        if invitation.status != 'pending':
             return Response({"detail": "Invitation invalid"}, status=status.HTTP_400_BAD_REQUEST)
        if invitation.expires_at < timezone.now():
            invitation.status = 'expired'
            invitation.save()
            return Response({"detail": "Invitation expired"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "email": invitation.email,
            "organization_name": invitation.organization.name,
            "role": invitation.role
        })
