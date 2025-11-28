"""
Analytics and metrics models

Tracks various metrics and events for analytics purposes.
"""
from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import BaseModel

User = get_user_model()


class ActivityLog(BaseModel):
    """
    Audit trail for important user and system actions.
    """
    ACTION_TYPES = [
        # User actions
        ('user.login', 'User Login'),
        ('user.logout', 'User Logout'),
        ('user.register', 'User Registration'),
        ('user.password_change', 'Password Changed'),
        ('user.password_reset', 'Password Reset'),
        ('user.2fa_enabled', '2FA Enabled'),
        ('user.2fa_disabled', '2FA Disabled'),
        ('user.profile_update', 'Profile Updated'),

        # Organization actions
        ('org.created', 'Organization Created'),
        ('org.updated', 'Organization Updated'),
        ('org.deleted', 'Organization Deleted'),
        ('org.member_invited', 'Member Invited'),
        ('org.member_joined', 'Member Joined'),
        ('org.member_removed', 'Member Removed'),
        ('org.role_changed', 'Member Role Changed'),

        # Subscription actions
        ('sub.created', 'Subscription Created'),
        ('sub.upgraded', 'Subscription Upgraded'),
        ('sub.downgraded', 'Subscription Downgraded'),
        ('sub.cancelled', 'Subscription Cancelled'),
        ('sub.renewed', 'Subscription Renewed'),
        ('sub.payment_failed', 'Payment Failed'),

        # Admin actions
        ('admin.user_impersonate', 'User Impersonated'),
        ('admin.user_suspend', 'User Suspended'),
        ('admin.user_activate', 'User Activated'),
        ('admin.data_export', 'Data Exported'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]

    def __str__(self):
        user_str = self.user.email if self.user else 'System'
        return f"{user_str} - {self.get_action_display()} at {self.created_at}"


class DailyMetric(BaseModel):
    """
    Daily aggregated metrics for analytics.
    """
    METRIC_TYPES = [
        ('users.new', 'New Users'),
        ('users.active', 'Active Users'),
        ('users.total', 'Total Users'),
        ('orgs.new', 'New Organizations'),
        ('orgs.active', 'Active Organizations'),
        ('orgs.total', 'Total Organizations'),
        ('subs.new', 'New Subscriptions'),
        ('subs.active', 'Active Subscriptions'),
        ('subs.cancelled', 'Cancelled Subscriptions'),
        ('revenue.mrr', 'Monthly Recurring Revenue'),
        ('revenue.arr', 'Annual Recurring Revenue'),
        ('revenue.new', 'New Revenue'),
    ]

    date = models.DateField(db_index=True)
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES, db_index=True)
    value = models.DecimalField(max_digits=12, decimal_places=2)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['date', 'metric_type']
        indexes = [
            models.Index(fields=['date', 'metric_type']),
        ]

    def __str__(self):
        return f"{self.get_metric_type_display()} - {self.date}: {self.value}"


class UserSession(BaseModel):
    """
    Track user sessions for analytics.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    session_key = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', '-started_at']),
            models.Index(fields=['is_active', '-last_activity']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.started_at}"

    @property
    def duration(self):
        """Calculate session duration."""
        end = self.ended_at or self.last_activity
        return end - self.started_at
