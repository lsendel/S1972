from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.core.models import BaseModel


class Organization(BaseModel):
    """Represents a tenant/organization.

    Attributes:
        name: Name of the organization.
        slug: Unique slug for the organization.
        logo_url: URL to the organization's logo.
        stripe_customer_id: Stripe customer ID for billing.
        is_active: Boolean indicating if organization is active.
        settings: JSON field for organization settings.
    """
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, db_index=True)
    logo_url = models.URLField(blank=True)

    stripe_customer_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    is_active = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)

    def __str__(self):
        """Return string representation of the organization."""
        return self.name


class Membership(BaseModel):
    """Links a User to an Organization with a specific Role.

    Attributes:
        user: The user who is a member.
        organization: The organization the user belongs to.
        role: The user's role in the organization.
        is_active: Boolean indicating if membership is active.
        invited_by: User who invited this member.
    """
    ROLE_OWNER = 'owner'
    ROLE_ADMIN = 'admin'
    ROLE_MEMBER = 'member'

    ROLE_CHOICES = (
        (ROLE_OWNER, _('Owner')),
        (ROLE_ADMIN, _('Admin')),
        (ROLE_MEMBER, _('Member')),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memberships')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    is_active = models.BooleanField(default=True)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='invited_members')

    class Meta:
        unique_together = ('user', 'organization')
        indexes = [
            models.Index(fields=['organization', 'role']),
        ]

    def __str__(self):
        """Return string representation of the membership."""
        return f"{self.user} - {self.organization} ({self.role})"


class Invitation(BaseModel):
    """Pending invitation for a user to join an organization.

    Attributes:
        email: Email address of the invited user.
        organization: Organization the user is invited to.
        role: Role to be assigned upon acceptance.
        token: Unique token for the invitation.
        status: Current status of the invitation.
        expires_at: Datetime when the invitation expires.
        invited_by: User who sent the invitation.
        accepted_at: Datetime when the invitation was accepted.
        accepted_by: User who accepted the invitation.
    """
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_EXPIRED = 'expired'
    STATUS_REVOKED = 'revoked'

    STATUS_CHOICES = (
        (STATUS_PENDING, _('Pending')),
        (STATUS_ACCEPTED, _('Accepted')),
        (STATUS_EXPIRED, _('Expired')),
        (STATUS_REVOKED, _('Revoked')),
    )

    email = models.EmailField(db_index=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='invitations')
    role = models.CharField(max_length=20, choices=Membership.ROLE_CHOICES, default=Membership.ROLE_MEMBER)
    token = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    expires_at = models.DateTimeField()
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    accepted_at = models.DateTimeField(null=True, blank=True)
    accepted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='accepted_invitations')

    def __str__(self):
        """Return string representation of the invitation."""
        return f"Invite {self.email} to {self.organization}"
