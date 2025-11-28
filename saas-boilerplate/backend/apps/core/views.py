"""
Core views including health checks and utility endpoints.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.db import connection
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """
    Health check endpoint for container orchestration and monitoring.

    Checks:
    - Database connectivity
    - Redis/cache connectivity
    - Basic application health

    Returns 200 OK if all checks pass, 503 Service Unavailable if any fail.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        health_status = {
            'status': 'healthy',
            'checks': {}
        }
        overall_healthy = True

        # Database check
        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            health_status['checks']['database'] = 'healthy'
        except Exception as e:
            logger.error(f'Database health check failed: {e}')
            health_status['checks']['database'] = 'unhealthy'
            overall_healthy = False

        # Cache check
        try:
            cache_key = 'health_check_test'
            cache.set(cache_key, 'test', 10)
            if cache.get(cache_key) == 'test':
                health_status['checks']['cache'] = 'healthy'
            else:
                raise Exception('Cache write/read mismatch')
            cache.delete(cache_key)
        except Exception as e:
            logger.error(f'Cache health check failed: {e}')
            health_status['checks']['cache'] = 'unhealthy'
            overall_healthy = False

        if not overall_healthy:
            health_status['status'] = 'unhealthy'
            return Response(health_status, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(health_status, status=status.HTTP_200_OK)


class ReadinessCheckView(APIView):
    """
    Readiness check endpoint for Kubernetes/ECS.

    Similar to health check but indicates if the service is ready to accept traffic.
    More stringent than liveness check.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        # For now, same as health check
        # In future, could check migration status, required services, etc.
        return HealthCheckView().get(request)


class LivenessCheckView(APIView):
    """
    Liveness check endpoint for Kubernetes/ECS.

    Simple check that the application is running.
    Should not check dependencies (database, cache) as those might be temporarily unavailable.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'alive'}, status=status.HTTP_200_OK)
