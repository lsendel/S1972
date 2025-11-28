from django.db import models

class StripeEvent(models.Model):
    """
    Stores processed Stripe webhook events for idempotency and audit.
    """

    event_id = models.CharField(max_length=255, unique=True, db_index=True)
    type = models.CharField(max_length=100, db_index=True)
    payload = models.JSONField()
    status = models.CharField(max_length=50, default='processed')
    message = models.CharField(max_length=255, blank=True)
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-processed_at']
        indexes = [
            models.Index(fields=['type', 'processed_at']),
        ]

    def __str__(self):
        return f"{self.type} ({self.event_id})"
