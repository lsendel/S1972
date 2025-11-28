import pytest
from django.urls import reverse
from rest_framework import status
from apps.analytics.models import DailyMetric
from django.utils import timezone
from datetime import timedelta

@pytest.mark.django_db
class TestAnalyticsViewSet:
    def test_dashboard_stats(self, authenticated_client, user):
        # Make user superuser to access analytics
        user.is_superuser = True
        user.save()
        
        url = reverse('analytics:analytics-dashboard')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'users' in response.data
        assert 'revenue' in response.data

    def test_time_series_data(self, authenticated_client, user):
        user.is_superuser = True
        user.save()
        
        # Create some fake data
        today = timezone.now().date()
        DailyMetric.objects.create(date=today, metric_type='subs.cancelled', value=5)
        DailyMetric.objects.create(date=today - timedelta(days=1), metric_type='subs.cancelled', value=3)
        
        url = reverse('analytics:analytics-time-series')
        response = authenticated_client.get(url, {'metric_type': 'subs.cancelled', 'days': 7})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert response.data[0]['value'] == 3.0
        assert response.data[1]['value'] == 5.0

    def test_time_series_missing_metric_type(self, authenticated_client, user):
        user.is_superuser = True
        user.save()
        
        url = reverse('analytics:analytics-time-series')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
