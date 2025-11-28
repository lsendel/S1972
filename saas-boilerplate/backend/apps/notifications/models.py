from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.core.models import BaseModel

class Notification(BaseModel):
    class Level(models.TextChoices):
        INFO = 'info', _('Info')
        SUCCESS = 'success', _('Success')
        WARNING = 'warning', _('Warning')
        ERROR = 'error', _('Error')

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        default=Level.INFO
    )
    is_read = models.BooleanField(default=False)
    # created_at is inherited from BaseModel
    # updated_at is inherited from BaseModel
    data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"{self.level.upper()}: {self.title} ({self.recipient})"
