from django.db import models
from django.conf import settings

class TenantModel(models.Model):
    """
    Abstract base model for tenant-specific data.
    """
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name="%(class)s_set"
    )

    class Meta:
        abstract = True
