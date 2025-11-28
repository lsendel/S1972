"""
Team invitation services and logic.
"""
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .models import Invitation
from apps.organizations.models import Membership
from django.contrib.auth import get_user_model
from apps.core.tasks import send_email_task
from django.contrib.auth.hashers import make_password
import secrets

User = get_user_model()

def create_and_send_invitation(organization, email, role, invited_by):
    """
    Create a new invitation and send it via email.

    Returns:
        tuple: (Invitation, created: bool) or raises exception
    """
    # Check if user is already a member
    if Membership.objects.filter(organization=organization, user__email=email, is_active=True).exists():
        return None, False

    # Check for existing pending invitation
    existing_invitation = Invitation.objects.filter(
        email=email,
        organization=organization,
        status=Invitation.STATUS_PENDING
    ).first()

    if existing_invitation:
        # Extend expiry and resend
        existing_invitation.expires_at = timezone.now() + timedelta(days=7)
        existing_invitation.role = role
        existing_invitation.invited_by = invited_by

        # Create a new token for the re-sent invitation
        plaintext_token = secrets.token_urlsafe(32)
        existing_invitation.token_hash = make_password(plaintext_token)
        existing_invitation.save()

        invitation = existing_invitation
        token = plaintext_token
        created = False
    else:
        # Create new using the model's factory method
        invitation, token = Invitation.create_invitation(
            email=email,
            organization=organization,
            role=role,
            invited_by=invited_by,
            expires_at=timezone.now() + timedelta(days=7)
        )
        created = True

    # Send email
    accept_url = f"{settings.FRONTEND_URL}/invitations/{token}"

    send_email_task.delay(
        subject=f"You've been invited to join {organization.name}",
        recipient_list=[email],
        template_name="emails/invitation.html",
        context={
            "inviter_name": invited_by.full_name,
            "organization_name": organization.name,
            "accept_url": accept_url
        }
    )

    return invitation, created


def accept_invitation(token, user):
    """
    Accept an invitation using the plaintext token.

    WARNING: This requires iterating over pending invitations because we only have the token and tokens are hashed.
    This is less efficient than looking up by ID, but existing frontend/flow might rely on just a token.
    Ideally, we should change the URL structure to include an ID or use a lookup key.

    For now, we will iterate pending invitations for this user's email if possible, or all pending invitations if email is not known (less secure/scalable).
    Since we have `user` (the acceptor), we can limit the search to invitations for `user.email`.
    """

    # Filter for pending invitations for this user's email to reduce search space
    candidate_invitations = Invitation.objects.filter(
        email__iexact=user.email,
        status=Invitation.STATUS_PENDING,
        expires_at__gt=timezone.now()
    )

    invitation = None
    for cand in candidate_invitations:
        if cand.verify_token(token):
            invitation = cand
            break

    if not invitation:
        return None, "Invalid or expired invitation"

    # Check if user is already a member
    existing_membership = Membership.objects.filter(
        user=user,
        organization=invitation.organization,
        is_active=True
    ).first()

    if existing_membership:
        invitation.status = Invitation.STATUS_ACCEPTED
        invitation.accepted_by = user
        invitation.accepted_at = timezone.now()
        invitation.save()
        return existing_membership, None

    # Create membership
    membership = Membership.objects.create(
        user=user,
        organization=invitation.organization,
        role=invitation.role,
        invited_by=invitation.invited_by
    )

    # Update invitation status
    invitation.status = Invitation.STATUS_ACCEPTED
    invitation.accepted_by = user
    invitation.accepted_at = timezone.now()
    invitation.save()

    return membership, None


def revoke_invitation(invitation):
    """Revoke a pending invitation."""
    if invitation.status == Invitation.STATUS_PENDING:
        invitation.status = Invitation.STATUS_REVOKED
        invitation.save()
        return True
    return False
