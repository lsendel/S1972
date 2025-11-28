"""
Analytics serializers
"""
from rest_framework import serializers
from .models import ActivityLog, DailyMetric, UserSession


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for activity logs."""

    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'user',
            'user_email',
            'user_name',
            'action',
            'action_display',
            'description',
            'ip_address',
            'metadata',
            'created_at',
        ]
        read_only_fields = fields


class DailyMetricSerializer(serializers.ModelSerializer):
    """Serializer for daily metrics."""

    metric_display = serializers.CharField(source='get_metric_type_display', read_only=True)

    class Meta:
        model = DailyMetric
        fields = [
            'id',
            'date',
            'metric_type',
            'metric_display',
            'value',
            'metadata',
        ]
        read_only_fields = fields


class TimeSeriesDataSerializer(serializers.Serializer):
    """Serializer for time series data."""

    date = serializers.DateField()
    value = serializers.DecimalField(max_digits=12, decimal_places=2)


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""

    users = serializers.DictField()
    organizations = serializers.DictField()
    subscriptions = serializers.DictField()
    revenue = serializers.DictField()


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for user sessions."""

    user_email = serializers.CharField(source='user.email', read_only=True)
    duration_seconds = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = [
            'id',
            'user',
            'user_email',
            'ip_address',
            'started_at',
            'last_activity',
            'ended_at',
            'is_active',
            'duration_seconds',
        ]
        read_only_fields = fields

    def get_duration_seconds(self, obj):
        """Get session duration in seconds."""
        return obj.duration.total_seconds()
