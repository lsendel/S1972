from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.hashers import make_password, check_password
from apps.core.models import BaseModel
import uuid
import secrets

class Organization(BaseModel):
    """
    Represents a tenant/organization.
    """
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, db_index=True)
    logo_url = models.URLField(blank=True)

    stripe_customer_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    is_active = models.BooleanField(default=True, db_index=True)
    settings = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['is_active', 'created_at']),
        ]

    def __str__(self):
        return self.name

class Membership(BaseModel):
    """
    Links a User to an Organization with a specific Role.
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
        return f"{self.user} - {self.organization} ({self.role})"

class Invitation(BaseModel):
    """
    Pending invitation for a user to join an organization.

    Security: Tokens are hashed before storage to prevent compromise if database is breached.
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
    token_hash = models.CharField(max_length=255, unique=True, help_text=_('Hashed invitation token'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    expires_at = models.DateTimeField()
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    accepted_at = models.DateTimeField(null=True, blank=True)
    accepted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='accepted_invitations')

    class Meta:
        indexes = [
            models.Index(fields=['email', 'status']),
            models.Index(fields=['organization', 'status']),
        ]

    def __str__(self):
        return f"Invite {self.email} to {self.organization}"

    @classmethod
    def create_invitation(cls, email, organization, role, invited_by, expires_at):
        """
        Create a new invitation with a secure random token.

        Returns tuple: (invitation, plaintext_token)
        The plaintext token should be sent to the user and never stored.
        """
        # Generate secure random token (32 bytes = 64 hex chars)
        plaintext_token = secrets.token_urlsafe(32)

        # Hash the token before storage
        token_hash = make_password(plaintext_token)

        invitation = cls.objects.create(
            email=email,
            organization=organization,
            role=role,
            invited_by=invited_by,
            expires_at=expires_at,
            token_hash=token_hash,
        )

        return invitation, plaintext_token

    def verify_token(self, plaintext_token):
        """
        Verify that the provided plaintext token matches this invitation.

        Returns True if valid, False otherwise.
        """
        return check_password(plaintext_token, self.token_hash)
