from django.db import models
import uuid


class BaseModel(models.Model):
    """Abstract base model with UUID primary key and timestamps.

    Attributes:
        id: UUID primary key.
        created_at: Datetime when the object was created.
        updated_at: Datetime when the object was last updated.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class TenantModel(BaseModel):
    """Abstract base model for tenant-specific data.

    Enforces organization isolation.

    Attributes:
        organization: Reference to the organization that owns this data.
    """

    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name="%(class)s_set"
    )

    class Meta:
        abstract = True
