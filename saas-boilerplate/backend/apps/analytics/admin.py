"""Analytics admin configuration."""
from django.contrib import admin
from .models import ActivityLog, DailyMetric, UserSession


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    """Admin configuration for activity logs.

    Allows filtering, searching, and viewing of activity logs.
    Includes request information and metadata in collapsed fieldsets.
    """

    list_display = ['user', 'action', 'created_at', 'ip_address']
    list_filter = ['action', 'created_at']
    search_fields = ['user__email', 'description', 'ip_address']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        (None, {
            'fields': ('user', 'action', 'description')
        }),
        ('Request Information', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DailyMetric)
class DailyMetricAdmin(admin.ModelAdmin):
    """Admin configuration for daily metrics.

    Allows filtering and viewing of aggregated daily metrics.
    """

    list_display = ['date', 'metric_type', 'value']
    list_filter = ['metric_type', 'date']
    search_fields = ['metric_type']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'

    fieldsets = (
        (None, {
            'fields': ('date', 'metric_type', 'value')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    """Admin configuration for user sessions.

    Allows monitoring of user sessions including active status and duration.
    """

    list_display = ['user', 'started_at', 'last_activity', 'is_active', 'ip_address']
    list_filter = ['is_active', 'started_at']
    search_fields = ['user__email', 'ip_address', 'session_key']
    readonly_fields = ['started_at', 'last_activity', 'created_at', 'updated_at']
    date_hierarchy = 'started_at'

    fieldsets = (
        (None, {
            'fields': ('user', 'session_key', 'is_active')
        }),
        ('Session Information', {
            'fields': ('started_at', 'last_activity', 'ended_at')
        }),
        ('Request Information', {
            'fields': ('ip_address', 'user_agent')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
