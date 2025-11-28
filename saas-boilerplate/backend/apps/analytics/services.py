"""Analytics service layer.

Business logic for tracking and aggregating analytics.
"""
from datetime import timedelta
from django.db.models import Sum, Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization
from apps.subscriptions.models import Subscription
from .models import ActivityLog, DailyMetric, UserSession

User = get_user_model()


class ActivityLogger:
    """Service for logging user activities."""

    @staticmethod
    def log(action, user=None, description='', request=None, **metadata):
        """Log an activity.

        Args:
            action: Action type (from ActivityLog.ACTION_TYPES).
            user: User performing the action.
            description: Optional description.
            request: HTTP request object for IP and user agent.
            **metadata: Additional data to store.

        Returns:
            ActivityLog: The created activity log entry.
        """
        ip_address = None
        user_agent = ''

        if request:
            ip_address = ActivityLogger._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

        return ActivityLog.objects.create(
            user=user,
            action=action,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata
        )

    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request.

        Args:
            request: The HTTP request.

        Returns:
            str: The client IP address.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class MetricsAggregator:
    """Service for aggregating daily metrics."""

    @classmethod
    def aggregate_daily_metrics(cls, date=None):
        """Aggregate all metrics for a given date.

        Args:
            date: Date to aggregate (defaults to yesterday).
        """
        if date is None:
            date = timezone.now().date() - timedelta(days=1)

        # User metrics
        cls._aggregate_user_metrics(date)

        # Organization metrics
        cls._aggregate_org_metrics(date)

        # Subscription metrics
        cls._aggregate_subscription_metrics(date)

        # Revenue metrics
        cls._aggregate_revenue_metrics(date)

    @classmethod
    def _aggregate_user_metrics(cls, date):
        """Aggregate user-related metrics.

        Args:
            date: The date to aggregate metrics for.
        """
        # New users
        new_users = User.objects.filter(
            date_joined__date=date
        ).count()
        cls._save_metric(date, 'users.new', new_users)

        # Active users (logged in that day)
        active_users = UserSession.objects.filter(
            last_activity__date=date
        ).values('user').distinct().count()
        cls._save_metric(date, 'users.active', active_users)

        # Total users
        total_users = User.objects.filter(
            date_joined__date__lte=date,
            is_active=True
        ).count()
        cls._save_metric(date, 'users.total', total_users)

    @classmethod
    def _aggregate_org_metrics(cls, date):
        """Aggregate organization-related metrics.

        Args:
            date: The date to aggregate metrics for.
        """
        # New organizations
        new_orgs = Organization.objects.filter(
            created_at__date=date
        ).count()
        cls._save_metric(date, 'orgs.new', new_orgs)

        # Active organizations (with recent activity)
        active_orgs = Organization.objects.filter(
            updated_at__date=date
        ).count()
        cls._save_metric(date, 'orgs.active', active_orgs)

        # Total organizations
        total_orgs = Organization.objects.filter(
            created_at__date__lte=date
        ).count()
        cls._save_metric(date, 'orgs.total', total_orgs)

    @classmethod
    def _aggregate_subscription_metrics(cls, date):
        """Aggregate subscription-related metrics.

        Args:
            date: The date to aggregate metrics for.
        """
        # New subscriptions
        new_subs = Subscription.objects.filter(
            created_at__date=date,
            status='active'
        ).count()
        cls._save_metric(date, 'subs.new', new_subs)

        # Active subscriptions
        active_subs = Subscription.objects.filter(
            Q(created_at__date__lte=date) &
            Q(Q(cancelled_at__isnull=True) | Q(cancelled_at__date__gt=date)),
            status='active'
        ).count()
        cls._save_metric(date, 'subs.active', active_subs)

        # Cancelled subscriptions
        cancelled_subs = Subscription.objects.filter(
            cancelled_at__date=date
        ).count()
        cls._save_metric(date, 'subs.cancelled', cancelled_subs)

    @classmethod
    def _aggregate_revenue_metrics(cls, date):
        """Aggregate revenue-related metrics.

        Args:
            date: The date to aggregate metrics for.
        """
        # Get active subscriptions with their amounts
        active_subs = Subscription.objects.filter(
            Q(created_at__date__lte=date) &
            Q(Q(cancelled_at__isnull=True) | Q(cancelled_at__date__gt=date)),
            status='active'
        ).select_related('plan')

        # Calculate MRR (Monthly Recurring Revenue)
        mrr = sum(
            sub.plan.price if sub.plan.interval == 'month'
            else sub.plan.price / 12  # Convert annual to monthly
            for sub in active_subs
        )
        cls._save_metric(date, 'revenue.mrr', mrr)

        # Calculate ARR (Annual Recurring Revenue)
        arr = mrr * 12
        cls._save_metric(date, 'revenue.arr', arr)

        # New revenue from new subscriptions
        new_revenue = Subscription.objects.filter(
            created_at__date=date,
            status='active'
        ).select_related('plan').aggregate(
            total=Sum('plan__price')
        )['total'] or 0
        cls._save_metric(date, 'revenue.new', new_revenue)

    @classmethod
    def _save_metric(cls, date, metric_type, value):
        """Save or update a metric.

        Args:
            date: The date of the metric.
            metric_type: The type of metric.
            value: The value of the metric.
        """
        DailyMetric.objects.update_or_create(
            date=date,
            metric_type=metric_type,
            defaults={'value': value}
        )


class AnalyticsService:
    """Service for retrieving analytics data."""

    @staticmethod
    def get_dashboard_stats():
        """Get key metrics for admin dashboard.

        Returns:
            dict: Dashboard statistics including users, organizations,
                  subscriptions, and revenue.
        """
        now = timezone.now()
        today = now.date()
        week_ago = today - timedelta(days=7)

        return {
            'users': {
                'total': User.objects.filter(is_active=True).count(),
                'new_today': User.objects.filter(date_joined__date=today).count(),
                'new_this_week': User.objects.filter(date_joined__date__gte=week_ago).count(),
                'active_today': UserSession.objects.filter(
                    last_activity__date=today
                ).values('user').distinct().count(),
            },
            'organizations': {
                'total': Organization.objects.count(),
                'new_today': Organization.objects.filter(created_at__date=today).count(),
                'new_this_week': Organization.objects.filter(created_at__date__gte=week_ago).count(),
            },
            'subscriptions': {
                'active': Subscription.objects.filter(status='active').count(),
                'trial': Subscription.objects.filter(status='trialing').count(),
                'cancelled': Subscription.objects.filter(status='canceled').count(),
                'new_today': Subscription.objects.filter(created_at__date=today).count(),
            },
            'revenue': AnalyticsService._calculate_revenue_stats(),
        }

    @staticmethod
    def _calculate_revenue_stats():
        """Calculate revenue statistics.

        Returns:
            dict: MRR and ARR values.
        """
        active_subs = Subscription.objects.filter(
            status='active'
        ).select_related('plan')

        mrr = sum(
            sub.plan.price if sub.plan.interval == 'month'
            else sub.plan.price / 12
            for sub in active_subs
        )

        return {
            'mrr': float(mrr),
            'arr': float(mrr * 12),
        }

    @staticmethod
    def get_time_series_data(metric_type, days=30):
        """Get time series data for a specific metric.

        Args:
            metric_type: Type of metric to retrieve.
            days: Number of days of data.

        Returns:
            list: List of {date, value} dicts.
        """
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)

        metrics = DailyMetric.objects.filter(
            metric_type=metric_type,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')

        return [
            {
                'date': m.date.isoformat(),
                'value': float(m.value)
            }
            for m in metrics
        ]

    @staticmethod
    def get_recent_activity(limit=50):
        """Get recent activity logs.

        Args:
            limit: Maximum number of logs to return.

        Returns:
            QuerySet: Recent activity logs.
        """
        return ActivityLog.objects.select_related('user').all()[:limit]
