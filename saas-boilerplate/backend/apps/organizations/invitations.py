"""Team invitation utilities and email sending."""
import secrets
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import Invitation, Membership
from django.contrib.auth import get_user_model

User = get_user_model()


def generate_invitation_token():
    """Generate a secure invitation token.

    Returns:
        str: A URL-safe random string.
    """
    return secrets.token_urlsafe(32)


def create_invitation(organization, email, role, invited_by):
    """Create an invitation for a user to join an organization.

    Args:
        organization: Organization instance.
        email: Email address to invite.
        role: Role to assign ('admin' or 'member').
        invited_by: User who is sending the invitation.

    Returns:
        Invitation: The created or updated invitation instance.
        None: If the user is already a member.
    """
    # Check if user is already a member
    user = User.objects.filter(email=email).first()
    if user:
        existing_membership = Membership.objects.filter(
            user=user,
            organization=organization,
            is_active=True
        ).first()
        if existing_membership:
            return None  # Already a member

    # Check for existing pending invitation
    existing_invitation = Invitation.objects.filter(
        email=email,
        organization=organization,
        status='pending'
    ).first()

    if existing_invitation:
        # Extend expiry and update invitation
        existing_invitation.expires_at = timezone.now() + timedelta(days=7)
        existing_invitation.role = role
        existing_invitation.invited_by = invited_by
        existing_invitation.save()
        return existing_invitation

    # Create new invitation
    invitation = Invitation.objects.create(
        email=email,
        organization=organization,
        role=role,
        token=generate_invitation_token(),
        expires_at=timezone.now() + timedelta(days=7),
        invited_by=invited_by
    )

    return invitation


def send_invitation_email(invitation, request):
    """Send invitation email to the invitee.

    Args:
        invitation: Invitation instance.
        request: HTTP request for building absolute URLs.
    """
    # Build invitation URL
    invitation_url = request.build_absolute_uri(
        f'/invitations/{invitation.token}'
    )

    # Render email
    context = {
        'invitation': invitation,
        'invitation_url': invitation_url,
        'organization_name': invitation.organization.name,
        'invited_by': invitation.invited_by.full_name or invitation.invited_by.email,
    }

    html_message = render_to_string('emails/invitation.html', context)
    plain_message = render_to_string('emails/invitation.txt', context)

    send_mail(
        subject=f'You\'ve been invited to join {invitation.organization.name}',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invitation.email],
        html_message=html_message,
        fail_silently=False,
    )


def accept_invitation(token, user):
    """Accept an invitation and create membership.

    Args:
        token: Invitation token.
        user: User accepting the invitation.

    Returns:
        tuple: (Membership, error_message) or (None, error_message).
    """
    try:
        invitation = Invitation.objects.get(
            token=token,
            status='pending'
        )
    except Invitation.DoesNotExist:
        return None, "Invalid or expired invitation"

    # Check if invitation is expired
    if invitation.expires_at < timezone.now():
        invitation.status = 'expired'
        invitation.save()
        return None, "This invitation has expired"

    # Check if email matches
    if invitation.email.lower() != user.email.lower():
        return None, "This invitation was sent to a different email address"

    # Check if user is already a member
    existing_membership = Membership.objects.filter(
        user=user,
        organization=invitation.organization,
        is_active=True
    ).first()

    if existing_membership:
        invitation.status = 'accepted'
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
    invitation.status = 'accepted'
    invitation.accepted_by = user
    invitation.accepted_at = timezone.now()
    invitation.save()

    return membership, None


def revoke_invitation(invitation):
    """Revoke a pending invitation.

    Args:
        invitation: Invitation instance.

    Returns:
        bool: True if revoked, False otherwise.
    """
    if invitation.status == 'pending':
        invitation.status = 'revoked'
        invitation.save()
        return True
    return False
