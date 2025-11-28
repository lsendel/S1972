from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Subscription, Plan
from .serializers import (
    SubscriptionSerializer,
    PlanSerializer,
    CheckoutSessionRequestSerializer,
    BillingPortalRequestSerializer,
)
from .services import create_checkout_session, create_billing_portal_session
from apps.organizations.models import Organization, Membership

class PlanListView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        plans = Plan.objects.filter(is_active=True).order_by('display_order')
        serializer = PlanSerializer(plans, many=True)
        return Response(serializer.data)

class SubscriptionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
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


class CreateCheckoutSessionView(views.APIView):
    """
    Starts a Stripe Checkout session for an organization's plan change/purchase.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSessionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        org = get_object_or_404(
            Organization,
            slug=data['organization'],
            memberships__user=request.user,
        )
        membership = org.memberships.filter(user=request.user).first()
        if membership and membership.role != Membership.ROLE_OWNER:
            return Response({"detail": "Only organization owners can manage billing."}, status=status.HTTP_403_FORBIDDEN)
        plan = get_object_or_404(Plan, id=data['plan_id'], is_active=True)

        session = create_checkout_session(
            organization=org,
            plan=plan,
            billing_cycle=data['billing_cycle'],
            success_url=data['success_url'],
            cancel_url=data['cancel_url'],
            user_email=request.user.email,
        )

        return Response(
            {
                "checkout_url": session.url,
                "session_id": session.id,
            },
            status=status.HTTP_200_OK,
        )


class CreateBillingPortalView(views.APIView):
    """
    Provides a Stripe Billing Portal session for self-service subscription management.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BillingPortalRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        org = get_object_or_404(
            Organization,
            slug=data['organization'],
            memberships__user=request.user,
        )
        membership = org.memberships.filter(user=request.user).first()
        if membership and membership.role != Membership.ROLE_OWNER:
            return Response({"detail": "Only organization owners can manage billing."}, status=status.HTTP_403_FORBIDDEN)

        if not org.stripe_customer_id:
            return Response(
                {"detail": "Organization has no Stripe customer yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = create_billing_portal_session(
            organization=org,
            return_url=data['return_url'],
        )

        return Response(
            {
                "portal_url": session["url"],
                "session_id": session["id"],
            },
            status=status.HTTP_200_OK,
        )
