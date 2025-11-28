from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid

class UUIDModel(models.Model):
    """
    Abstract base model with UUID primary key.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True

class TimeStampedModel(models.Model):
    """
    Abstract base model with created_at and updated_at timestamps.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class BaseModel(UUIDModel, TimeStampedModel):
    """
    Abstract base model with UUID primary key and timestamps.
    """
    class Meta:
        abstract = True

class TenantModel(BaseModel):
    """
    Abstract base model for tenant-specific data (One-to-Many).
    Enforces organization isolation.
    """
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name="%(class)s_set"
    )

    class Meta:
        abstract = True

class TenantOneToOneModel(BaseModel):
    """
    Abstract base model for tenant-specific data (One-to-One).
    Enforces organization isolation.
    """
    organization = models.OneToOneField(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name="%(class)s"
    )

    class Meta:
        abstract = True
