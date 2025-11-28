"""
Analytics API views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import ActivityLog, DailyMetric, UserSession
from .serializers import (
    ActivityLogSerializer,
    DailyMetricSerializer,
    DashboardStatsSerializer,
    UserSessionSerializer,
)
from .services import AnalyticsService, MetricsAggregator
from .permissions import IsSuperUser


class AnalyticsViewSet(viewsets.ViewSet):
    """
    Analytics and metrics endpoints.

    Provides dashboard statistics, time series data, and activity logs.
    """
    permission_classes = [IsSuperUser]

    @extend_schema(
        summary="Get dashboard statistics",
        description="Retrieve key metrics for the admin dashboard including users, organizations, subscriptions, and revenue.",
        responses={200: DashboardStatsSerializer},
        tags=['Analytics'],
    )
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard statistics."""
        stats = AnalyticsService.get_dashboard_stats()
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)

    @extend_schema(
        summary="Get time series data",
        description="Retrieve time series data for a specific metric over a specified number of days.",
        parameters=[
            OpenApiParameter(
                name='metric_type',
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description='Type of metric (e.g., users.new, revenue.mrr)',
            ),
            OpenApiParameter(
                name='days',
                type=int,
                location=OpenApiParameter.QUERY,
                required=False,
                description='Number of days of data (default: 30)',
            ),
        ],
        tags=['Analytics'],
    )
    @action(detail=False, methods=['get'])
    def time_series(self, request):
        """Get time series data for a metric."""
        metric_type = request.query_params.get('metric_type')
        days = int(request.query_params.get('days', 30))

        if not metric_type:
            return Response(
                {'error': 'metric_type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = AnalyticsService.get_time_series_data(metric_type, days)
        return Response(data)

    @extend_schema(
        summary="Aggregate daily metrics",
        description="Manually trigger aggregation of daily metrics. Normally runs automatically via Celery.",
        tags=['Analytics'],
    )
    @action(detail=False, methods=['post'])
    def aggregate(self, request):
        """Manually trigger metrics aggregation."""
        MetricsAggregator.aggregate_daily_metrics()
        return Response({'status': 'Metrics aggregated successfully'})


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Activity log endpoints.

    Provides access to the audit trail of user and system actions.
    """
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsSuperUser]
    filterset_fields = ['action', 'user']
    search_fields = ['description', 'user__email']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    @extend_schema(
        summary="List activity logs",
        description="Retrieve a paginated list of activity logs with filtering and search capabilities.",
        tags=['Analytics'],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Get activity log details",
        description="Retrieve detailed information about a specific activity log entry.",
        tags=['Analytics'],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    User session endpoints.

    Provides information about user sessions for analytics.
    """
    queryset = UserSession.objects.select_related('user').all()
    serializer_class = UserSessionSerializer
    permission_classes = [IsSuperUser]
    filterset_fields = ['user', 'is_active']
    ordering_fields = ['started_at', 'last_activity']
    ordering = ['-started_at']

    @extend_schema(
        summary="List user sessions",
        description="Retrieve a paginated list of user sessions.",
        tags=['Analytics'],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Get active sessions",
        description="Retrieve currently active user sessions.",
        tags=['Analytics'],
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get currently active sessions."""
        active_sessions = self.queryset.filter(is_active=True)
        page = self.paginate_queryset(active_sessions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(active_sessions, many=True)
        return Response(serializer.data)
