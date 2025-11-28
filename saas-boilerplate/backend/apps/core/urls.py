"""
Core app URL configuration.

Includes health check and utility endpoints.
"""
from django.urls import path
from .views import HealthCheckView, ReadinessCheckView, LivenessCheckView

app_name = 'core'

urlpatterns = [
    path('', HealthCheckView.as_view(), name='health'),
    path('health/', HealthCheckView.as_view(), name='health-detailed'),
    path('ready/', ReadinessCheckView.as_view(), name='readiness'),
    path('live/', LivenessCheckView.as_view(), name='liveness'),
]
