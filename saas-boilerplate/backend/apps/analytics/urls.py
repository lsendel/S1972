"""
Analytics URL configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalyticsViewSet, ActivityLogViewSet, UserSessionViewSet

router = DefaultRouter()
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log')
router.register(r'sessions', UserSessionViewSet, basename='session')

app_name = 'analytics'

urlpatterns = [
    path('', include(router.urls)),
]
