"""
Celery tasks for analytics

Automated tasks for metrics aggregation and cleanup.
"""
from celery import shared_task
from datetime import timedelta
from django.utils import timezone
from .services import MetricsAggregator
from .models import ActivityLog, UserSession


@shared_task
def aggregate_daily_metrics():
    """
    Aggregate metrics for yesterday.

    This task should run daily (e.g., at 1 AM) to aggregate
    the previous day's metrics.
    """
    yesterday = timezone.now().date() - timedelta(days=1)
    MetricsAggregator.aggregate_daily_metrics(yesterday)
    return f"Aggregated metrics for {yesterday}"


@shared_task
def cleanup_old_activity_logs(days=90):
    """
    Clean up activity logs older than specified days.

    Args:
        days: Number of days to retain (default: 90)
    """
    cutoff_date = timezone.now() - timedelta(days=days)
    deleted_count, _ = ActivityLog.objects.filter(
        created_at__lt=cutoff_date
    ).delete()
    return f"Deleted {deleted_count} activity logs older than {days} days"


@shared_task
def cleanup_old_sessions(days=30):
    """
    Clean up inactive sessions older than specified days.

    Args:
        days: Number of days to retain (default: 30)
    """
    cutoff_date = timezone.now() - timedelta(days=days)
    deleted_count, _ = UserSession.objects.filter(
        is_active=False,
        ended_at__lt=cutoff_date
    ).delete()
    return f"Deleted {deleted_count} sessions older than {days} days"


@shared_task
def close_inactive_sessions(hours=24):
    """
    Close sessions that have been inactive for specified hours.

    Args:
        hours: Hours of inactivity before closing (default: 24)
    """
    cutoff_time = timezone.now() - timedelta(hours=hours)
    updated_count = UserSession.objects.filter(
        is_active=True,
        last_activity__lt=cutoff_time
    ).update(
        is_active=False,
        ended_at=timezone.now()
    )
    return f"Closed {updated_count} inactive sessions"
