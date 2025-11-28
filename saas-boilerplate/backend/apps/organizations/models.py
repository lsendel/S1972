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
