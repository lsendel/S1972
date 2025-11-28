"""
API URL Configuration

Includes all API endpoints and documentation URLs.
"""
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

app_name = 'api'

urlpatterns = [
    # API Documentation
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='api:schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='api:schema'), name='redoc'),

    # API v1 endpoints
    path('v1/auth/', include('apps.authentication.urls')),
    path('v1/users/', include('apps.accounts.urls')),
    path('v1/organizations/', include('apps.organizations.urls')),
    path('v1/subscriptions/', include('apps.subscriptions.urls')),

    # Health check endpoint
    path('v1/health/', include('apps.core.urls')),
]
