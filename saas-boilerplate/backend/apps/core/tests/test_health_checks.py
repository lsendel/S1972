"""
Tests for health check endpoints.

These endpoints are critical for container orchestration (K8s, ECS) and monitoring.
"""
import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestHealthCheckView:
    """Tests for main health check endpoint."""

    def test_health_check_all_systems_healthy(self, api_client):
        """Test health check returns 200 when all systems are healthy."""
        url = reverse('core:health')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'healthy'
        assert 'checks' in response.data
        assert response.data['checks']['database'] == 'healthy'
        assert response.data['checks']['cache'] == 'healthy'

    def test_health_check_database_failure(self, api_client):
        """Test health check returns 503 when database is unhealthy."""
        url = reverse('core:health')

        with patch('django.db.connection.cursor') as mock_cursor:
            mock_cursor.side_effect = Exception('Database connection failed')
            response = api_client.get(url)

            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            assert response.data['status'] == 'unhealthy'
            assert response.data['checks']['database'] == 'unhealthy'

    def test_health_check_cache_failure(self, api_client):
        """Test health check returns 503 when cache is unhealthy."""
        url = reverse('core:health')

        with patch('django.core.cache.cache.set') as mock_cache_set:
            mock_cache_set.side_effect = Exception('Cache unavailable')
            response = api_client.get(url)

            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            assert response.data['status'] == 'unhealthy'
            assert response.data['checks']['cache'] == 'unhealthy'

    def test_health_check_cache_write_read_mismatch(self, api_client):
        """Test health check fails if cache write/read doesn't match."""
        url = reverse('core:health')

        with patch('django.core.cache.cache.get', return_value='wrong_value'):
            response = api_client.get(url)

            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
            assert response.data['status'] == 'unhealthy'

    def test_health_check_requires_no_authentication(self, api_client):
        """Test health check endpoint is public (for load balancers)."""
        url = reverse('core:health')
        response = api_client.get(url)

        # Should work without authentication
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]

    def test_health_check_detailed_endpoint(self, api_client):
        """Test health check works on /health/ endpoint too."""
        url = reverse('core:health-detailed')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'checks' in response.data


@pytest.mark.django_db
class TestReadinessCheckView:
    """Tests for readiness check endpoint (Kubernetes)."""

    def test_readiness_check_healthy(self, api_client):
        """Test readiness check returns 200 when service is ready."""
        url = reverse('core:readiness')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'healthy'

    def test_readiness_check_unhealthy_database(self, api_client):
        """Test readiness check returns 503 when database is down."""
        url = reverse('core:readiness')

        with patch('django.db.connection.cursor') as mock_cursor:
            mock_cursor.side_effect = Exception('Database connection failed')
            response = api_client.get(url)

            assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

    def test_readiness_check_requires_no_authentication(self, api_client):
        """Test readiness check is public (for K8s probes)."""
        url = reverse('core:readiness')
        response = api_client.get(url)

        assert response.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]


@pytest.mark.django_db
class TestLivenessCheckView:
    """Tests for liveness check endpoint (Kubernetes)."""

    def test_liveness_check_always_returns_alive(self, api_client):
        """Test liveness check returns 200 if application is running."""
        url = reverse('core:liveness')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'alive'

    def test_liveness_check_ignores_database_issues(self, api_client):
        """Test liveness check still returns 200 even if DB is down."""
        url = reverse('core:liveness')

        # Even with database issues, liveness should pass
        # (this is intentional - liveness only checks if app is running)
        with patch('django.db.connection.cursor') as mock_cursor:
            mock_cursor.side_effect = Exception('Database down')
            response = api_client.get(url)

            # Liveness should still pass
            assert response.status_code == status.HTTP_200_OK

    def test_liveness_check_ignores_cache_issues(self, api_client):
        """Test liveness check still returns 200 even if cache is down."""
        url = reverse('core:liveness')

        with patch('django.core.cache.cache.set') as mock_cache:
            mock_cache.side_effect = Exception('Cache down')
            response = api_client.get(url)

            # Liveness should still pass
            assert response.status_code == status.HTTP_200_OK

    def test_liveness_check_requires_no_authentication(self, api_client):
        """Test liveness check is public (for K8s probes)."""
        url = reverse('core:liveness')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
