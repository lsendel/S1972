from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Subscription, Plan
from .serializers import SubscriptionSerializer, PlanSerializer
from apps.organizations.models import Organization


class PlanListView(views.APIView):
    """View to list available subscription plans."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """Get list of active plans.

        Args:
            request: The request object.

        Returns:
            Response: List of active plans.
        """
        plans = Plan.objects.filter(is_active=True).order_by('display_order')
        serializer = PlanSerializer(plans, many=True)
        return Response(serializer.data)


class SubscriptionView(views.APIView):
    """View to manage organization subscription."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get subscription details for an organization.

        Args:
            request: The request object containing organization slug.

        Returns:
            Response: Subscription details or 404.
        """
        org_slug = request.query_params.get('organization')
        if not org_slug:
            return Response({"detail": "Organization slug required"}, status=status.HTTP_400_BAD_REQUEST)

        org = get_object_or_404(Organization, slug=org_slug, memberships__user=request.user)

        try:
            subscription = org.subscription
            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            # Return a default free plan structure or 404
            return Response({"detail": "No subscription found"}, status=status.HTTP_404_NOT_FOUND)
